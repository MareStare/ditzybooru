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

/// The first element after `scope`, among its siblings, that matches `selector`.
fn following<'a>(scope: ElementRef<'a>, selector: &Selector) -> Option<ElementRef<'a>> {
    scope
        .next_siblings()
        .filter_map(ElementRef::wrap)
        .find(|sibling| selector.matches(sibling))
}

/// The text of an HTML page on one line, cut to `limit` characters: enough to
/// tell what an error page says, for a log.
pub fn snippet(body: &str, limit: usize) -> String {
    let document = Html::parse_document(body);
    let text = document.root_element().text().collect::<Vec<_>>().join(" ");
    text.split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(limit)
        .collect()
}

/// The attribute `attr` of the first element matching `css`, if there is one.
pub fn attribute(body: &str, css: &str, attr: &str) -> Result<Option<String>> {
    let document = Html::parse_document(body);
    let selector = parse_selector(css)?;
    Ok(document
        .select(&selector)
        .next()
        .and_then(|element| element.value().attr(attr))
        .map(str::to_owned))
}

/// The trimmed text of every element matching `css`, without the empty ones and
/// without any `<noscript>` (or what sits in one): a visitor with scripts off
/// is told off there, which says nothing about the page they asked for.
pub fn texts(body: &str, css: &str) -> Result<Vec<String>> {
    let document = Html::parse_document(body);
    let selector = parse_selector(css)?;
    Ok(document
        .select(&selector)
        .filter(|element| {
            !std::iter::once(*element)
                .chain(element.ancestors().filter_map(ElementRef::wrap))
                .any(|candidate| candidate.value().name() == "noscript")
        })
        .map(|element| element.text().collect::<String>().trim().to_owned())
        .filter(|text| !text.is_empty())
        .collect())
}

/// The markup of every element sibling after the first one matching `css`.
fn rest_html(scope: ElementRef<'_>, css: &str) -> Result<Value> {
    let marker = following(scope, &parse_selector(css)?)
        .ok_or_else(|| anyhow!("selector {css:?} matched nothing"))?;
    let rest: Vec<String> = marker
        .next_siblings()
        .filter_map(ElementRef::wrap)
        .map(|sibling| sibling.html())
        .collect();
    Ok(Value::String(rest.join("\n")))
}

fn extract(scope: ElementRef<'_>, spec: &FieldSpec, origin: &str) -> Result<Value> {
    if spec.rest
        && spec.html
        && let Some(css) = &spec.after
    {
        return rest_html(scope, css);
    }
    let start: Vec<ElementRef<'_>> = match &spec.after {
        Some(css) => following(scope, &parse_selector(css)?)
            .into_iter()
            .collect(),
        None => vec![scope],
    };
    let targets = match &spec.sel {
        Some(css) => {
            let selector = parse_selector(css)?;
            start
                .into_iter()
                .flat_map(|from| find(from, &selector))
                .collect()
        }
        None => start,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rest_takes_everything_after_the_marker() {
        // The page's own markup has no wrapper around the rendered body: it
        // follows a marker paragraph, as siblings of the heading.
        let spec: SelectSpec = serde_json::from_value(serde_json::json!({
            "root": "h1",
            "fields": { "body": { "after": "p.marker", "rest": true, "html": true } }
        }))
        .unwrap();
        let body =
            "<main><h1>T</h1><p class=\"marker\">m</p><div>x</div><ul><li>y</li></ul></main>";
        assert_eq!(
            select(body, &spec, "").unwrap(),
            serde_json::json!({ "body": "<div>x</div>\n<ul><li>y</li></ul>" })
        );
    }

    #[test]
    fn after_pairs_a_heading_with_the_block_that_follows_it() {
        let spec: SelectSpec = serde_json::from_value(serde_json::json!({
            "fields": { "groups": {
                "sel": "h2", "many": true,
                "fields": {
                    "name": { "text": true },
                    "members": { "after": "ul", "sel": "li", "many": true, "text": true }
                }
            }}
        }))
        .unwrap();
        let body = "<div><h2>A</h2><p>x</p><ul><li>a1</li><li>a2</li></ul>\
                    <h2>B</h2><ul><li>b1</li></ul><h2>C</h2></div>";
        let out = select(body, &spec, "").unwrap();
        assert_eq!(
            out,
            serde_json::json!({ "groups": [
                { "name": "A", "members": ["a1", "a2"] },
                { "name": "B", "members": ["b1"] },
                { "name": "C", "members": [] },
            ]})
        );
    }
}
