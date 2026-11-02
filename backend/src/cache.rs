//! A response cache in front of the upstream.
//!
//! Identical requests that arrive while one is in flight share it, so a burst
//! of visitors causes one fetch rather than many. Successful responses are kept
//! for the operation's lifetime and "not found" briefly, so a bad link does not
//! hit the upstream each time. Errors are never kept.

use std::{
    future::Future,
    sync::Arc,
    time::{Duration, Instant},
};

use axum::http::StatusCode;
use moka::{Expiry, future::Cache};

/// How long "not found" is remembered at most.
const NOT_FOUND_TTL: Duration = Duration::from_secs(30);

/// How many bytes of responses the cache holds.
const MAX_BYTES: u64 = 64 * 1024 * 1024;

/// What a request resolved to.
#[derive(Debug, Clone)]
pub enum Outcome {
    /// The response body, serialized.
    Json(Arc<str>),
    /// The upstream has no such page.
    NotFound,
}

/// A request that failed. Never cached.
#[derive(Debug)]
pub struct Failure {
    pub status: StatusCode,
    pub code: &'static str,
    pub message: &'static str,
}

#[derive(Debug, Clone)]
struct Cached {
    outcome: Outcome,
    ttl: Duration,
}

/// Each entry carries its own lifetime.
#[derive(Debug)]
struct PerEntryTtl;

impl Expiry<String, Cached> for PerEntryTtl {
    fn expire_after_create(
        &self,
        _key: &String,
        value: &Cached,
        _created_at: Instant,
    ) -> Option<Duration> {
        Some(value.ttl)
    }
}

/// Responses by request, with request coalescing.
#[derive(Debug)]
pub struct ResponseCache {
    inner: Cache<String, Cached>,
}

impl Default for ResponseCache {
    fn default() -> Self {
        let inner = Cache::builder()
            .max_capacity(MAX_BYTES)
            .weigher(|key: &String, cached: &Cached| {
                let body = match &cached.outcome {
                    Outcome::Json(body) => body.len(),
                    Outcome::NotFound => 0,
                };
                u32::try_from(key.len() + body).unwrap_or(u32::MAX)
            })
            .expire_after(PerEntryTtl)
            .build();
        Self { inner }
    }
}

impl ResponseCache {
    /// The cached outcome for `key`, or the result of `compute`, shared by every
    /// caller that asks while it runs. `ttl` is how long a success is kept.
    pub async fn get_or_compute<F, Fut>(
        &self,
        key: String,
        ttl: Duration,
        compute: F,
    ) -> Result<Outcome, Arc<Failure>>
    where
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<Outcome, Failure>>,
    {
        self.inner
            .try_get_with(key, async move {
                compute().await.map(|outcome| {
                    let ttl = match outcome {
                        Outcome::NotFound => ttl.min(NOT_FOUND_TTL),
                        Outcome::Json(_) => ttl,
                    };
                    Cached { outcome, ttl }
                })
            })
            .await
            .map(|cached| cached.outcome)
    }
}

#[cfg(test)]
mod tests {
    use std::sync::atomic::{AtomicUsize, Ordering};

    use super::*;

    const TTL: Duration = Duration::from_secs(60);

    fn json(text: &str) -> Outcome {
        Outcome::Json(text.into())
    }

    #[tokio::test]
    async fn a_second_request_is_served_from_the_cache() {
        let cache = ResponseCache::default();
        let calls = AtomicUsize::new(0);
        for _ in 0..3 {
            let outcome = cache
                .get_or_compute("k".to_owned(), TTL, || async {
                    calls.fetch_add(1, Ordering::SeqCst);
                    Ok(json("{}"))
                })
                .await
                .unwrap();
            assert!(matches!(outcome, Outcome::Json(body) if &*body == "{}"));
        }
        assert_eq!(calls.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn concurrent_requests_share_one_fetch() {
        let cache = Arc::new(ResponseCache::default());
        let calls = Arc::new(AtomicUsize::new(0));
        let tasks: Vec<_> = (0..8)
            .map(|_| {
                let (cache, calls) = (cache.clone(), calls.clone());
                tokio::spawn(async move {
                    cache
                        .get_or_compute("k".to_owned(), TTL, || async move {
                            calls.fetch_add(1, Ordering::SeqCst);
                            tokio::time::sleep(Duration::from_millis(50)).await;
                            Ok(json("{}"))
                        })
                        .await
                        .unwrap();
                })
            })
            .collect();
        for task in tasks {
            task.await.unwrap();
        }
        assert_eq!(calls.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn errors_are_not_cached() {
        let cache = ResponseCache::default();
        let calls = AtomicUsize::new(0);
        for _ in 0..2 {
            let failure = cache
                .get_or_compute("k".to_owned(), TTL, || async {
                    calls.fetch_add(1, Ordering::SeqCst);
                    Err(Failure {
                        status: StatusCode::INTERNAL_SERVER_ERROR,
                        code: "upstream_error",
                        message: "upstream error",
                    })
                })
                .await
                .unwrap_err();
            assert_eq!(failure.code, "upstream_error");
        }
        assert_eq!(calls.load(Ordering::SeqCst), 2);
    }

    #[tokio::test]
    async fn not_found_expires_sooner_than_a_success() {
        let cache = ResponseCache::default();
        cache
            .get_or_compute("k".to_owned(), Duration::from_secs(3600), || async {
                Ok(Outcome::NotFound)
            })
            .await
            .unwrap();
        let cached = cache.inner.get("k").await.unwrap();
        assert_eq!(cached.ttl, NOT_FOUND_TTL);
    }
}
