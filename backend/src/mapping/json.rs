//! JSON pointer remapping.

use std::collections::BTreeMap;

use anyhow::{Context as _, anyhow};
use serde_json::{Map, Value};

use super::{
    spec::{Collect, Fanout, JsonMapValue},
    transform,
};
use crate::Result;

/// A follow-up response, searchable by a key pointer.
#[derive(Debug)]
pub struct JoinTable {
    root: Value,
    items: Vec<Value>,
    key: String,
}

impl JoinTable {
    /// Reads the item array of a follow-up response at `items`.
    pub fn parse(body: &str, items: &str, key: &str) -> Result<Self> {
        let doc: Value = serde_json::from_str(body).context("join body is not JSON")?;
        let items = lookup(&doc, items)?
            .as_array()
            .ok_or_else(|| anyhow!("join items {items:?} is not an array"))?
            .clone();
        Ok(Self {
            root: doc,
            items,
            key: key.to_owned(),
        })
    }
}

/// What a remap can read besides the document it walks.
#[derive(Debug, Clone, Copy)]
pub struct RemapCtx<'a> {
    /// Origin used to resolve relative URLs.
    pub origin: &'a str,
    /// Effective request parameters, read by `$param:name`.
    pub params: &'a BTreeMap<String, String>,
    /// Follow-up responses by join name.
    pub joins: &'a BTreeMap<String, JoinTable>,
}

/// Builds our document out of `doc` following `map`.
pub fn remap(
    doc: &Value,
    map: &BTreeMap<String, JsonMapValue>,
    ctx: RemapCtx<'_>,
) -> Result<Value> {
    let mut out = Map::new();
    for (field, rule) in map {
        let value = apply_rule(doc, rule, ctx).with_context(|| format!("field {field:?}"))?;
        out.insert(field.clone(), value);
    }
    Ok(Value::Object(out))
}

fn apply_rule(doc: &Value, rule: &JsonMapValue, ctx: RemapCtx<'_>) -> Result<Value> {
    match rule {
        JsonMapValue::Pointer(pointer) => lookup(doc, pointer).cloned(),
        JsonMapValue::Lookup {
            join,
            key,
            value,
            transform: name,
        } => {
            let table = ctx
                .joins
                .get(join)
                .ok_or_else(|| anyhow!("join {join:?} has no response"))?;
            let wanted = lookup(doc, key)?;
            // An item the follow-up did not return (e.g. hidden by the
            // filter) yields null.
            let found = table
                .items
                .iter()
                .find(|item| item.pointer(&table.key) == Some(wanted))
                .and_then(|item| lookup(item, value).ok())
                .cloned()
                .unwrap_or(Value::Null);
            match name {
                Some(name) => transform::apply(name, &found, ctx.origin),
                None => Ok(found),
            }
        }
        JsonMapValue::JoinedValue { join, at } => {
            let table = ctx
                .joins
                .get(join)
                .ok_or_else(|| anyhow!("join {join:?} has no response"))?;
            lookup(&table.root, at).cloned()
        }
        JsonMapValue::JoinedItems { join, map } => {
            // A follow-up that had nothing to ask for was never sent.
            let items = ctx
                .joins
                .get(join)
                .map_or(&[][..], |table| &table.items[..]);
            Ok(Value::Array(
                items
                    .iter()
                    .map(|item| remap(item, map, ctx))
                    .collect::<Result<_>>()?,
            ))
        }
        JsonMapValue::Nested {
            from,
            transform: name,
            map,
        } => {
            // `$param:name` reads a request parameter instead of the document.
            let param;
            let sub = if let Some(name) = from.strip_prefix("$param:") {
                param = Value::String(
                    ctx.params
                        .get(name)
                        .ok_or_else(|| anyhow!("request parameter {name:?} is missing"))?
                        .clone(),
                );
                &param
            } else {
                lookup(doc, from)?
            };
            let value = match (map, sub) {
                // A map over an array applies to every element.
                (Some(map), Value::Array(items)) => Value::Array(
                    items
                        .iter()
                        .map(|item| remap(item, map, ctx))
                        .collect::<Result<_>>()?,
                ),
                (Some(map), _) => remap(sub, map, ctx)?,
                (None, _) => sub.clone(),
            };
            match name {
                Some(name) => transform::apply(name, &value, ctx.origin),
                None => Ok(value),
            }
        }
    }
}

/// Merges the fan-out responses into `{"items": [{"parent", "item"}]}`, sorted
/// and capped as `fanout` says. An empty body is a request that failed; it is
/// skipped so one broken element does not fail the whole list.
pub fn merge_fanout(
    main: &Value,
    fanout: &Fanout,
    bodies: &[String],
    params: &BTreeMap<String, String>,
) -> Result<Value> {
    let parents = lookup(main, &fanout.from)?
        .as_array()
        .ok_or_else(|| anyhow!("fanout source {:?} is not an array", fanout.from))?;
    let mut merged: Vec<Value> = vec![];
    for (parent, body) in parents.iter().zip(bodies) {
        if body.is_empty() {
            continue;
        }
        let doc: Value = serde_json::from_str(body).context("fanout body is not JSON")?;
        let items = lookup(&doc, &fanout.items)?
            .as_array()
            .ok_or_else(|| anyhow!("fanout items {:?} is not an array", fanout.items))?;
        for item in items {
            merged.push(serde_json::json!({ "parent": parent, "item": item }));
        }
    }
    let sort_key = |entry: &Value| -> Value {
        entry
            .pointer("/item")
            .and_then(|item| lookup(item, &fanout.sort_by).ok())
            .cloned()
            .unwrap_or(Value::Null)
    };
    merged.sort_by(|a, b| {
        let ordering = compare(&sort_key(a), &sort_key(b));
        if fanout.descending {
            ordering.reverse()
        } else {
            ordering
        }
    });
    if let Some(limit) = fanout.limit.as_ref().and_then(|name| params.get(name)) {
        merged.truncate(
            limit
                .parse::<usize>()
                .context("fanout limit is not a number")?,
        );
    }
    Ok(serde_json::json!({ "items": merged }))
}

/// Orders numbers numerically and everything else as text (ISO timestamps
/// sort correctly that way).
fn compare(a: &Value, b: &Value) -> std::cmp::Ordering {
    match (a.as_f64(), b.as_f64()) {
        (Some(x), Some(y)) => x.total_cmp(&y),
        _ => a
            .as_str()
            .unwrap_or_default()
            .cmp(b.as_str().unwrap_or_default()),
    }
}

/// The array at `pointer`.
pub fn elements<'a>(doc: &'a Value, pointer: &str) -> Result<&'a [Value]> {
    lookup(doc, pointer)?
        .as_array()
        .map(Vec::as_slice)
        .ok_or_else(|| anyhow!("{pointer:?} is not an array"))
}

/// The value at `pointer` as text, for use in a request.
pub fn scalar(doc: &Value, pointer: &str) -> Result<String> {
    let value = lookup(doc, pointer)?;
    Ok(value
        .as_str()
        .map_or_else(|| value.to_string(), str::to_owned))
}

/// The unique values `collect` picks out of `doc`, prefixed, in first-seen order.
pub fn collect_values(doc: &Value, collect: &Collect) -> Result<Vec<String>> {
    let elements = lookup(doc, &collect.from)?
        .as_array()
        .ok_or_else(|| anyhow!("collect source {:?} is not an array", collect.from))?;
    let mut values: Vec<String> = vec![];
    for element in elements {
        let picked = lookup(element, &collect.pick)?;
        let text = picked
            .as_str()
            .map_or_else(|| picked.to_string(), str::to_owned);
        let value = format!("{}{text}", collect.prefix);
        if !values.contains(&value) {
            values.push(value);
        }
    }
    Ok(values)
}

/// Resolves `pointer`, or the first of several `a|b` alternatives that exists.
/// Alternatives cover fields that were renamed between Philomena versions.
fn lookup<'a>(doc: &'a Value, pointer: &str) -> Result<&'a Value> {
    pointer
        .split('|')
        .find_map(|alternative| doc.pointer(alternative))
        .ok_or_else(|| anyhow!("pointer {pointer:?} matched nothing"))
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn joined_items_are_remapped_and_default_to_empty() {
        let map: BTreeMap<String, JsonMapValue> = serde_json::from_value(json!({
            "title": "/title",
            "n": { "join": "images", "at": "/total" },
            "images": { "join": "images", "map": { "id": "/id" } }
        }))
        .unwrap();
        let params = BTreeMap::new();
        let doc = json!({ "title": "g" });

        let table = JoinTable::parse(
            r#"{"total":2,"images":[{"id":7},{"id":9}]}"#,
            "/images",
            "/id",
        )
        .unwrap();
        let joins = BTreeMap::from([("images".to_owned(), table)]);
        let ctx = RemapCtx {
            origin: "",
            params: &params,
            joins: &joins,
        };
        assert_eq!(
            remap(&doc, &map, ctx).unwrap(),
            json!({ "title": "g", "n": 2, "images": [{ "id": 7 }, { "id": 9 }] })
        );

        let none = BTreeMap::new();
        let ctx = RemapCtx {
            origin: "",
            params: &params,
            joins: &none,
        };
        // Without a follow-up there are no items, and no total to read.
        let no_total: BTreeMap<String, JsonMapValue> =
            serde_json::from_value(json!({ "images": { "join": "images", "map": {} } })).unwrap();
        assert_eq!(
            remap(&doc, &no_total, ctx).unwrap(),
            json!({ "images": [] })
        );
        remap(&doc, &map, ctx).unwrap_err();
    }

    #[test]
    fn alternatives_pick_the_first_existing_pointer() {
        let doc = json!({ "creator": "new", "user": "old", "other": { "user": "x" } });
        assert_eq!(lookup(&doc, "/creator|/user").unwrap(), "new");
        assert_eq!(
            lookup(&json!({ "user": "old" }), "/creator|/user").unwrap(),
            "old"
        );
        lookup(&doc, "/missing|/gone").unwrap_err();
    }

    #[test]
    fn fanout_merges_sorts_and_caps() {
        let fanout: Fanout = serde_json::from_value(json!({
            "from": "/forums",
            "request": { "method": "GET", "path": "/x" },
            "bind": {},
            "items": "/topics",
            "sortBy": "/at",
            "descending": true,
            "limit": "limit"
        }))
        .unwrap();
        let main = json!({ "forums": [{ "n": "a" }, { "n": "b" }, { "n": "c" }] });
        let bodies = vec![
            r#"{"topics":[{"at":"2026-01-01"},{"at":"2026-03-01"}]}"#.to_owned(),
            String::new(), // a failed request is skipped
            r#"{"topics":[{"at":"2026-02-01"}]}"#.to_owned(),
        ];
        let params = BTreeMap::from([("limit".to_owned(), "2".to_owned())]);
        let merged = merge_fanout(&main, &fanout, &bodies, &params).unwrap();
        assert_eq!(
            merged,
            json!({ "items": [
                { "parent": { "n": "a" }, "item": { "at": "2026-03-01" } },
                { "parent": { "n": "c" }, "item": { "at": "2026-02-01" } },
            ]})
        );
    }
}
