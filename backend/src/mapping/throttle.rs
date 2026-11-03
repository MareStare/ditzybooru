//! Politeness towards each upstream: a cap on concurrent requests, pacing
//! inside the rate limits Philomena documents, and a cooldown after the
//! upstream pushes back.
//!
//! While an origin cools down, requests to it fail at once without being sent,
//! so a rate limit is not made worse by every visitor retrying. Nothing polls:
//! the cooldown is a deadline that later requests compare against, and pacing
//! sleeps until a computed instant.

use std::{
    collections::{HashMap, VecDeque},
    sync::{Arc, Mutex, PoisonError},
    time::{Duration, Instant},
};

use tokio::sync::{OwnedSemaphorePermit, Semaphore};

/// Concurrent requests per origin.
const MAX_CONCURRENT: usize = 4;

/// Philomena's documented limits are 30 requests per 5 s, and 20 per 10 s for
/// `/api/v1/json/search*`. Stay a little under both.
const NORMAL: Pace = Pace {
    max: 24,
    window: Duration::from_secs(5),
};
const SEARCH: Pace = Pace {
    max: 16,
    window: Duration::from_secs(10),
};

/// The longest a request waits for its turn. Past that it fails with the time
/// to wait, rather than holding a visitor's connection.
const MAX_WAIT: Duration = Duration::from_secs(3);

/// Cooldown when the upstream sends no usable `Retry-After`.
const DEFAULT_COOLDOWN: Duration = Duration::from_secs(30);

/// The longest cooldown one response can cause.
const MAX_COOLDOWN: Duration = Duration::from_secs(300);

/// The upstream is rate limiting us (or was a moment ago).
#[derive(Debug)]
pub struct RateLimited {
    /// How long until requests are sent again.
    pub retry_after: Duration,
}

impl std::fmt::Display for RateLimited {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "upstream is rate limiting, retry in {}s",
            self.retry_after.as_secs()
        )
    }
}

impl std::error::Error for RateLimited {}

/// At most `max` requests start within any `window`.
#[derive(Debug, Clone, Copy)]
struct Pace {
    max: usize,
    window: Duration,
}

/// When the recent requests of one kind were (or are scheduled to be) sent.
#[derive(Debug, Default)]
struct Recent(Mutex<VecDeque<Instant>>);

impl Recent {
    /// Reserves the next send time. `Ok` is how long to wait from `now` (zero
    /// when there is room). `Err` is the wait when it exceeds `MAX_WAIT`, and
    /// nothing is reserved.
    fn reserve(&self, pace: Pace, now: Instant) -> Result<Duration, Duration> {
        let mut sent = self.0.lock().unwrap_or_else(PoisonError::into_inner);
        while sent
            .front()
            .is_some_and(|at| at.checked_add(pace.window).is_some_and(|end| end <= now))
        {
            sent.pop_front();
        }
        // The request `max` places back leaves the window first.
        let at = sent
            .len()
            .checked_sub(pace.max)
            .and_then(|index| sent.get(index))
            .map_or(now, |earlier| *earlier + pace.window);
        let wait = at.saturating_duration_since(now);
        if wait <= MAX_WAIT {
            sent.push_back(at);
        }
        drop(sent);
        if wait > MAX_WAIT { Err(wait) } else { Ok(wait) }
    }
}

#[derive(Debug)]
struct Origin {
    slots: Arc<Semaphore>,
    cooldown_until: Mutex<Option<Instant>>,
    normal: Recent,
    search: Recent,
}

/// Limits per upstream origin.
#[derive(Debug, Default)]
pub struct Throttle {
    origins: Mutex<HashMap<String, Arc<Origin>>>,
}

impl Throttle {
    fn origin(&self, origin: &str) -> Arc<Origin> {
        let mut origins = self.origins.lock().unwrap_or_else(PoisonError::into_inner);
        origins
            .entry(origin.to_owned())
            .or_insert_with(|| {
                Arc::new(Origin {
                    slots: Arc::new(Semaphore::new(MAX_CONCURRENT)),
                    cooldown_until: Mutex::new(None),
                    normal: Recent::default(),
                    search: Recent::default(),
                })
            })
            .clone()
    }

    /// Waits for a free slot and for the request's turn on `origin`, where
    /// `path` decides which rate limit applies. Fails at once while the origin
    /// cools down, also for requests that were already waiting when it started
    /// to, and when the turn is too far away.
    pub async fn acquire(
        &self,
        origin: &str,
        path: &str,
    ) -> Result<OwnedSemaphorePermit, RateLimited> {
        let state = self.origin(origin);
        state.check()?;
        let (recent, pace) = if path.starts_with("/api/v1/json/search") {
            (&state.search, SEARCH)
        } else {
            (&state.normal, NORMAL)
        };
        let wait = recent
            .reserve(pace, Instant::now())
            .map_err(|retry_after| RateLimited { retry_after })?;
        if !wait.is_zero() {
            tokio::time::sleep(wait).await;
        }
        let Ok(permit) = state.slots.clone().acquire_owned().await else {
            // The semaphore is never closed.
            unreachable!("throttle semaphore closed");
        };
        state.check()?;
        Ok(permit)
    }

    /// Stops requests to `origin` for the time `retry_after` says (seconds), or
    /// a default. Returns the cooldown applied.
    pub fn cool_down(&self, origin: &str, retry_after: Option<&str>) -> Duration {
        let duration = retry_after
            .and_then(|value| value.trim().parse::<u64>().ok())
            .map_or(DEFAULT_COOLDOWN, Duration::from_secs)
            .clamp(Duration::from_secs(1), MAX_COOLDOWN);
        self.block(origin, duration)
    }

    /// Stops requests to `origin` for `duration`, however long. Returns it.
    pub fn block(&self, origin: &str, duration: Duration) -> Duration {
        let state = self.origin(origin);
        let until = Instant::now() + duration;
        let mut slot = state
            .cooldown_until
            .lock()
            .unwrap_or_else(PoisonError::into_inner);
        if slot.is_none_or(|current| current < until) {
            *slot = Some(until);
        }
        duration
    }
}

impl Origin {
    fn check(&self) -> Result<(), RateLimited> {
        let slot = self
            .cooldown_until
            .lock()
            .unwrap_or_else(PoisonError::into_inner);
        match *slot {
            Some(until) if until > Instant::now() => Err(RateLimited {
                retry_after: until - Instant::now(),
            }),
            _ => Ok(()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn a_cooling_origin_refuses_without_affecting_others() {
        let throttle = Throttle::default();
        let _slot = throttle.acquire("a", "/x").await.unwrap();
        assert_eq!(throttle.cool_down("a", Some("7")), Duration::from_secs(7));
        let limited = throttle.acquire("a", "/x").await.unwrap_err();
        assert!(limited.retry_after <= Duration::from_secs(7));
        let _slot = throttle.acquire("b", "/x").await.unwrap();
    }

    #[test]
    fn pacing_delays_the_request_past_the_limit() {
        let recent = Recent::default();
        let pace = Pace {
            max: 2,
            window: Duration::from_secs(2),
        };
        let now = Instant::now();
        assert_eq!(recent.reserve(pace, now), Ok(Duration::ZERO));
        assert_eq!(recent.reserve(pace, now), Ok(Duration::ZERO));
        // The third waits until the first leaves the window.
        assert_eq!(recent.reserve(pace, now), Ok(Duration::from_secs(2)));
        // Later arrivals queue behind it, up to `MAX_WAIT`.
        assert_eq!(recent.reserve(pace, now), Ok(Duration::from_secs(2)));
        assert_eq!(recent.reserve(pace, now), Err(Duration::from_secs(4)));
        // After the window has passed there is room again.
        assert_eq!(
            recent.reserve(pace, now + Duration::from_secs(10)),
            Ok(Duration::ZERO)
        );
    }

    #[test]
    fn a_block_outlasts_the_retry_after_cap() {
        let throttle = Throttle::default();
        let hour = Duration::from_secs(3600);
        assert_eq!(throttle.block("a", hour), hour);
    }

    #[test]
    fn cooldown_defaults_and_is_capped() {
        let throttle = Throttle::default();
        assert_eq!(throttle.cool_down("a", None), DEFAULT_COOLDOWN);
        assert_eq!(throttle.cool_down("a", Some("junk")), DEFAULT_COOLDOWN);
        assert_eq!(throttle.cool_down("a", Some("99999")), MAX_COOLDOWN);
    }

    #[tokio::test]
    async fn concurrency_is_capped_per_origin() {
        let throttle = Throttle::default();
        let held: Vec<_> = futures_util::future::join_all(
            (0..MAX_CONCURRENT).map(|_| throttle.acquire("a", "/x")),
        )
        .await;
        assert!(held.iter().all(Result::is_ok));
        let timed_out =
            tokio::time::timeout(Duration::from_millis(50), throttle.acquire("a", "/x"))
                .await
                .is_err();
        assert!(timed_out, "a fifth request must wait for a slot");
        let _slot = throttle.acquire("b", "/x").await.unwrap();
    }
}
