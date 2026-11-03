//! Runs `x-philomena` mappings against the local Philomena instances.
//!
//! Usage: `cargo run -p backend --bin api-verify -- [--all | <operationId>...] [--remote]`.
//! Writes raw upstream responses to `api/fixtures/` and marks routes `verified`
//! in `api/coverage.json`.

use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
    process::ExitCode,
};

use anyhow::{Context as _, Result};
use backend::mapping::{
    Context, Document, Operation, Responses, Strategy, Throttle, extract, fetch, select_strategy,
    validate,
};
use serde::Deserialize;
use serde_json::Value;

#[derive(Debug, Deserialize)]
struct Instance {
    origin: String,
    flavor: String,
    /// A live third-party site. Only verified with `--remote`, so routine runs
    /// do not hit it (it rate limits).
    #[serde(default)]
    remote: bool,
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

/// Saves the upstream responses as fixtures: `<op>.json` (or `.html`), a join's
/// follow-up as `<op>.<join>.json` and each fan-out response as
/// `<op>.fanout<index>.json`.
fn write_fixtures(
    dir: &Path,
    op_id: &str,
    strategy: &Strategy,
    responses: Responses,
) -> Result<()> {
    let ext = if matches!(strategy, Strategy::Html(_)) {
        "html"
    } else {
        "json"
    };
    fs::create_dir_all(dir)?;
    fs::write(dir.join(format!("{op_id}.{ext}")), responses.main)?;
    for (join, body) in responses.joins {
        fs::write(dir.join(format!("{op_id}.{join}.json")), body)?;
    }
    for (index, body) in responses.fanout.iter().enumerate() {
        fs::write(dir.join(format!("{op_id}.fanout{index}.json")), body)?;
    }
    Ok(())
}

/// The API key to verify `op` with, if it uses one. It comes from the
/// environment, e.g. `VERIFY_KEY_PHILOMENA`, so it never lands in a file.
/// `Err` says why the operation cannot be verified.
fn key_for(op: &Operation, instance: &str) -> Result<Option<String>, String> {
    let var = format!(
        "VERIFY_KEY_{}",
        instance.to_ascii_uppercase().replace('-', "_")
    );
    match op.auth.as_str() {
        // Optional keys are verified as the public sees the page.
        "none" | "api-key-optional" => Ok(None),
        "api-key" => std::env::var(&var)
            .map(Some)
            .map_err(|_| format!("needs an API key in {var}")),
        other => Err(format!(
            "auth {other:?} is not supported by the verifier yet"
        )),
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
    let remote = args.iter().any(|a| a == "--remote");
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
            if instance.remote && !remote {
                println!("SKIP {label}: remote instance, pass --remote to include it");
                continue;
            }
            let api_key = match key_for(op, name) {
                Ok(key) => key,
                Err(reason) => {
                    println!("SKIP {label}: {reason}");
                    continue;
                }
            };
            let Some(strategy) = select_strategy(op, &instance.flavor) else {
                println!("SKIP {label}: no strategy for flavor {}", instance.flavor);
                continue;
            };
            let ctx = Context {
                origin: &instance.origin,
                flavor: &instance.flavor,
                // Optional operations are verified as the public sees them.
                api_key: api_key.as_deref(),
                session: None,
            };
            let result = async {
                let responses =
                    fetch(&client, &Throttle::default(), ctx, strategy, &op.examples).await?;
                let value = extract(strategy, &responses, ctx, &op.examples)?;
                validate(&document, op, &value)?;
                if value
                    .get("items")
                    .and_then(Value::as_array)
                    .is_some_and(Vec::is_empty)
                {
                    anyhow::bail!("`items` is empty, so no item fields were checked; seed data");
                }
                Ok::<_, anyhow::Error>(responses)
            }
            .await;
            match result {
                Ok(responses) => {
                    write_fixtures(
                        &api_dir.join("fixtures").join(name),
                        &op.id,
                        strategy,
                        responses,
                    )?;
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
