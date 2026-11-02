//! JSON pointer remapping.

use std::collections::BTreeMap;

use anyhow::{Context as _, anyhow};
use serde_json::{Map, Value};

use super::{
    spec::{Collect, JsonMapValue},
    transform,
};
use crate::Result;

/// A follow-up response, searchable by a key pointer.
#[derive(Debug)]
pub struct JoinTable {
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
    fn alternatives_pick_the_first_existing_pointer() {
        let doc = json!({ "creator": "new", "user": "old", "other": { "user": "x" } });
        assert_eq!(lookup(&doc, "/creator|/user").unwrap(), "new");
        assert_eq!(
            lookup(&json!({ "user": "old" }), "/creator|/user").unwrap(),
            "old"
        );
        lookup(&doc, "/missing|/gone").unwrap_err();
    }
}
