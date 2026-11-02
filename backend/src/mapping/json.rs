//! JSON pointer remapping.

use std::collections::BTreeMap;

use anyhow::{Context as _, anyhow};
use serde_json::{Map, Value};

use super::{spec::JsonMapValue, transform};
use crate::Result;

/// Builds our document out of `doc` following `map`.
pub fn remap(doc: &Value, map: &BTreeMap<String, JsonMapValue>, origin: &str) -> Result<Value> {
    let mut out = Map::new();
    for (field, rule) in map {
        let value = apply_rule(doc, rule, origin).with_context(|| format!("field {field:?}"))?;
        out.insert(field.clone(), value);
    }
    Ok(Value::Object(out))
}

fn apply_rule(doc: &Value, rule: &JsonMapValue, origin: &str) -> Result<Value> {
    match rule {
        JsonMapValue::Pointer(pointer) => lookup(doc, pointer).cloned(),
        JsonMapValue::Nested {
            from,
            transform: name,
            map,
        } => {
            let sub = lookup(doc, from)?;
            let value = match (map, sub) {
                // A map over an array applies to every element.
                (Some(map), Value::Array(items)) => Value::Array(
                    items
                        .iter()
                        .map(|item| remap(item, map, origin))
                        .collect::<Result<_>>()?,
                ),
                (Some(map), _) => remap(sub, map, origin)?,
                (None, _) => sub.clone(),
            };
            match name {
                Some(name) => transform::apply(name, &value, origin),
                None => Ok(value),
            }
        }
    }
}

fn lookup<'a>(doc: &'a Value, pointer: &str) -> Result<&'a Value> {
    doc.pointer(pointer)
        .ok_or_else(|| anyhow!("pointer {pointer:?} matched nothing"))
}
