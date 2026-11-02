//! JSON pointer remapping.

use std::collections::BTreeMap;

use anyhow::{Context as _, anyhow};
use serde_json::{Map, Value};

use super::{spec::JsonMapValue, transform};
use crate::Result;

/// Builds our document out of `doc` following `map`.
pub fn remap(
    doc: &Value,
    map: &BTreeMap<String, JsonMapValue>,
    origin: &str,
    params: &BTreeMap<String, String>,
) -> Result<Value> {
    let mut out = Map::new();
    for (field, rule) in map {
        let value =
            apply_rule(doc, rule, origin, params).with_context(|| format!("field {field:?}"))?;
        out.insert(field.clone(), value);
    }
    Ok(Value::Object(out))
}

fn apply_rule(
    doc: &Value,
    rule: &JsonMapValue,
    origin: &str,
    params: &BTreeMap<String, String>,
) -> Result<Value> {
    match rule {
        JsonMapValue::Pointer(pointer) => lookup(doc, pointer).cloned(),
        JsonMapValue::Nested {
            from,
            transform: name,
            map,
        } => {
            // `$param:name` reads a request parameter instead of the document.
            let param;
            let sub = if let Some(name) = from.strip_prefix("$param:") {
                param = Value::String(
                    params
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
                        .map(|item| remap(item, map, origin, params))
                        .collect::<Result<_>>()?,
                ),
                (Some(map), _) => remap(sub, map, origin, params)?,
                (None, _) => sub.clone(),
            };
            match name {
                Some(name) => transform::apply(name, &value, origin),
                None => Ok(value),
            }
        }
    }
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
