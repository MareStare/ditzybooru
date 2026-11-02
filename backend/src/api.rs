//! Serves every operation of `api/openapi.json` under `/api/v1`.

use std::{collections::BTreeMap, sync::Arc, time::Duration};

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::get,
};
use serde_json::json;

use crate::{
    Result,
    cache::{Failure, Outcome, ResponseCache},
    mapping::{
        Context, Document, OPENAPI_JSON, Strategy, UpstreamStatus, extract, fetch, relevant_params,
        select_strategy,
    },
    sites::Sites,
};

#[derive(Debug)]
struct AppState {
    document: Document,
    client: reqwest::Client,
    sites: Sites,
    cache: ResponseCache,
}

/// Builds the `/api/v1` router.
pub fn router() -> Result<Router> {
    let state = Arc::new(AppState {
        document: Document::parse(OPENAPI_JSON)?,
        client: reqwest::Client::builder()
            .user_agent("ditzybooru")
            // Philomena redirects missing or forbidden pages to the home page
            // or the login form; following it would scrape the wrong page.
            .redirect(reqwest::redirect::Policy::none())
            .build()?,
        sites: Sites::load()?,
        cache: ResponseCache::default(),
    });

    let mut router = Router::new();
    for (index, op) in state.document.operations.iter().enumerate() {
        if op.method != "get" {
            continue;
        }
        let handler =
            move |State(state): State<Arc<AppState>>,
                  headers: HeaderMap,
                  Path(path): Path<BTreeMap<String, String>>,
                  Query(mut params): Query<BTreeMap<String, String>>| async move {
                // Path parameters win over query parameters of the same name.
                params.extend(path);
                handle(&state, index, &headers, &params).await
            };
        router = router.route(&format!("/api/v1{}", op.path), get(handler));
    }
    Ok(router.with_state(state))
}

fn error(status: StatusCode, code: &str, message: &str) -> Response {
    (
        status,
        Json(json!({ "error": { "code": code, "message": message } })),
    )
        .into_response()
}

/// The site host the client asked for. The frontend proxy may forward it as
/// `X-Forwarded-Host`; the backend only listens on loopback, so that header
/// can only come from our own proxies.
fn request_host(headers: &HeaderMap) -> &str {
    ["x-forwarded-host", header::HOST.as_str()]
        .into_iter()
        .find_map(|name| headers.get(name).and_then(|v| v.to_str().ok()))
        .unwrap_or_default()
}

async fn handle(
    state: &AppState,
    index: usize,
    headers: &HeaderMap,
    params: &BTreeMap<String, String>,
) -> Response {
    let Some(op) = state.document.operations.get(index) else {
        return error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "internal",
            "unknown operation",
        );
    };
    let host = request_host(headers);
    let upstream = state.sites.resolve(host);
    let Some(strategy) = select_strategy(op, &upstream.flavor) else {
        return error(
            StatusCode::NOT_IMPLEMENTED,
            "unsupported",
            "unsupported by this upstream",
        );
    };
    let ctx = Context {
        origin: &upstream.origin,
        flavor: &upstream.flavor,
    };
    let compute = || compute_outcome(state, &op.id, host, strategy, ctx, params);

    // A response that depends on who is asking must never be shared.
    if op.auth != "none" || op.cache_seconds == 0 {
        return respond(compute().await.map_err(Arc::new), None);
    }
    let Ok(relevant) = relevant_params(strategy, params) else {
        return error(StatusCode::INTERNAL_SERVER_ERROR, "internal", "bad mapping");
    };
    // Only the parameters the mapping reads count, so junk query strings
    // neither bypass the cache nor fill it.
    let key = format!(
        "{}|{}|{}|{}",
        upstream.origin,
        upstream.flavor,
        op.id,
        serde_json::to_string(&relevant).unwrap_or_default()
    );
    let ttl = Duration::from_secs(op.cache_seconds);
    respond(
        state.cache.get_or_compute(key, ttl, compute).await,
        Some(ttl),
    )
}

/// Fetches and maps one response. "Not found" is a result, anything else that
/// goes wrong a failure.
async fn compute_outcome(
    state: &AppState,
    op_id: &str,
    host: &str,
    strategy: &Strategy,
    ctx: Context<'_>,
    params: &BTreeMap<String, String>,
) -> Result<Outcome, Failure> {
    let result = async {
        let responses = fetch(&state.client, ctx, strategy, params).await?;
        extract(strategy, &responses, ctx, params)
    }
    .await;
    // Cloudflare replaces 502 and 504 bodies with its own page, so upstream
    // failures answer 500 to keep our JSON error readable.
    match result {
        Ok(value) => Ok(Outcome::Json(value.to_string().into())),
        Err(err) => {
            eprintln!("{op_id} (host {host:?}): {err:#}");
            match err.downcast_ref::<UpstreamStatus>() {
                Some(UpstreamStatus(status))
                    if *status == reqwest::StatusCode::NOT_FOUND || status.is_redirection() =>
                {
                    Ok(Outcome::NotFound)
                }
                Some(_) => Err(Failure {
                    status: StatusCode::INTERNAL_SERVER_ERROR,
                    code: "upstream_error",
                    message: "upstream error",
                }),
                None => Err(Failure {
                    status: StatusCode::INTERNAL_SERVER_ERROR,
                    code: "mapping_error",
                    message: "could not read upstream",
                }),
            }
        }
    }
}

/// `ttl` is `Some` for a response that may be cached, by us and by browsers.
fn respond(result: Result<Outcome, Arc<Failure>>, ttl: Option<Duration>) -> Response {
    match result {
        Ok(Outcome::Json(body)) => {
            let cache_control = ttl.map_or_else(
                || "no-store".to_owned(),
                |ttl| format!("public, max-age={}", ttl.as_secs()),
            );
            (
                StatusCode::OK,
                [
                    (header::CONTENT_TYPE, "application/json".to_owned()),
                    (header::CACHE_CONTROL, cache_control),
                ],
                body.to_string(),
            )
                .into_response()
        }
        Ok(Outcome::NotFound) => error(StatusCode::NOT_FOUND, "not_found", "not found upstream"),
        Err(failure) => error(failure.status, failure.code, failure.message),
    }
}
