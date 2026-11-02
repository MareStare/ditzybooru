//! Politeness towards each upstream: a cap on concurrent requests, and a
//! cooldown after the upstream says "too many requests".
//!
//! While an origin cools down, requests to it fail at once without being sent,
//! so a rate limit is not made worse by every visitor retrying. Nothing polls:
//! the cooldown is just a deadline that later requests compare against.

use std::{
    collections::HashMap,
    sync::{Arc, Mutex, PoisonError},
    time::{Duration, Instant},
};

use tokio::sync::{OwnedSemaphorePermit, Semaphore};

/// Concurrent requests per origin.
const MAX_CONCURRENT: usize = 4;

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

#[derive(Debug)]
struct Origin {
    slots: Arc<Semaphore>,
    cooldown_until: Mutex<Option<Instant>>,
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
                })
            })
            .clone()
    }

    /// Waits for a free slot on `origin`. Fails at once while it cools down,
    /// also for requests that were already waiting when it started to.
    pub async fn acquire(&self, origin: &str) -> Result<OwnedSemaphorePermit, RateLimited> {
        let state = self.origin(origin);
        state.check()?;
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
        let _slot = throttle.acquire("a").await.unwrap();
        assert_eq!(throttle.cool_down("a", Some("7")), Duration::from_secs(7));
        let limited = throttle.acquire("a").await.unwrap_err();
        assert!(limited.retry_after <= Duration::from_secs(7));
        let _slot = throttle.acquire("b").await.unwrap();
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
        let held: Vec<_> =
            futures_util::future::join_all((0..MAX_CONCURRENT).map(|_| throttle.acquire("a")))
                .await;
        assert!(held.iter().all(Result::is_ok));
        let timed_out = tokio::time::timeout(Duration::from_millis(50), throttle.acquire("a"))
            .await
            .is_err();
        assert!(timed_out, "a fifth request must wait for a slot");
        let _slot = throttle.acquire("b").await.unwrap();
    }
}
