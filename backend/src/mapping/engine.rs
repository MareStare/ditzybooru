//! Strategy selection, request planning and response extraction.

use std::{collections::BTreeMap, fmt::Write as _};

use anyhow::{Context as _, anyhow, bail};
use serde_json::Value;

use super::{
    html, json,
    session::Session,
    spec::{Document, FormStrategy, Operation, Strategy, UpstreamRequest},
    throttle::{RateLimited, Throttle},
};
use crate::Result;

/// The upstream answered with a non-success status.
#[derive(Debug)]
pub struct UpstreamStatus(pub reqwest::StatusCode);

impl std::fmt::Display for UpstreamStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "upstream returned {}", self.0)
    }
}

impl std::error::Error for UpstreamStatus {}

/// The upstream refused the API key, or answered a keyed request with an empty
/// body, which is how Philomena treats a key it does not know.
#[derive(Debug)]
pub struct InvalidApiKey;

impl std::fmt::Display for InvalidApiKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "the upstream does not know this API key")
    }
}

impl std::error::Error for InvalidApiKey {}

/// A form submission the site turned down. The messages are the site's own
/// words about why (a wrong password, a failed captcha).
#[derive(Debug)]
pub struct FormRejected(pub String);

impl std::fmt::Display for FormRejected {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "the site rejected the form: {}", self.0)
    }
}

impl std::error::Error for FormRejected {}

/// The upstream instance a request is made against.
#[derive(Debug, Clone, Copy)]
pub struct Context<'a> {
    /// Origin without a trailing slash, e.g. `http://localhost:8080`.
    pub origin: &'a str,
    /// Flavor name used to filter strategies, e.g. `furbooru`.
    pub flavor: &'a str,
    /// The visitor's Philomena API key, sent upstream as `key` on every
    /// request of the operation. Never logged.
    pub api_key: Option<&'a str>,
    /// The visitor's upstream session cookies, for the operations that act as
    /// them, and where what the upstream sets is collected.
    pub session: Option<&'a Session>,
}

/// The first strategy whose flavors admit `flavor`.
pub fn select_strategy<'a>(op: &'a Operation, flavor: &str) -> Option<&'a Strategy> {
    op.strategies
        .iter()
        .find(|s| s.flavors().is_empty() || s.flavors().iter().any(|f| f == flavor))
}

fn percent_encode(value: &str) -> String {
    let mut out = String::new();
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'.' | b'_' | b'~') {
            out.push(char::from(byte));
        } else {
            // Writing to a String cannot fail.
            let _ = write!(out, "%{byte:02X}");
        }
    }
    out
}

/// Splits `{name}` / `{name|default}` placeholders out of a template.
fn placeholders(template: &str) -> Result<Vec<(&str, Option<&str>)>> {
    let mut found = vec![];
    let mut rest = template;
    while let Some(start) = rest.find('{') {
        let tail = rest.get(start + 1..).unwrap_or_default();
        let end = tail
            .find('}')
            .ok_or_else(|| anyhow!("unclosed placeholder in {template:?}"))?;
        let inner = tail.get(..end).unwrap_or_default();
        found.push(
            inner
                .split_once('|')
                .map_or((inner, None), |(n, d)| (n, Some(d))),
        );
        rest = tail.get(end + 1..).unwrap_or_default();
    }
    Ok(found)
}

/// Fills a template, percent-encoding the values, for a URL or a form; `None`
/// when a placeholder has neither a value nor a default.
fn fill(template: &str, params: &BTreeMap<String, String>) -> Result<Option<String>> {
    fill_with(template, params, true)
}

/// [`fill`], with the values as they are or encoded.
fn fill_with(
    template: &str,
    params: &BTreeMap<String, String>,
    encode: bool,
) -> Result<Option<String>> {
    let mut out = String::new();
    let mut rest = template;
    while let Some(start) = rest.find('{') {
        let (head, tail) = rest.split_at(start);
        out.push_str(head);
        let end = tail
            .find('}')
            .ok_or_else(|| anyhow!("unclosed placeholder in {template:?}"))?;
        let inner = tail.get(1..end).unwrap_or_default();
        let (name, default) = inner
            .split_once('|')
            .map_or((inner, None), |(n, d)| (n, Some(d)));
        let Some(value) = params.get(name).map(String::as_str).or(default) else {
            return Ok(None);
        };
        if encode {
            out.push_str(&percent_encode(value));
        } else {
            out.push_str(value);
        }
        rest = tail.get(end + 1..).unwrap_or_default();
    }
    out.push_str(rest);
    Ok(Some(out))
}

/// The request parameters plus the defaults declared in the strategy's
/// templates for the ones that were not given.
pub fn effective_params(
    strategy: &Strategy,
    params: &BTreeMap<String, String>,
) -> Result<BTreeMap<String, String>> {
    let mut all = params.clone();
    add_defaults(strategy.request(), &mut all)?;
    if let Strategy::Json(json_strategy) = strategy {
        if let Some(fanout) = &json_strategy.fanout {
            add_defaults(&fanout.request, &mut all)?;
        }
        for join in &json_strategy.joins {
            add_defaults(&join.request, &mut all)?;
        }
    }
    Ok(all)
}

/// The request parameters the strategy's request templates read, in order.
/// Anything else a client sent cannot change the upstream request, so it is
/// left out of cache keys.
pub fn relevant_params(
    strategy: &Strategy,
    params: &BTreeMap<String, String>,
) -> Result<BTreeMap<String, String>> {
    let mut requests = vec![strategy.request()];
    if let Strategy::Json(json_strategy) = strategy {
        requests.extend(json_strategy.joins.iter().map(|join| &join.request));
        requests.extend(json_strategy.fanout.iter().map(|fanout| &fanout.request));
    }
    let mut kept = BTreeMap::new();
    for request in requests {
        for template in std::iter::once(&request.path).chain(request.query.values()) {
            for (name, _) in placeholders(template)? {
                if let Some(value) = params.get(name) {
                    kept.insert(name.to_owned(), value.clone());
                }
            }
        }
    }
    Ok(kept)
}

/// Inserts the defaults a request's templates declare for missing parameters.
fn add_defaults(request: &UpstreamRequest, all: &mut BTreeMap<String, String>) -> Result<()> {
    let templates = std::iter::once(&request.path).chain(request.query.values());
    for template in templates {
        for (name, default) in placeholders(template)? {
            if let Some(default) = default {
                all.entry(name.to_owned())
                    .or_insert_with(|| default.to_owned());
            }
        }
    }
    Ok(())
}

/// Path plus query of the upstream request, with placeholders filled.
pub fn plan_request(
    request: &UpstreamRequest,
    params: &BTreeMap<String, String>,
) -> Result<String> {
    let mut target = fill(&request.path, params)?
        .ok_or_else(|| anyhow!("missing path parameter in {:?}", request.path))?;
    let mut separator = '?';
    for (key, template) in &request.query {
        // A query parameter whose value was not given is left out.
        let Some(value) = fill(template, params)? else {
            continue;
        };
        target.push(separator);
        separator = '&';
        let _ = write!(target, "{}={value}", percent_encode(key));
    }
    Ok(target)
}

/// A strategy's upstream responses: the main body plus one per join.
#[derive(Debug, Default)]
pub struct Responses {
    /// Body of the strategy's own request.
    pub main: String,
    /// Body of each join's follow-up request, by join name.
    pub joins: BTreeMap<String, String>,
    /// Body of each fan-out request, in the order of the first response's
    /// elements. Empty when that request failed.
    pub fanout: Vec<String>,
    /// For a form: the submission's own response, where a page that is shown
    /// again (rather than redirected from) says what was wrong.
    pub submitted: String,
    /// For a form: where the page read afterwards redirected to, instead of
    /// answering. Then `main` is empty.
    pub location: Option<String>,
}

/// What a request carries.
enum Payload<'a> {
    /// Form fields: names raw, values already percent-encoded.
    Form(&'a [(String, String)]),
    /// A JSON body, and the CSRF token to send in a header.
    Json { body: String, csrf: &'a str },
}

/// What a request came back with.
enum Sent {
    Body(String),
    /// A redirect, with its `Location`. Only form flows expect these.
    Redirect(String),
}

async fn get_text(
    client: &reqwest::Client,
    throttle: &Throttle,
    ctx: Context<'_>,
    request: &UpstreamRequest,
    params: &BTreeMap<String, String>,
) -> Result<String> {
    if request.method != "GET" {
        bail!(
            "a {} request cannot be sent as a plain fetch",
            request.method
        );
    }
    let path = plan_request(request, params)?;
    match send(client, throttle, ctx, &path, None, false).await? {
        Sent::Body(body) => Ok(body),
        Sent::Redirect(_) => bail!("unexpected redirect"),
    }
}

/// The request for `url`: the key (never in logs) and cookies added, and the
/// form body when there is one.
fn build_call(
    client: &reqwest::Client,
    ctx: Context<'_>,
    url: &str,
    payload: Option<&Payload<'_>>,
) -> Result<reqwest::RequestBuilder> {
    let mut target = reqwest::Url::parse(url).with_context(|| format!("bad url {url}"))?;
    if let Some(key) = ctx.api_key {
        target.query_pairs_mut().append_pair("key", key);
    }
    let mut call = match payload {
        Some(_) => client.post(target),
        None => client.get(target),
    };
    if let Some(cookies) = ctx.session.and_then(Session::cookie_header) {
        call = call.header(reqwest::header::COOKIE, cookies);
    }
    match payload {
        Some(Payload::Form(fields)) => {
            let encoded = fields
                .iter()
                // Values are already encoded: `fill` did it, and so did the token.
                .map(|(name, value)| format!("{}={value}", percent_encode(name)))
                .collect::<Vec<_>>()
                .join("&");
            call = call
                .header(
                    reqwest::header::CONTENT_TYPE,
                    "application/x-www-form-urlencoded",
                )
                .body(encoded);
        }
        Some(Payload::Json { body, csrf }) => {
            call = call
                .header(reqwest::header::CONTENT_TYPE, "application/json")
                .header("x-csrf-token", *csrf)
                .body(body.clone());
        }
        None => {}
    }
    Ok(call)
}

/// One upstream request: a `GET`, or a form `POST` when `form` is given (names
/// raw, values already percent-encoded). In the second case a redirect is the
/// normal answer and its body is not read.
async fn send(
    client: &reqwest::Client,
    throttle: &Throttle,
    ctx: Context<'_>,
    path: &str,
    payload: Option<&Payload<'_>>,
    redirect_ok: bool,
) -> Result<Sent> {
    let verb = if payload.is_some() { "POST" } else { "GET" };
    let started = std::time::Instant::now();
    // Without the key: this is what errors and logs show.
    let url = format!("{}{}", ctx.origin, path);
    // Held until the body is read, so the cap covers the whole transfer.
    let _slot = throttle.acquire(ctx.origin, path).await?;
    let call = build_call(client, ctx, &url, payload)?;
    // A `reqwest` error names the URL it failed on, key included.
    let response = call
        .send()
        .await
        .map_err(reqwest::Error::without_url)
        .with_context(|| {
            format!(
                "{verb} {url} (gave up after {} ms)",
                started.elapsed().as_millis()
            )
        })?;
    if let Some(session) = ctx.session {
        session.absorb(response.headers());
    }
    let status = response.status();
    let fail = |error: anyhow::Error| {
        error.context(format!(
            "{verb} {url} (answered after {} ms)",
            started.elapsed().as_millis()
        ))
    };
    // A key Philomena does not know gets 403 on the key-only routes.
    if ctx.api_key.is_some()
        && matches!(
            status,
            reqwest::StatusCode::FORBIDDEN | reqwest::StatusCode::UNAUTHORIZED
        )
    {
        return Err(fail(anyhow::Error::new(InvalidApiKey)));
    }
    if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        let retry_after = response
            .headers()
            .get(reqwest::header::RETRY_AFTER)
            .and_then(|value| value.to_str().ok());
        let retry_after = throttle.cool_down(ctx.origin, retry_after);
        return Err(fail(anyhow::Error::new(RateLimited { retry_after })));
    }
    // Philomena answers its anti-bot challenge with 501 and an HTML page, and
    // a client that ignores it with 500 and an empty body for 15 minutes (any
    // request in that time restarts the clock). Back off, do not retry.
    let challenged = status == reqwest::StatusCode::NOT_IMPLEMENTED
        && response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .is_some_and(|value| value.starts_with("text/html"));
    if challenged {
        let retry_after = throttle.block(ctx.origin, CHALLENGE_BACKOFF);
        return Err(fail(anyhow::Error::new(RateLimited { retry_after })));
    }
    if status == reqwest::StatusCode::INTERNAL_SERVER_ERROR {
        let body = response.text().await.unwrap_or_default();
        if body.is_empty() {
            let retry_after = throttle.block(ctx.origin, BLOCKED_BACKOFF);
            return Err(fail(anyhow::Error::new(RateLimited { retry_after })));
        }
        // The page says what went wrong; the visitor never sees it, the log does.
        return Err(fail(anyhow::Error::new(UpstreamStatus(status)))
            .context(format!("the page says: {}", html::snippet(&body, 300))));
    }
    // A submission answers with a redirect; the page it leads to is read next.
    if (payload.is_some() || redirect_ok) && status.is_redirection() {
        let location = response
            .headers()
            .get(reqwest::header::LOCATION)
            .and_then(|value| value.to_str().ok())
            .unwrap_or_default()
            .to_owned();
        return Ok(Sent::Redirect(location));
    }
    if !status.is_success() {
        return Err(fail(anyhow::Error::new(UpstreamStatus(status))));
    }
    let body = response.text().await.map_err(reqwest::Error::without_url)?;
    if ctx.api_key.is_some() && body.trim().is_empty() {
        return Err(fail(anyhow::Error::new(InvalidApiKey)));
    }
    Ok(Sent::Body(body))
}

/// Performs the strategy's request, then its joins' follow-up requests.
pub async fn fetch(
    client: &reqwest::Client,
    throttle: &Throttle,
    ctx: Context<'_>,
    strategy: &Strategy,
    params: &BTreeMap<String, String>,
) -> Result<Responses> {
    let all = effective_params(strategy, params)?;
    if let Strategy::Form(form) = strategy {
        return fetch_form(client, throttle, ctx, form, &all).await;
    }
    let main = get_text(client, throttle, ctx, strategy.request(), &all).await?;
    let mut joins = BTreeMap::new();
    if let Strategy::Json(json_strategy) = strategy
        && !json_strategy.joins.is_empty()
    {
        let doc: Value = serde_json::from_str(&main).context("upstream body is not JSON")?;
        for join in &json_strategy.joins {
            let mut join_params = all.clone();
            add_defaults(&join.request, &mut join_params)?;
            if let Some(collect) = &join.collect {
                let values = json::collect_values(&doc, collect)?;
                if values.is_empty() {
                    continue;
                }
                join_params.insert(format!("{}Count", collect.param), values.len().to_string());
                join_params.insert(collect.param.clone(), values.join(&collect.separator));
            }
            let body = get_text(client, throttle, ctx, &join.request, &join_params).await?;
            joins.insert(join.name.clone(), body);
        }
    }
    let mut fanout_bodies = vec![];
    if let Strategy::Json(json_strategy) = strategy
        && let Some(fanout) = &json_strategy.fanout
    {
        let doc: Value = serde_json::from_str(&main).context("upstream body is not JSON")?;
        let parents = json::elements(&doc, &fanout.from)?;
        let requests = parents.iter().take(MAX_FANOUT).map(|parent| {
            let mut request_params = all.clone();
            add_defaults(&fanout.request, &mut request_params)?;
            for (name, pointer) in &fanout.bind {
                request_params.insert(name.clone(), json::scalar(parent, pointer)?);
            }
            Ok::<_, anyhow::Error>(request_params)
        });
        let requests: Vec<_> = requests.collect::<Result<_>>()?;
        let results = futures_util::future::join_all(requests.iter().map(|request_params| {
            get_text(client, throttle, ctx, &fanout.request, request_params)
        }))
        .await;
        for result in results {
            fanout_bodies.push(result.unwrap_or_else(|err| {
                eprintln!("fanout request failed: {err:#}");
                String::new()
            }));
        }
    }
    Ok(Responses {
        main,
        joins,
        fanout: fanout_bodies,
        ..Responses::default()
    })
}

/// How long to leave an origin alone after its anti-bot challenge. The
/// documented minimum is 5 seconds.
const CHALLENGE_BACKOFF: std::time::Duration = std::time::Duration::from_secs(15);

/// How long to leave an origin alone once it blocks us. The documented block
/// is 15 minutes; one more minute is the margin.
const BLOCKED_BACKOFF: std::time::Duration = std::time::Duration::from_mins(16);

/// Fetches the form for its token, submits it, then fetches the page it leads
/// to. All three share the session's cookies, so the token matches the cookie.
async fn fetch_form(
    client: &reqwest::Client,
    throttle: &Throttle,
    ctx: Context<'_>,
    form: &FormStrategy,
    params: &BTreeMap<String, String>,
) -> Result<Responses> {
    let page = fill(&form.form.page, params)?
        .ok_or_else(|| anyhow!("missing parameter in {:?}", form.form.page))?;
    let Sent::Body(page_html) = send(client, throttle, ctx, &page, None, false).await? else {
        bail!("{page} redirected, so there is no form to fill");
    };
    let token = html::attribute(&page_html, &form.form.csrf.sel, &form.form.csrf.attr)?
        .ok_or_else(|| anyhow!("no CSRF token on {page}"))?;

    let payload = if form.request.encoding.as_deref() == Some("json") {
        let mut object = serde_json::Map::new();
        for (name, template) in &form.request.body {
            if let Some(value) = fill_with(template, params, false)? {
                // The site's scripts send real booleans, and some forks
                // compare against them.
                let typed = match value.as_str() {
                    "true" => Value::Bool(true),
                    "false" => Value::Bool(false),
                    _ => Value::String(value),
                };
                object.insert(name.clone(), typed);
            }
        }
        (None, Some(Value::Object(object).to_string()))
    } else {
        // Form values go out percent-encoded; `fill` encodes the ones it fills.
        let mut fields = vec![("_csrf_token".to_owned(), percent_encode(&token))];
        // Phoenix reads the real verb of a form from `_method`.
        if form.request.method != "POST" {
            fields.push(("_method".to_owned(), percent_encode(&form.request.method)));
        }
        for (name, template) in &form.request.body {
            if let Some(value) = fill(template, params)? {
                fields.push((name.clone(), value));
            }
        }
        (Some(fields), None)
    };
    let sent = match &payload {
        (Some(fields), _) => Payload::Form(fields),
        (None, Some(body)) => Payload::Json {
            body: body.clone(),
            csrf: &token,
        },
        (None, None) => bail!("nothing to send"),
    };
    let path = plan_request(&form.request, params)?;
    let submitted = match send(client, throttle, ctx, &path, Some(&sent), true).await? {
        Sent::Body(body) => body,
        // A JSON endpoint redirects a visitor it does not accept (no session,
        // no fingerprint) to the home page.
        Sent::Redirect(_) if form.result.json.is_some() => {
            return Err(anyhow::Error::new(FormRejected(
                "the site did not accept this: sign in again".to_owned(),
            )));
        }
        Sent::Redirect(_) => String::new(),
    };
    if form.result.json.is_some() {
        // The response itself is the result: there is no page to read.
        return Ok(Responses {
            submitted,
            ..Responses::default()
        });
    }

    let result = fill(&form.result.page, params)?
        .ok_or_else(|| anyhow!("missing parameter in {:?}", form.result.page))?;
    let (main, location) = match send(client, throttle, ctx, &result, None, true).await? {
        Sent::Body(body) => (body, None),
        Sent::Redirect(location) => (String::new(), Some(location)),
    };
    Ok(Responses {
        main,
        submitted,
        location,
        ..Responses::default()
    })
}

/// The most fan-out requests one response may cause.
const MAX_FANOUT: usize = 20;

/// Turns the upstream responses into our response document.
pub fn extract(
    strategy: &Strategy,
    responses: &Responses,
    ctx: Context<'_>,
    params: &BTreeMap<String, String>,
) -> Result<Value> {
    match strategy {
        Strategy::Json(s) => {
            let doc: Value =
                serde_json::from_str(&responses.main).context("upstream body is not JSON")?;
            if let Some(pointer) = &s.not_found_when_empty
                && json::elements(&doc, pointer)?.is_empty()
            {
                return Err(
                    anyhow::Error::new(UpstreamStatus(reqwest::StatusCode::NOT_FOUND))
                        .context("no such page"),
                );
            }
            let mut tables = BTreeMap::new();
            for join in &s.joins {
                if let Some(body) = responses.joins.get(&join.name) {
                    tables.insert(
                        join.name.clone(),
                        json::JoinTable::parse(body, &join.items, &join.key)?,
                    );
                }
            }
            let all = effective_params(strategy, params)?;
            let doc = match &s.fanout {
                Some(fanout) => json::merge_fanout(&doc, fanout, &responses.fanout, &all)?,
                None => doc,
            };
            json::remap(
                &doc,
                &s.map,
                json::RemapCtx {
                    origin: ctx.origin,
                    params: &all,
                    joins: &tables,
                },
            )
        }
        Strategy::Html(s) => html::select(&responses.main, &s.select, ctx.origin),
        Strategy::Form(form) => {
            if let Some(map) = &form.result.json {
                let doc: Value = serde_json::from_str(&responses.submitted)
                    .context("the site's answer is not JSON")?;
                let all = effective_params(strategy, params)?;
                return json::remap(
                    &doc,
                    map,
                    json::RemapCtx {
                        origin: ctx.origin,
                        params: &all,
                        joins: &BTreeMap::new(),
                    },
                );
            }
            if let Some(location) = &responses.location {
                // A redirect can be the answer (to a second factor's form).
                let path = location
                    .strip_prefix(ctx.origin)
                    .unwrap_or(location)
                    .split('?')
                    .next()
                    .unwrap_or_default();
                return form
                    .result
                    .redirects
                    .iter()
                    .find(|(suffix, _)| path.ends_with(suffix.as_str()))
                    .map(|(_, answer)| answer.clone())
                    .ok_or_else(|| anyhow::Error::new(FormRejected(format!("it led to {path}"))));
            }
            let value = html::select(&responses.main, &form.result.select, ctx.origin)?;
            let accepted = form.result.must.is_empty()
                || form
                    .result
                    .must
                    .iter()
                    .any(|pointer| value.pointer(pointer) == Some(&Value::Bool(true)));
            if !accepted {
                let mut messages = vec![];
                if let Some(css) = &form.result.errors {
                    messages.extend(html::texts(&responses.main, css)?);
                    messages.extend(html::texts(&responses.submitted, css)?);
                }
                return Err(anyhow::Error::new(FormRejected(messages.join(" "))));
            }
            Ok(value)
        }
    }
}

/// Checks `value` against the operation's response schema.
pub fn validate(document: &Document, op: &Operation, value: &Value) -> Result<()> {
    let mut schema = op.response_schema.clone();
    let Value::Object(object) = &mut schema else {
        bail!("response schema is not an object");
    };
    object.insert("components".to_owned(), document.components.clone());
    let validator = jsonschema::validator_for(&schema).map_err(|e| anyhow!("bad schema: {e}"))?;
    let errors: Vec<String> = validator
        .iter_errors(value)
        .map(|e| format!("{} at {}", e, e.instance_path()))
        .collect();
    if errors.is_empty() {
        Ok(())
    } else {
        bail!("schema mismatch:\n  {}", errors.join("\n  "))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(query: &[(&str, &str)]) -> UpstreamRequest {
        UpstreamRequest {
            method: "GET".to_owned(),
            path: "/search/{id}".to_owned(),
            query: query
                .iter()
                .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
                .collect(),
            body: BTreeMap::new(),
            encoding: None,
        }
    }

    fn params(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
        pairs
            .iter()
            .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
            .collect()
    }

    #[test]
    fn query_uses_defaults_and_drops_missing_values() {
        let req = request(&[
            ("page", "{page|1}"),
            ("q", "{q|*}"),
            ("filter_id", "{filterId}"),
        ]);
        let target = plan_request(&req, &params(&[("id", "7"), ("q", "a b&c")])).unwrap();
        assert_eq!(target, "/search/7?page=1&q=a%20b%26c");
    }

    #[test]
    fn missing_path_parameter_is_an_error() {
        plan_request(&request(&[]), &params(&[])).unwrap_err();
    }

    #[test]
    fn an_empty_search_is_a_missing_page() {
        let strategy: Strategy = serde_json::from_str(
            r#"{"kind":"json","request":{"method":"GET","path":"/x"},
                "notFoundWhenEmpty":"/items","map":{"n":"/total"}}"#,
        )
        .unwrap();
        let ctx = Context {
            origin: "http://x",
            flavor: "philomena",
            api_key: None,
            session: None,
        };
        let extract_body = |body: &str| {
            let responses = Responses {
                main: body.to_owned(),
                ..Responses::default()
            };
            extract(&strategy, &responses, ctx, &BTreeMap::new())
        };
        let err = extract_body(r#"{"items":[],"total":0}"#).unwrap_err();
        assert!(matches!(
            err.downcast_ref::<UpstreamStatus>(),
            Some(UpstreamStatus(status)) if *status == reqwest::StatusCode::NOT_FOUND
        ));
        assert_eq!(
            extract_body(r#"{"items":[1],"total":1}"#).unwrap(),
            serde_json::json!({ "n": 1 })
        );
    }

    #[test]
    fn effective_params_add_declared_defaults_only() {
        let strategy: Strategy = serde_json::from_str(
            r#"{"kind":"json","request":{"method":"GET","path":"/x/{id}",
                "query":{"page":"{page|1}","q":"{q}"}},"map":{}}"#,
        )
        .unwrap();
        let all = effective_params(&strategy, &params(&[("id", "3")])).unwrap();
        assert_eq!(all, params(&[("id", "3"), ("page", "1")]));
    }
}
