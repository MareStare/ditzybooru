//! Strategy selection, request planning and response extraction.

use std::{collections::BTreeMap, fmt::Write as _};

use anyhow::{Context as _, anyhow, bail};
use serde_json::Value;

use super::{
    html, json,
    spec::{Document, Operation, Strategy, UpstreamRequest},
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

/// The upstream instance a request is made against.
#[derive(Debug, Clone, Copy)]
pub struct Context<'a> {
    /// Origin without a trailing slash, e.g. `http://localhost:8080`.
    pub origin: &'a str,
    /// Flavor name used to filter strategies, e.g. `furbooru`.
    pub flavor: &'a str,
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

/// Fills a template; `None` when a placeholder has neither a value nor a default.
fn fill(template: &str, params: &BTreeMap<String, String>) -> Result<Option<String>> {
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
        out.push_str(&percent_encode(value));
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
}

async fn get_text(
    client: &reqwest::Client,
    throttle: &Throttle,
    ctx: Context<'_>,
    request: &UpstreamRequest,
    params: &BTreeMap<String, String>,
) -> Result<String> {
    if request.method != "GET" {
        bail!("only GET requests are executable so far");
    }
    let path = plan_request(request, params)?;
    let url = format!("{}{}", ctx.origin, path);
    // Held until the body is read, so the cap covers the whole transfer.
    let _slot = throttle.acquire(ctx.origin, &path).await?;
    let response = client
        .get(&url)
        .send()
        .await
        .with_context(|| format!("GET {url}"))?;
    let status = response.status();
    if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        let retry_after = response
            .headers()
            .get(reqwest::header::RETRY_AFTER)
            .and_then(|value| value.to_str().ok());
        let retry_after = throttle.cool_down(ctx.origin, retry_after);
        return Err(anyhow::Error::new(RateLimited { retry_after }).context(format!("GET {url}")));
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
        return Err(anyhow::Error::new(RateLimited { retry_after }).context(format!("GET {url}")));
    }
    if status == reqwest::StatusCode::INTERNAL_SERVER_ERROR {
        let body = response.text().await.unwrap_or_default();
        if body.is_empty() {
            let retry_after = throttle.block(ctx.origin, BLOCKED_BACKOFF);
            return Err(
                anyhow::Error::new(RateLimited { retry_after }).context(format!("GET {url}"))
            );
        }
        return Err(anyhow::Error::new(UpstreamStatus(status)).context(format!("GET {url}")));
    }
    if !status.is_success() {
        return Err(anyhow::Error::new(UpstreamStatus(status)).context(format!("GET {url}")));
    }
    Ok(response.text().await?)
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
    let main = get_text(client, throttle, ctx, strategy.request(), &all).await?;
    let mut joins = BTreeMap::new();
    if let Strategy::Json(json_strategy) = strategy
        && !json_strategy.joins.is_empty()
    {
        let doc: Value = serde_json::from_str(&main).context("upstream body is not JSON")?;
        for join in &json_strategy.joins {
            let values = json::collect_values(&doc, &join.collect)?;
            if values.is_empty() {
                continue;
            }
            let mut join_params = all.clone();
            add_defaults(&join.request, &mut join_params)?;
            join_params.insert(
                format!("{}Count", join.collect.param),
                values.len().to_string(),
            );
            join_params.insert(
                join.collect.param.clone(),
                values.join(&join.collect.separator),
            );
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
    })
}

/// How long to leave an origin alone after its anti-bot challenge. The
/// documented minimum is 5 seconds.
const CHALLENGE_BACKOFF: std::time::Duration = std::time::Duration::from_secs(15);

/// How long to leave an origin alone once it blocks us. The documented block
/// is 15 minutes; one more minute is the margin.
const BLOCKED_BACKOFF: std::time::Duration = std::time::Duration::from_mins(16);

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
        Strategy::Form(_) => bail!("form strategies are not executable yet"),
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
