//! CSS selector extraction with `scraper`.

use std::collections::BTreeMap;

use anyhow::{Context as _, anyhow, bail};
use scraper::{ElementRef, Html, Selector};
use serde_json::{Map, Value};

use super::{
    json,
    spec::{FieldSpec, SelectSpec},
    transform,
};
use crate::Result;

/// Extracts `spec` from the HTML `body`.
pub fn select(body: &str, spec: &SelectSpec, origin: &str) -> Result<Value> {
    let document = Html::parse_document(body);
    let root = match &spec.root {
        Some(css) => {
            let selector = parse_selector(css)?;
            document
                .select(&selector)
                .next()
                .ok_or_else(|| anyhow!("root selector {css:?} matched nothing"))?
        }
        None => document.root_element(),
    };
    extract_fields(root, &spec.fields, origin)
}

fn parse_selector(css: &str) -> Result<Selector> {
    Selector::parse(css).map_err(|e| anyhow!("bad selector {css:?}: {e}"))
}

fn extract_fields(
    scope: ElementRef<'_>,
    fields: &BTreeMap<String, FieldSpec>,
    origin: &str,
) -> Result<Value> {
    let mut out = Map::new();
    for (name, spec) in fields {
        let value = extract(scope, spec, origin).with_context(|| format!("field {name:?}"))?;
        out.insert(name.clone(), value);
    }
    Ok(Value::Object(out))
}

/// Descendants of `scope` matching `selector`, or `scope` itself when it matches.
fn find<'a>(scope: ElementRef<'a>, selector: &Selector) -> Vec<ElementRef<'a>> {
    let found: Vec<_> = scope.select(selector).collect();
    if found.is_empty() && selector.matches(&scope) {
        vec![scope]
    } else {
        found
    }
}

fn extract(scope: ElementRef<'_>, spec: &FieldSpec, origin: &str) -> Result<Value> {
    let targets = match &spec.sel {
        Some(css) => find(scope, &parse_selector(css)?),
        None => vec![scope],
    };
    if spec.exists {
        return Ok(Value::Bool(!targets.is_empty()));
    }
    let describe = || spec.sel.clone().unwrap_or_default();
    if spec.many {
        let items: Result<Vec<_>> = targets
            .into_iter()
            .map(|el| read(el, spec, origin))
            .collect();
        return Ok(Value::Array(items?));
    }
    match targets.into_iter().next() {
        Some(el) => read(el, spec, origin),
        None if spec.optional => Ok(Value::Null),
        None => bail!("selector {:?} matched nothing", describe()),
    }
}

fn read(el: ElementRef<'_>, spec: &FieldSpec, origin: &str) -> Result<Value> {
    if let Some(fields) = &spec.fields {
        return extract_fields(el, fields, origin);
    }
    let raw = if let Some(attr) = &spec.attr {
        match el.value().attr(attr) {
            Some(v) if spec.json => {
                let parsed: Value = serde_json::from_str(v)
                    .with_context(|| format!("attribute {attr:?} is not JSON"))?;
                match &spec.map {
                    Some(map) => json::remap(
                        &parsed,
                        map,
                        json::RemapCtx {
                            origin,
                            params: &BTreeMap::new(),
                            joins: &BTreeMap::new(),
                        },
                    )?,
                    None => parsed,
                }
            }
            Some(v) => Value::String(v.to_owned()),
            None if spec.optional => return Ok(Value::Null),
            None => bail!("attribute {attr:?} missing"),
        }
    } else if spec.html {
        Value::String(el.inner_html())
    } else if spec.text {
        Value::String(el.text().collect::<String>().trim().to_owned())
    } else {
        bail!("field has no attr, text, html, exists or fields reader");
    };
    match &spec.transform {
        Some(name) => transform::apply(name, &raw, origin),
        None => Ok(raw),
    }
}
