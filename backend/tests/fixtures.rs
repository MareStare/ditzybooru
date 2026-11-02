//! Replays every captured upstream response through the extractor offline.

use std::{collections::BTreeMap, fs, path::PathBuf};

use backend::mapping::{Context, Document, OPENAPI_JSON, extract, select_strategy, validate};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Instance {
    origin: String,
    flavor: String,
}

#[test]
fn fixtures_extract_and_validate() {
    let api_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../api");
    let document = Document::parse(OPENAPI_JSON).unwrap();
    let instances: BTreeMap<String, Instance> =
        serde_json::from_str(&fs::read_to_string(api_dir.join("instances.json")).unwrap()).unwrap();

    let mut replayed = 0;
    for (name, instance) in &instances {
        let dir = api_dir.join("fixtures").join(name);
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries {
            let path = entry.unwrap().path();
            let id = path.file_stem().unwrap().to_str().unwrap();
            let op = document
                .operation(id)
                .unwrap_or_else(|| panic!("fixture {path:?} has no operation"));
            let strategy = select_strategy(op, &instance.flavor).unwrap();
            let ctx = Context {
                origin: &instance.origin,
                flavor: &instance.flavor,
            };
            let body = fs::read_to_string(&path).unwrap();
            let value =
                extract(strategy, &body, ctx).unwrap_or_else(|e| panic!("{name}/{id}: {e:#}"));
            validate(&document, op, &value).unwrap_or_else(|e| panic!("{name}/{id}: {e:#}"));
            replayed += 1;
        }
    }
    assert!(replayed > 0, "no fixtures replayed");
}
