//! The closed set of named value transforms.

use anyhow::{Context as _, bail};
use serde_json::Value;

use crate::Result;

/// Applies the transform `name` to `value`; `origin` resolves relative URLs.
pub fn apply(name: &str, value: &Value, origin: &str) -> Result<Value> {
    if name == "sanitizedHtml" {
        return Ok(match value {
            Value::String(html) => Value::String(sanitize_html(html, origin)),
            other => other.clone(),
        });
    }
    let text = match value {
        Value::String(s) => s.trim().to_owned(),
        Value::Null => return Ok(Value::Null),
        other => other.to_string(),
    };
    // `add:N`: the last number in the text, plus N (a count shown as "1 replies"
    // that stands for one more post, say).
    if let Some(amount) = name.strip_prefix("add:") {
        let amount: i64 = amount
            .parse()
            .with_context(|| format!("bad amount in {name:?}"))?;
        return Ok(last_int(&text).map_or(Value::Null, |n| Value::from(n + amount)));
    }
    // `trimSuffix:TEXT`: the text without TEXT at its end ("Pleb's profile" -> "Pleb").
    if let Some(suffix) = name.strip_prefix("trimSuffix:") {
        return Ok(Value::String(
            text.strip_suffix(suffix).unwrap_or(&text).trim().to_owned(),
        ));
    }
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
        "lastSegment" => Ok(Value::String(
            text.split(['?', '#'])
                .next()
                .unwrap_or_default()
                .trim_end_matches('/')
                .rsplit('/')
                .next()
                .unwrap_or_default()
                .to_owned(),
        )),
        "lastInt" => Ok(last_int(&text).map_or(Value::Null, Value::from)),
        other => bail!("unsupported transform {other:?}"),
    }
}

/// Page text from the upstream, made safe to put on our page: only the
/// markup a page of prose needs, links that open safely, and media addresses
/// that point at the upstream (a relative `/img/...` would otherwise be read
/// against our domain). Links stay relative, so a link to the upstream's
/// `/rules` is a link to our `/rules`.
fn sanitize_html(html: &str, origin: &str) -> String {
    let origin = origin.to_owned();
    ammonia::Builder::default()
        .add_generic_attributes(["class"])
        .link_rel(Some("noopener noreferrer nofollow"))
        .attribute_filter(move |element, attribute, value| {
            if element == "img" && attribute == "src" {
                Some(resolve_url(&origin, value).into())
            } else {
                Some(value.into())
            }
        })
        .clean(html)
        .to_string()
}

/// Whether `url` starts with a scheme such as `https:` or `data:`.
fn has_scheme(url: &str) -> bool {
    url.split_once(':').is_some_and(|(scheme, _)| {
        scheme
            .chars()
            .next()
            .is_some_and(|c| c.is_ascii_alphabetic())
            && scheme
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '-' | '.'))
    })
}

fn resolve_url(origin: &str, url: &str) -> String {
    if has_scheme(url) {
        url.to_owned()
    } else if url.starts_with("//") {
        let scheme = origin.split_once(':').map_or("https", |(scheme, _)| scheme);
        format!("{scheme}:{url}")
    } else if url.starts_with('/') {
        format!("{origin}{url}")
    } else {
        format!("{origin}/{url}")
    }
}

/// The last run of digits in `text` ("/channels/42", "LIVE NOW 12 viewers"),
/// or `None` when there is none.
fn last_int(text: &str) -> Option<i64> {
    text.split(|c: char| !c.is_ascii_digit())
        .rfind(|run| !run.is_empty())
        .and_then(|run| run.parse().ok())
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn page_text_is_made_safe_and_its_images_point_at_the_upstream() {
        let html = r#"<div class="paragraph" onclick="steal()">Hi <a href="/rules" target="_blank">rules</a> <script>alert(1)</script><img src="/img/a.png" onerror="x()"><a href="javascript:alert(1)">bad</a></div>"#;
        let clean = apply(
            "sanitizedHtml",
            &Value::String(html.to_owned()),
            "https://site.example",
        )
        .unwrap();
        let clean = clean.as_str().unwrap();
        assert!(
            !clean.contains("script") && !clean.contains("onclick") && !clean.contains("onerror")
        );
        assert!(!clean.contains("javascript:"));
        assert!(clean.contains(r#"class="paragraph""#));
        // A link stays ours; an image comes from the upstream.
        assert!(clean.contains(r#"href="/rules""#));
        assert!(clean.contains(r#"src="https://site.example/img/a.png""#));
        assert!(clean.contains("noopener"));
    }

    #[test]
    fn add_shifts_the_last_number() {
        let at = |text: &str| apply("add:1", &Value::String(text.to_owned()), "").unwrap();
        assert_eq!(at("1 replies"), 2);
        assert_eq!(at("0 replies"), 1);
        assert_eq!(at("no number"), Value::Null);
    }

    #[test]
    fn trim_suffix_drops_the_end_when_it_is_there() {
        let at = |text: &str| {
            apply("trimSuffix:'s profile", &Value::String(text.to_owned()), "").unwrap()
        };
        assert_eq!(at("Pleb's profile"), "Pleb");
        assert_eq!(at("Pleb"), "Pleb");
    }

    #[test]
    fn last_segment_takes_the_end_of_a_path() {
        let at = |text: &str| apply("lastSegment", &Value::String(text.to_owned()), "").unwrap();
        assert_eq!(at("/forums/dis"), "dis");
        assert_eq!(at("/forums/dis/"), "dis");
        assert_eq!(at("/profiles/Pleb?x=1#top"), "Pleb");
        assert_eq!(at("dis"), "dis");
    }

    #[test]
    fn last_int_takes_the_final_number() {
        let at = |text: &str| apply("lastInt", &Value::String(text.to_owned()), "").unwrap();
        assert_eq!(at("/channels/42"), 42);
        assert_eq!(at("LIVE NOW 12 viewers"), 12);
        assert_eq!(at("OFF AIR"), Value::Null);
    }

    #[test]
    fn urls_resolve_against_the_origin() {
        let origin = "http://localhost:8080";
        assert_eq!(
            resolve_url(origin, "https://cdn.test/a.png"),
            "https://cdn.test/a.png"
        );
        assert_eq!(
            resolve_url(origin, "//cdn.test/a.png"),
            "http://cdn.test/a.png"
        );
        assert_eq!(
            resolve_url(origin, "/img/a.png"),
            "http://localhost:8080/img/a.png"
        );
        assert_eq!(
            resolve_url(origin, "img/a.png"),
            "http://localhost:8080/img/a.png"
        );
    }
}
