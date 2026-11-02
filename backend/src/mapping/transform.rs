//! The closed set of named value transforms.

use anyhow::{Context as _, bail};
use serde_json::Value;

use crate::Result;

/// Applies the transform `name` to `value`; `origin` resolves relative URLs.
pub fn apply(name: &str, value: &Value, origin: &str) -> Result<Value> {
    let text = match value {
        Value::String(s) => s.trim().to_owned(),
        Value::Null => return Ok(Value::Null),
        other => other.to_string(),
    };
    if let Some(sep) = name.strip_prefix("split:") {
        let parts = text
            .split(sep)
            .map(str::trim)
            .filter(|p| !p.is_empty())
            .map(|p| Value::String(p.to_owned()))
            .collect();
        return Ok(Value::Array(parts));
    }
    if let Some(sep) = name.strip_prefix("join:") {
        let Value::Array(items) = value else {
            bail!("join needs an array");
        };
        let joined: Vec<String> = items
            .iter()
            .map(|v| v.as_str().map_or_else(|| v.to_string(), str::to_owned))
            .collect();
        return Ok(Value::String(joined.join(sep)));
    }
    match name {
        "int" => {
            let digits = text.replace([',', '_'], "");
            let n: i64 = digits
                .parse()
                .with_context(|| format!("not an int: {text:?}"))?;
            Ok(Value::from(n))
        }
        "float" => {
            let n: f64 = text
                .parse()
                .with_context(|| format!("not a float: {text:?}"))?;
            Ok(Value::from(n))
        }
        "bool" => match text.to_ascii_lowercase().as_str() {
            "true" | "1" | "yes" => Ok(Value::Bool(true)),
            "false" | "0" | "no" | "" => Ok(Value::Bool(false)),
            _ => bail!("not a bool: {text:?}"),
        },
        "date" => Ok(Value::String(text)),
        "url" => Ok(Value::String(resolve_url(origin, &text))),
        "slug" => Ok(Value::String(slugify(&text))),
        other => bail!("unsupported transform {other:?}"),
    }
}

fn resolve_url(origin: &str, url: &str) -> String {
    if url.starts_with("http://") || url.starts_with("https://") {
        url.to_owned()
    } else if url.starts_with('/') {
        format!("{origin}{url}")
    } else {
        format!("{origin}/{url}")
    }
}

fn slugify(text: &str) -> String {
    let mut slug = String::new();
    for c in text.chars().flat_map(char::to_lowercase) {
        if c.is_alphanumeric() {
            slug.push(c);
        } else if !slug.ends_with('-') {
            slug.push('-');
        }
    }
    slug.trim_matches('-').to_owned()
}
