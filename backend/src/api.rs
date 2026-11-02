//! Serves every operation of `api/openapi.json` under `/api/v1`.

use std::{collections::BTreeMap, sync::Arc};

use axum::{
    Json, Router,
    extract::{Path, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::get,
};
use serde_json::json;

use crate::{
    Result,
    mapping::{
        Context, Document, OPENAPI_JSON, UpstreamStatus, extract, fetch_body, select_strategy,
    },
    sites::Sites,
};

#[derive(Debug)]
struct AppState {
    document: Document,
    client: reqwest::Client,
    sites: Sites,
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
    });

    let mut router = Router::new();
    for (index, op) in state.document.operations.iter().enumerate() {
        if op.method != "get" {
            continue;
        }
        let handler = move |State(state): State<Arc<AppState>>,
                            headers: HeaderMap,
                            Path(params): Path<BTreeMap<String, String>>| async move {
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
    let upstream = state.sites.resolve(request_host(headers));
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
    let result = async {
        let body = fetch_body(&state.client, ctx, strategy, params).await?;
        extract(strategy, &body, ctx)
    }
    .await;
    match result {
        Ok(value) => Json(value).into_response(),
        Err(err) => {
            eprintln!("{} (host {:?}): {err:#}", op.id, request_host(headers));
            match err.downcast_ref::<UpstreamStatus>() {
                Some(UpstreamStatus(status))
                    if *status == reqwest::StatusCode::NOT_FOUND || status.is_redirection() =>
                {
                    error(StatusCode::NOT_FOUND, "not_found", "not found upstream")
                }
                Some(_) => error(StatusCode::BAD_GATEWAY, "upstream_error", "upstream error"),
                None => error(
                    StatusCode::BAD_GATEWAY,
                    "mapping_error",
                    "could not read upstream",
                ),
            }
        }
    }
}
