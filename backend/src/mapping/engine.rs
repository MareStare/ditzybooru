//! Strategy selection, request planning and response extraction.

use std::{collections::BTreeMap, fmt::Write as _};

use anyhow::{Context as _, anyhow, bail};
use serde_json::Value;

use super::{
    html, json,
    spec::{Document, Operation, Strategy, UpstreamRequest},
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

fn fill(template: &str, params: &BTreeMap<String, String>) -> Result<String> {
    let mut out = String::new();
    let mut rest = template;
    while let Some(start) = rest.find('{') {
        let (head, tail) = rest.split_at(start);
        out.push_str(head);
        let end = tail
            .find('}')
            .ok_or_else(|| anyhow!("unclosed placeholder in {template:?}"))?;
        let name = tail.get(1..end).unwrap_or_default();
        let value = params
            .get(name)
            .ok_or_else(|| anyhow!("missing parameter {name:?}"))?;
        out.push_str(&percent_encode(value));
        rest = tail.get(end + 1..).unwrap_or_default();
    }
    out.push_str(rest);
    Ok(out)
}

/// Path plus query of the upstream request, with placeholders filled.
pub fn plan_request(
    request: &UpstreamRequest,
    params: &BTreeMap<String, String>,
) -> Result<String> {
    let mut target = fill(&request.path, params)?;
    for (i, (key, template)) in request.query.iter().enumerate() {
        target.push(if i == 0 { '?' } else { '&' });
        let _ = write!(
            target,
            "{}={}",
            percent_encode(key),
            fill(template, params)?
        );
    }
    Ok(target)
}

/// Performs the strategy's request and returns the raw response body.
pub async fn fetch_body(
    client: &reqwest::Client,
    ctx: Context<'_>,
    strategy: &Strategy,
    params: &BTreeMap<String, String>,
) -> Result<String> {
    let request = strategy.request();
    if request.method != "GET" {
        bail!("only GET requests are executable so far");
    }
    let url = format!("{}{}", ctx.origin, plan_request(request, params)?);
    let response = client
        .get(&url)
        .send()
        .await
        .with_context(|| format!("GET {url}"))?;
    let status = response.status();
    if !status.is_success() {
        return Err(anyhow::Error::new(UpstreamStatus(status)).context(format!("GET {url}")));
    }
    Ok(response.text().await?)
}

/// Turns a raw upstream body into our response document.
pub fn extract(strategy: &Strategy, body: &str, ctx: Context<'_>) -> Result<Value> {
    match strategy {
        Strategy::Json(s) => {
            let doc: Value = serde_json::from_str(body).context("upstream body is not JSON")?;
            json::remap(&doc, &s.map, ctx.origin)
        }
        Strategy::Html(s) => html::select(body, &s.select, ctx.origin),
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
