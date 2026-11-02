//! Which Philomena a request is for, picked by its `Host`.
//!
//! Mirrors `frontend/src/lib/sites.ts`: the same `sites.local.json` (or
//! `SITES_FILE`), the same `Host` normalization, and the same default for hosts
//! that are not listed.

use std::{collections::HashMap, path::PathBuf};

use anyhow::Context as _;
use serde::Deserialize;

use crate::Result;

/// The site every unknown host gets, unless `UPSTREAM_ORIGIN` says otherwise.
const DEFAULT_ORIGIN: &str = "https://derpibooru.org";

/// The Philomena a request reads from.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Upstream {
    /// Origin without a trailing slash.
    pub origin: String,
    /// Strategy flavor: `philomena`, `furbooru` or `derpibooru`.
    pub flavor: String,
}

/// One entry of the config file: an origin, or an object with extra keys.
/// Branding keys are for the frontend and ignored here.
#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum Entry {
    Origin(String),
    Object {
        origin: String,
        #[serde(default)]
        flavor: Option<String>,
    },
}

/// The configured sites, read once at startup.
#[derive(Debug)]
pub struct Sites {
    table: HashMap<String, Upstream>,
    fallback: Upstream,
}

fn upstream(origin: &str, flavor: Option<String>) -> Upstream {
    let origin = origin.trim_end_matches('/').to_owned();
    let flavor = flavor.unwrap_or_else(|| {
        if origin.contains("furbooru") {
            "furbooru"
        } else if origin.contains("derpibooru.org") {
            // Its HTML pages sit behind a bot challenge, so only the JSON API works.
            "derpibooru"
        } else {
            "philomena"
        }
        .to_owned()
    });
    Upstream { origin, flavor }
}

/// `Host` header to bare lowercase hostname: no port, no trailing dot.
fn normalize_host(host: &str) -> String {
    let host = host.trim().to_ascii_lowercase();
    let host = match host.rsplit_once(':') {
        Some((name, port)) if !port.is_empty() && port.bytes().all(|b| b.is_ascii_digit()) => name,
        _ => &host,
    };
    host.trim_end_matches('.').to_owned()
}

impl Sites {
    /// Reads `SITES_FILE`, or `./sites.local.json` when it exists.
    pub fn load() -> Result<Self> {
        let fallback_origin =
            std::env::var("UPSTREAM_ORIGIN").unwrap_or_else(|_| DEFAULT_ORIGIN.to_owned());
        let fallback = upstream(&fallback_origin, std::env::var("UPSTREAM_FLAVOR").ok());

        let explicit = std::env::var_os("SITES_FILE").map(PathBuf::from);
        let path = explicit
            .clone()
            .unwrap_or_else(|| PathBuf::from("sites.local.json"));
        let table = match std::fs::read_to_string(&path) {
            Ok(text) => Self::parse(&text).with_context(|| format!("{}", path.display()))?,
            // The default file is optional, an explicit one is not.
            Err(err) if explicit.is_none() && err.kind() == std::io::ErrorKind::NotFound => {
                HashMap::new()
            }
            Err(err) => return Err(err).with_context(|| format!("{}", path.display())),
        };
        Ok(Self { table, fallback })
    }

    fn parse(text: &str) -> Result<HashMap<String, Upstream>> {
        let entries: HashMap<String, Entry> = serde_json::from_str(text)?;
        Ok(entries
            .into_iter()
            .map(|(host, entry)| {
                let upstream = match entry {
                    Entry::Origin(origin) => upstream(&origin, None),
                    Entry::Object { origin, flavor } => upstream(&origin, flavor),
                };
                (normalize_host(&host), upstream)
            })
            .collect())
    }

    /// The upstream for a request's `Host`.
    pub fn resolve(&self, host: &str) -> &Upstream {
        self.table
            .get(&normalize_host(host))
            .unwrap_or(&self.fallback)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_by_normalized_host() {
        let table = Sites::parse(
            r#"{
                "Furb.Example.org": "https://furbooru.org/",
                "custom.example.org": { "origin": "http://localhost:8080", "flavor": "furbooru", "name": "X" }
            }"#,
        )
        .unwrap();
        let sites = Sites {
            table,
            fallback: upstream(DEFAULT_ORIGIN, None),
        };

        let furb = sites.resolve("furb.example.org.:3000");
        assert_eq!(furb.origin, "https://furbooru.org");
        assert_eq!(furb.flavor, "furbooru");

        let custom = sites.resolve("CUSTOM.example.org");
        assert_eq!(custom.origin, "http://localhost:8080");
        assert_eq!(custom.flavor, "furbooru");

        let unknown = sites.resolve("nope.example.org");
        assert_eq!(unknown.origin, DEFAULT_ORIGIN);
        assert_eq!(unknown.flavor, "derpibooru");
    }
}
