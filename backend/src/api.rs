//! Serves every operation of `api/openapi.json` under `/api/v1`.

use std::{collections::BTreeMap, sync::Arc, time::Duration};

use axum::{
    Json, Router,
    body::Bytes,
    extract::{Path, Query, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{MethodFilter, MethodRouter},
};
use serde_json::{Value, json};

use crate::{
    Result,
    cache::{Failure, Outcome, ResponseCache},
    mapping::{
        Context, Document, FormRejected, InvalidApiKey, OPENAPI_JSON, RateLimited, Session,
        SetCookie, Strategy, Throttle, UpstreamStatus, extract, fetch, relevant_params,
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
    throttle: Throttle,
}

/// Builds the `/api/v1` router.
pub fn router() -> Result<Router> {
    let state = Arc::new(AppState {
        document: Document::parse(OPENAPI_JSON)?,
        client: reqwest::Client::builder()
            .user_agent("ditzybooru")
            // An upstream that stops answering must not hold a visitor's
            // request open until Cloudflare gives up on it.
            .connect_timeout(Duration::from_secs(5))
            .timeout(Duration::from_secs(25))
            // Philomena redirects missing or forbidden pages to the home page
            // or the login form; following it would scrape the wrong page.
            .redirect(reqwest::redirect::Policy::none())
            .build()?,
        sites: Sites::load()?,
        cache: ResponseCache::default(),
        throttle: Throttle::default(),
    });

    // One route per path, with a handler for each method the operations use.
    let mut by_path: BTreeMap<String, MethodRouter<Arc<AppState>>> = BTreeMap::new();
    for (index, op) in state.document.operations.iter().enumerate() {
        let handler = move |State(state): State<Arc<AppState>>,
                            headers: HeaderMap,
                            Path(path): Path<BTreeMap<String, String>>,
                            Query(mut params): Query<BTreeMap<String, String>>,
                            body: Bytes| async move {
            // A JSON body of plain values is more parameters; the path wins
            // over the query, and both over the body.
            let mut all = body_params(&body);
            all.append(&mut params);
            all.extend(path);
            handle(&state, index, &headers, &all).await
        };
        let filter = match op.method.as_str() {
            "post" => MethodFilter::POST,
            "put" => MethodFilter::PUT,
            "patch" => MethodFilter::PATCH,
            "delete" => MethodFilter::DELETE,
            _ => MethodFilter::GET,
        };
        let route = by_path.remove(&op.path).unwrap_or_default();
        by_path.insert(op.path.clone(), route.on(filter, handler));
    }
    let router = by_path
        .into_iter()
        .fold(Router::new(), |router, (path, route)| {
            router.route(&format!("/api/v1{path}"), route)
        });
    Ok(router.with_state(state))
}

/// The plain values of a JSON object body, as text. Anything else is no
/// parameters.
fn body_params(body: &[u8]) -> BTreeMap<String, String> {
    let Ok(Value::Object(object)) = serde_json::from_slice::<Value>(body) else {
        return BTreeMap::new();
    };
    object
        .into_iter()
        .filter_map(|(name, value)| match value {
            Value::String(text) => Some((name, text)),
            Value::Bool(flag) => Some((name, flag.to_string())),
            Value::Number(number) => Some((name, number.to_string())),
            _ => None,
        })
        .collect()
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
    // The visitor's own Philomena API key, for the operations that use one.
    let key = headers.get("x-api-key").and_then(|v| v.to_str().ok());
    let api_key = match (op.auth.as_str(), key) {
        ("api-key", None) => {
            return error(
                StatusCode::UNAUTHORIZED,
                "api_key_required",
                "this needs your API key in the X-Api-Key header",
            );
        }
        ("api-key" | "api-key-optional", key) => key,
        _ => None,
    };
    // The visitor's upstream session, for the operations that act as them. It
    // lives for this call only: the browser keeps the cookie, we just carry it.
    let session = matches!(op.auth.as_str(), "session" | "session+csrf").then(|| {
        Session::from_cookie_header(
            headers
                .get(header::COOKIE)
                .and_then(|v| v.to_str().ok())
                .unwrap_or_default(),
        )
    });
    if let Some(session) = &session {
        session.ensure_fingerprint();
    }
    let secure = headers
        .get("x-forwarded-proto")
        .is_some_and(|proto| proto == "https");
    let ctx = Context {
        origin: &upstream.origin,
        flavor: &upstream.flavor,
        api_key,
        session: session.as_ref(),
    };
    let compute = || compute_outcome(state, &op.id, host, strategy, ctx, params);

    // A response that depends on who is asking must never be shared.
    let shareable = api_key.is_none() && matches!(op.auth.as_str(), "none" | "api-key-optional");
    if !shareable || op.cache_seconds == 0 {
        let result = compute().await.map_err(Arc::new);
        // An action changes what the site would say about the image (its score,
        // its comments), so what we kept of it is out of date.
        if op.method != "get" && result.is_ok() {
            state
                .cache
                .invalidate_prefix(format!("{}|{}|getImage|", upstream.origin, upstream.flavor));
        }
        let cookies = session.map(Session::into_set_cookies).unwrap_or_default();
        return respond(result, None, &cookies, secure);
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
        &[],
        secure,
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
        let responses = fetch(&state.client, &state.throttle, ctx, strategy, params).await?;
        extract(strategy, &responses, ctx, params)
    }
    .await;
    // Cloudflare replaces 502 and 504 bodies with its own page, so upstream
    // failures answer 500 to keep our JSON error readable.
    match result {
        Ok(value) => Ok(Outcome::Json(value.to_string().into())),
        Err(err) => {
            eprintln!("{op_id} (host {host:?}): {err:#}");
            if let Some(limited) = err.downcast_ref::<RateLimited>() {
                return Err(Failure {
                    status: StatusCode::TOO_MANY_REQUESTS,
                    code: "rate_limited",
                    message: "the upstream is rate limiting, try again later".into(),
                    retry_after: Some(limited.retry_after.as_secs().max(1)),
                });
            }
            if let Some(FormRejected(why)) = err.downcast_ref::<FormRejected>() {
                return Err(Failure {
                    status: StatusCode::UNPROCESSABLE_ENTITY,
                    code: "rejected",
                    message: if why.is_empty() {
                        "the site turned this down".into()
                    } else {
                        why.clone().into()
                    },
                    retry_after: None,
                });
            }
            if err.downcast_ref::<InvalidApiKey>().is_some() {
                return Err(Failure {
                    status: StatusCode::UNAUTHORIZED,
                    code: "api_key_invalid",
                    message: "the site does not accept this API key".into(),
                    retry_after: None,
                });
            }
            if err
                .downcast_ref::<reqwest::Error>()
                .is_some_and(reqwest::Error::is_timeout)
            {
                return Err(Failure {
                    status: StatusCode::INTERNAL_SERVER_ERROR,
                    code: "upstream_timeout",
                    message: "the site took too long to answer".into(),
                    retry_after: None,
                });
            }
            match err.downcast_ref::<UpstreamStatus>() {
                Some(UpstreamStatus(status))
                    if *status == reqwest::StatusCode::NOT_FOUND || status.is_redirection() =>
                {
                    Ok(Outcome::NotFound)
                }
                // The site turned a request down: the visitor is not allowed,
                // or what they sent is wrong.
                Some(UpstreamStatus(status))
                    if matches!(
                        *status,
                        reqwest::StatusCode::UNAUTHORIZED | reqwest::StatusCode::FORBIDDEN
                    ) =>
                {
                    Err(Failure {
                        status: StatusCode::UNAUTHORIZED,
                        code: "not_allowed",
                        message: "the site does not allow this: sign in first".into(),
                        retry_after: None,
                    })
                }
                Some(UpstreamStatus(status))
                    if matches!(
                        *status,
                        reqwest::StatusCode::BAD_REQUEST
                            | reqwest::StatusCode::UNPROCESSABLE_ENTITY
                    ) =>
                {
                    Err(Failure {
                        status: StatusCode::UNPROCESSABLE_ENTITY,
                        code: "rejected",
                        message: "the site turned this down".into(),
                        retry_after: None,
                    })
                }
                Some(_) => Err(Failure {
                    status: StatusCode::INTERNAL_SERVER_ERROR,
                    code: "upstream_error",
                    message: "upstream error".into(),
                    retry_after: None,
                }),
                None => Err(Failure {
                    status: StatusCode::INTERNAL_SERVER_ERROR,
                    code: "mapping_error",
                    message: "could not read upstream".into(),
                    retry_after: None,
                }),
            }
        }
    }
}

/// `ttl` is `Some` for a response that may be cached, by us and by browsers.
fn respond(
    result: Result<Outcome, Arc<Failure>>,
    ttl: Option<Duration>,
    cookies: &[SetCookie],
    secure: bool,
) -> Response {
    match result {
        Ok(Outcome::Json(body)) => {
            let cache_control = ttl.map_or_else(
                || "no-store".to_owned(),
                |ttl| format!("public, max-age={}", ttl.as_secs()),
            );
            let mut response = (
                StatusCode::OK,
                [
                    (header::CONTENT_TYPE, "application/json".to_owned()),
                    (header::CACHE_CONTROL, cache_control),
                ],
                body.to_string(),
            )
                .into_response();
            // What the upstream set for the visitor, as it came (minus `Domain`).
            for cookie in cookies {
                if let Ok(value) = HeaderValue::from_str(&cookie.header(secure)) {
                    response.headers_mut().append(header::SET_COOKIE, value);
                }
            }
            response
        }
        Ok(Outcome::NotFound) => error(StatusCode::NOT_FOUND, "not_found", "not found upstream"),
        Err(failure) => {
            let mut response = error(failure.status, failure.code, &failure.message);
            if let Some(seconds) = failure.retry_after {
                response
                    .headers_mut()
                    .insert(header::RETRY_AFTER, seconds.into());
            }
            response
        }
    }
}
