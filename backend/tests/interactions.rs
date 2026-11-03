//! An action a signed-in visitor takes on an image, against a stand-in for
//! Philomena: the CSRF token travels in a header for a JSON body, `up` is a
//! real boolean, the fingerprint cookie goes along, and the site's JSON answer
//! is what comes back.

use std::collections::BTreeMap;

use axum::{
    Json, Router,
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use backend::mapping::{
    Context, Document, FormRejected, OPENAPI_JSON, Session, Throttle, extract, fetch,
    select_strategy,
};
use serde_json::{Value, json};

async fn home() -> &'static str {
    r#"<html><head><meta content="tok" name="csrf-token"></head><body></body></html>"#
}

fn header_value(headers: &HeaderMap, name: &str) -> String {
    headers
        .get(name)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default()
        .to_owned()
}

fn vote(headers: &HeaderMap, body: &Value) -> Response {
    let cookies = header_value(headers, "cookie");
    let allowed = cookies.contains("_philomena_key=s")
        && cookies.contains("_ses=d")
        && header_value(headers, "x-csrf-token") == "tok";
    if !allowed {
        // What the site does with a visitor it does not accept.
        return (StatusCode::FOUND, [(header::LOCATION, "/")]).into_response();
    }
    // A real boolean, not the text "true".
    let up = body.get("up") == Some(&json!(true));
    Json(json!({ "score": if up { 1 } else { -1 }, "upvotes": 1, "downvotes": 0, "faves": 0 }))
        .into_response()
}

fn unvote(headers: &HeaderMap, body: &str) -> Response {
    // A form with the real verb in `_method`, token in the field.
    if header_value(headers, "cookie").contains("_philomena_key=s")
        && body.contains("_csrf_token=tok")
        && body.contains("_method=DELETE")
    {
        return Json(json!({ "score": 0, "upvotes": 0, "downvotes": 0, "faves": 0 }))
            .into_response();
    }
    (StatusCode::FOUND, [(header::LOCATION, "/")]).into_response()
}

async fn serve() -> String {
    let app = Router::new().route("/", get(home)).route(
        "/images/7/vote",
        post(|h: HeaderMap, b: String| async move {
            // One path, two verbs: a JSON body is a vote, a form is taking it back.
            if header_value(&h, "content-type").starts_with("application/json") {
                serde_json::from_str::<Value>(&b).map_or_else(
                    |_| StatusCode::BAD_REQUEST.into_response(),
                    |body| vote(&h, &body),
                )
            } else {
                unvote(&h, &b)
            }
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let origin = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    origin
}

async fn run(
    origin: &str,
    operation: &str,
    session: &Session,
    params: &[(&str, &str)],
) -> anyhow::Result<Value> {
    let document = Document::parse(OPENAPI_JSON).unwrap();
    let op = document.operation(operation).unwrap();
    let strategy = select_strategy(op, "philomena").unwrap();
    let ctx = Context {
        origin,
        flavor: "philomena",
        api_key: None,
        session: Some(session),
    };
    let params: BTreeMap<String, String> = params
        .iter()
        .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
        .collect();
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .unwrap();
    let responses = fetch(&client, &Throttle::default(), ctx, strategy, &params).await?;
    extract(strategy, &responses, ctx, &params)
}

fn visitor() -> Session {
    let session = Session::from_cookie_header("_philomena_key=s");
    session.ensure_fingerprint();
    session
}

#[tokio::test]
async fn a_vote_is_sent_as_json_and_the_counters_come_back() {
    let origin = serve().await;
    let up = run(
        &origin,
        "voteImage",
        &visitor(),
        &[("id", "7"), ("up", "true")],
    )
    .await
    .unwrap();
    assert_eq!(up.get("score"), Some(&json!(1)));
    let down = run(
        &origin,
        "voteImage",
        &visitor(),
        &[("id", "7"), ("up", "false")],
    )
    .await
    .unwrap();
    assert_eq!(
        down.get("score"),
        Some(&json!(-1)),
        "`up` went out as a real boolean"
    );
}

#[tokio::test]
async fn taking_a_vote_back_is_a_form_with_the_verb_in_a_field() {
    let origin = serve().await;
    let counters = run(&origin, "removeVote", &visitor(), &[("id", "7")])
        .await
        .unwrap();
    assert_eq!(counters.get("score"), Some(&json!(0)));
}

#[tokio::test]
async fn a_visitor_the_site_does_not_accept_is_told_to_sign_in() {
    let origin = serve().await;
    let stranger = Session::default();
    let error = run(
        &origin,
        "voteImage",
        &stranger,
        &[("id", "7"), ("up", "true")],
    )
    .await
    .unwrap_err();
    assert!(error.downcast_ref::<FormRejected>().is_some());
}
