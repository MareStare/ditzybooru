//! Runs `x-philomena` mappings against the local Philomena instances.
//!
//! Usage: `cargo run -p backend --bin api-verify -- [--all | <operationId>...]`.
//! Writes raw upstream responses to `api/fixtures/` and marks routes `verified`
//! in `api/coverage.json`.

use std::{collections::BTreeMap, fs, path::PathBuf, process::ExitCode};

use anyhow::{Context as _, Result};
use backend::mapping::{
    Context, Document, Strategy, extract, fetch_body, select_strategy, validate,
};
use serde::Deserialize;
use serde_json::Value;

#[derive(Debug, Deserialize)]
struct Instance {
    origin: String,
    flavor: String,
}

#[tokio::main]
async fn main() -> ExitCode {
    match run().await {
        Ok(true) => ExitCode::SUCCESS,
        Ok(false) => ExitCode::FAILURE,
        Err(err) => {
            eprintln!("Error: {err:#}");
            ExitCode::FAILURE
        }
    }
}

async fn run() -> Result<bool> {
    let api_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../api");
    let document = Document::parse(&fs::read_to_string(api_dir.join("openapi.json"))?)?;
    let instances: BTreeMap<String, Instance> =
        serde_json::from_str(&fs::read_to_string(api_dir.join("instances.json"))?)?;
    let coverage_path = api_dir.join("coverage.json");
    let mut coverage: Value = serde_json::from_str(&fs::read_to_string(&coverage_path)?)?;

    let args: Vec<String> = std::env::args().skip(1).collect();
    let selected: Vec<_> = document
        .operations
        .iter()
        .filter(|op| args.iter().any(|a| a == "--all" || *a == op.id))
        .collect();
    if selected.is_empty() {
        anyhow::bail!("no operations selected; pass --all or operation ids");
    }

    let client = reqwest::Client::builder()
        .user_agent("ditzybooru-api-verify")
        .build()?;
    let mut all_ok = true;
    for op in selected {
        let mut passed: Vec<&str> = vec![];
        for (name, instance) in &instances {
            let label = format!("{} @ {name}", op.id);
            if op.auth != "none" {
                println!(
                    "SKIP {label}: auth {:?} is not supported by the verifier yet",
                    op.auth
                );
                continue;
            }
            let Some(strategy) = select_strategy(op, &instance.flavor) else {
                println!("SKIP {label}: no strategy for flavor {}", instance.flavor);
                continue;
            };
            let ctx = Context {
                origin: &instance.origin,
                flavor: &instance.flavor,
            };
            let result = async {
                let body = fetch_body(&client, ctx, strategy, &op.examples).await?;
                let value = extract(strategy, &body, ctx, &op.examples)?;
                validate(&document, op, &value)?;
                if value
                    .get("items")
                    .and_then(Value::as_array)
                    .is_some_and(Vec::is_empty)
                {
                    anyhow::bail!("`items` is empty, so no item fields were checked; seed data");
                }
                Ok::<_, anyhow::Error>(body)
            }
            .await;
            match result {
                Ok(body) => {
                    let ext = if matches!(strategy, Strategy::Html(_)) {
                        "html"
                    } else {
                        "json"
                    };
                    let dir = api_dir.join("fixtures").join(name);
                    fs::create_dir_all(&dir)?;
                    fs::write(dir.join(format!("{}.{ext}", op.id)), body)?;
                    println!("OK   {label}");
                    passed.push(name);
                }
                Err(err) => {
                    all_ok = false;
                    println!("FAIL {label}: {err:#}");
                }
            }
        }
        for route in &op.routes {
            let Some(entry) = coverage.get_mut(route) else {
                continue;
            };
            let wanted: Vec<&str> = entry["instances"]
                .as_array()
                .map(|a| a.iter().filter_map(Value::as_str).collect())
                .unwrap_or_default();
            if !wanted.is_empty() && wanted.iter().all(|w| passed.contains(w)) {
                entry["status"] = Value::from("verified");
            }
        }
    }
    let mut text = serde_json::to_string_pretty(&coverage).context("serializing coverage")?;
    text.push('\n');
    fs::write(coverage_path, text)?;
    Ok(all_ok)
}
