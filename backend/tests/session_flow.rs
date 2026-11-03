//! The sign-in flow against a small stand-in for Philomena: the CSRF token
//! must match the session cookie the form page set, the form must arrive
//! encoded, and the cookie the site sets on success must come back out.

use std::collections::BTreeMap;

use axum::{
    Router,
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::get,
};
use backend::mapping::{
    Context, Document, FormRejected, OPENAPI_JSON, Session, Throttle, extract, fetch,
    select_strategy,
};

const PAGE: &str = r#"<html><head><meta content="tok1" name="csrf-token"></head><body>{BODY}
<div class="js-datastore" data-user-is-signed-in="{SIGNED}" data-user-id="4" data-user-name="Pleb" data-user-slug="Pleb" data-user-role="user"></div></body></html>"#;

fn page(body: &str, signed_in: bool) -> String {
    PAGE.replace("{BODY}", body)
        .replace("{SIGNED}", &signed_in.to_string())
}

fn cookie(headers: &HeaderMap) -> String {
    headers
        .get(header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default()
        .to_owned()
}

async fn form_page() -> Response {
    (
        [(header::SET_COOKIE, "_philomena_key=anon1; path=/; HttpOnly")],
        page("", false),
    )
        .into_response()
}

async fn submit(headers: HeaderMap, body: String) -> Response {
    // The token is for the cookie the form page set, and the form is encoded.
    let matches_session = cookie(&headers).contains("_philomena_key=anon1")
        && body.contains("_csrf_token=tok1")
        && body.contains("user%5Bemail%5D=a%40b.example");
    if matches_session && body.contains("user%5Bpassword%5D=right%26proper") {
        (
            StatusCode::FOUND,
            [
                (header::LOCATION, "/"),
                (
                    header::SET_COOKIE,
                    "_philomena_key=signed; path=/; max-age=3600; HttpOnly; Domain=upstream.example",
                ),
            ],
        )
            .into_response()
    } else {
        page(
            r#"<div class="alert alert-danger">Invalid email or password.</div>"#,
            false,
        )
        .into_response()
    }
}

async fn home(headers: HeaderMap) -> String {
    page("", cookie(&headers).contains("_philomena_key=signed"))
}

async fn serve() -> String {
    let app = Router::new()
        .route("/sessions/new", get(form_page))
        .route("/sessions", axum::routing::post(submit))
        .route("/", get(home));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let origin = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    origin
}

async fn sign_in(origin: &str, password: &str) -> (anyhow::Result<serde_json::Value>, Session) {
    let document = Document::parse(OPENAPI_JSON).unwrap();
    let op = document.operation("createSession").unwrap();
    let strategy = select_strategy(op, "philomena").unwrap();
    let session = Session::default();
    let ctx = Context {
        origin,
        flavor: "philomena",
        api_key: None,
        session: Some(&session),
    };
    let params = BTreeMap::from([
        ("email".to_owned(), "a@b.example".to_owned()),
        ("password".to_owned(), password.to_owned()),
    ]);
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .unwrap();
    let result = async {
        let responses = fetch(&client, &Throttle::default(), ctx, strategy, &params).await?;
        extract(strategy, &responses, ctx, &params)
    }
    .await;
    (result, session)
}

#[tokio::test]
async fn a_good_password_signs_in_and_the_cookie_comes_out() {
    let origin = serve().await;
    let (result, session) = sign_in(&origin, "right&proper").await;
    let user = result.unwrap();
    assert_eq!(user.get("signedIn"), Some(&serde_json::json!(true)));
    assert_eq!(user.get("name"), Some(&serde_json::json!("Pleb")));
    let cookies = session.into_set_cookies();
    assert!(
        cookies
            .iter()
            .any(|c| c.header(true).starts_with("_philomena_key=signed;")),
        "the site's session cookie is passed on"
    );
    assert!(
        cookies.iter().all(|c| !c.header(true).contains("Domain")),
        "the upstream's Domain must not leak"
    );
}

#[tokio::test]
async fn a_bad_password_is_rejected_in_the_sites_words() {
    let origin = serve().await;
    let (result, _) = sign_in(&origin, "wrong").await;
    let error = result.unwrap_err();
    let rejected = error.downcast_ref::<FormRejected>().unwrap();
    assert!(
        rejected.0.contains("Invalid email or password."),
        "{rejected}"
    );
}
