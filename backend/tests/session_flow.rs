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

const PAGE: &str = r#"<html><head><meta content="tok1" name="csrf-token"></head><body><header><div class="avatar--28px"><img src="/avatars/pleb.png"></div></header>{BODY}
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
    if matches_session && body.contains("user%5Bpassword%5D=totp") {
        // Right password, but this account wants its 2FA code next.
        (
            StatusCode::FOUND,
            [
                (header::LOCATION, "/"),
                (header::SET_COOKIE, "_philomena_key=mid; path=/; HttpOnly"),
            ],
        )
            .into_response()
    } else if matches_session && body.contains("user%5Bpassword%5D=right%26proper") {
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

async fn home(headers: HeaderMap) -> Response {
    let cookies = cookie(&headers);
    if cookies.contains("_philomena_key=mid") {
        // Signed in without the code: every page sends them to its form.
        return (
            StatusCode::FOUND,
            [(header::LOCATION, "/sessions/totp/new")],
        )
            .into_response();
    }
    page("", cookies.contains("_philomena_key=signed")).into_response()
}

/// The code page has no meta tag, only the form's own hidden field.
async fn totp_form() -> String {
    r#"<html><body><form action="/sessions/totp" method="post"><input name="_csrf_token" type="hidden" value="tok2"></form></body></html>"#.to_owned()
}

async fn totp_submit(headers: HeaderMap, body: String) -> Response {
    if cookie(&headers).contains("_philomena_key=mid")
        && body.contains("_csrf_token=tok2")
        && body.contains("user%5Btwofactor_token%5D=123456")
    {
        (
            StatusCode::FOUND,
            [
                (header::LOCATION, "/"),
                (
                    header::SET_COOKIE,
                    "_philomena_key=signed; path=/; HttpOnly",
                ),
            ],
        )
            .into_response()
    } else {
        (StatusCode::FOUND, [(header::LOCATION, "/")]).into_response()
    }
}

async fn serve() -> String {
    let app = Router::new()
        .route("/sessions/new", get(form_page))
        .route("/sessions", axum::routing::post(submit))
        .route("/sessions/totp/new", get(totp_form))
        .route("/sessions/totp", axum::routing::post(totp_submit))
        .route("/", get(home));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let origin = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    origin
}

async fn sign_in(origin: &str, password: &str) -> (anyhow::Result<serde_json::Value>, Session) {
    let session = Session::default();
    let params = BTreeMap::from([
        ("email".to_owned(), "a@b.example".to_owned()),
        ("password".to_owned(), password.to_owned()),
    ]);
    let result = run(origin, "createSession", &session, &params).await;
    (result, session)
}

/// Runs one operation against the stand-in, with the cookies in `session`.
async fn run(
    origin: &str,
    operation: &str,
    session: &Session,
    params: &BTreeMap<String, String>,
) -> anyhow::Result<serde_json::Value> {
    let document = Document::parse(OPENAPI_JSON).unwrap();
    let op = document.operation(operation).unwrap();
    let strategy = select_strategy(op, "philomena").unwrap();
    let ctx = Context {
        origin,
        flavor: "philomena",
        api_key: None,
        session: Some(session),
    };
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .unwrap();
    let responses = fetch(&client, &Throttle::default(), ctx, strategy, params).await?;
    extract(strategy, &responses, ctx, params)
}

#[tokio::test]
async fn a_good_password_signs_in_and_the_cookie_comes_out() {
    let origin = serve().await;
    let (result, session) = sign_in(&origin, "right&proper").await;
    let user = result.unwrap();
    assert_eq!(user.get("signedIn"), Some(&serde_json::json!(true)));
    assert_eq!(user.get("name"), Some(&serde_json::json!("Pleb")));
    // The avatar is the one the site shows in its header, as an address on the site.
    assert_eq!(
        user.get("avatarUrl"),
        Some(&serde_json::json!(format!("{origin}/avatars/pleb.png")))
    );
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

#[tokio::test]
async fn an_account_with_2fa_finishes_with_its_code() {
    let origin = serve().await;
    let (first, session) = sign_in(&origin, "totp").await;
    let first = first.unwrap();
    assert_eq!(first.get("signedIn"), Some(&serde_json::json!(false)));
    assert_eq!(
        first.get("secondFactorRequired"),
        Some(&serde_json::json!(true)),
        "the code is asked for, not a failure"
    );

    // The second step carries the cookie the first one set.
    let params = BTreeMap::from([("code".to_owned(), "123456".to_owned())]);
    let done = run(&origin, "createSessionTotp", &session, &params)
        .await
        .unwrap();
    assert_eq!(done.get("signedIn"), Some(&serde_json::json!(true)));
    let cookies = session.into_set_cookies();
    assert!(
        cookies
            .iter()
            .any(|c| c.header(false).starts_with("_philomena_key=signed;")),
        "the signed-in cookie is the last word"
    );
}

#[tokio::test]
async fn a_wrong_2fa_code_is_rejected() {
    let origin = serve().await;
    let (_, session) = sign_in(&origin, "totp").await;
    let params = BTreeMap::from([("code".to_owned(), "000000".to_owned())]);
    let error = run(&origin, "createSessionTotp", &session, &params)
        .await
        .unwrap_err();
    assert!(error.downcast_ref::<FormRejected>().is_some());
}
