//! Typed view of the `x-philomena` extension and the parts of `OpenAPI` we use.

use std::collections::BTreeMap;

use serde::Deserialize;
use serde_json::Value;

use crate::Result;

/// Our API description, flattened to the operations we can execute.
#[derive(Debug)]
pub struct Document {
    /// Every operation, in path order.
    pub operations: Vec<Operation>,
    /// `components` of the `OpenAPI` document, needed to resolve `$ref`s.
    pub components: Value,
}

/// One of our operations with its upstream mapping.
#[derive(Debug)]
pub struct Operation {
    /// The `operationId`.
    pub id: String,
    /// Authentication the upstream needs.
    pub auth: String,
    /// Coverage keys (`"GET /images/:id"`) this operation serves.
    pub routes: Vec<String>,
    /// Strategies in preference order.
    pub strategies: Vec<Strategy>,
    /// Sample parameters used by the verifier.
    pub examples: BTreeMap<String, String>,
    /// JSON schema of the success response.
    pub response_schema: Value,
}

#[derive(Debug, Deserialize)]
struct RawDocument {
    paths: BTreeMap<String, BTreeMap<String, RawOperation>>,
    components: Value,
}

#[derive(Debug, Deserialize)]
struct RawOperation {
    #[serde(rename = "operationId")]
    operation_id: String,
    responses: RawResponses,
    #[serde(rename = "x-philomena")]
    philomena: RawPhilomena,
    #[serde(rename = "x-examples", default)]
    examples: BTreeMap<String, Value>,
}

#[derive(Debug, Deserialize)]
struct RawResponses {
    #[serde(rename = "200")]
    ok: RawResponse,
}

#[derive(Debug, Deserialize)]
struct RawResponse {
    content: BTreeMap<String, RawMedia>,
}

#[derive(Debug, Deserialize)]
struct RawMedia {
    schema: Value,
}

#[derive(Debug, Deserialize)]
struct RawPhilomena {
    routes: Vec<String>,
    auth: String,
    strategies: Vec<Strategy>,
}

/// How to produce a response from the upstream.
#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Strategy {
    /// Remap the official JSON API.
    Json(JsonStrategy),
    /// Scrape server-rendered HTML.
    Html(HtmlStrategy),
    /// Submit a form (not executable yet).
    Form(FormStrategy),
}

impl Strategy {
    /// Flavors this strategy is limited to; empty means all.
    pub fn flavors(&self) -> &[String] {
        match self {
            Self::Json(s) => &s.flavors,
            Self::Html(s) => &s.flavors,
            Self::Form(s) => &s.flavors,
        }
    }

    /// The upstream request template.
    pub const fn request(&self) -> &UpstreamRequest {
        match self {
            Self::Json(s) => &s.request,
            Self::Html(s) => &s.request,
            Self::Form(s) => &s.request,
        }
    }
}

/// Upstream request template with `{param}` placeholders.
#[derive(Debug, Deserialize)]
pub struct UpstreamRequest {
    /// HTTP method.
    pub method: String,
    /// Path with placeholders.
    pub path: String,
    /// Query parameters; values may use placeholders.
    #[serde(default)]
    pub query: BTreeMap<String, String>,
}

/// JSON pointer remap strategy.
#[derive(Debug, Deserialize)]
pub struct JsonStrategy {
    /// Restricts the strategy to these upstream flavors.
    #[serde(default)]
    pub flavors: Vec<String>,
    /// Request template.
    pub request: UpstreamRequest,
    /// Our field -> upstream pointer.
    pub map: BTreeMap<String, JsonMapValue>,
}

/// A value in a [`JsonStrategy`] map.
#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum JsonMapValue {
    /// A JSON pointer into the current document.
    Pointer(String),
    /// A nested pointer with optional remap or transform.
    Nested {
        /// Pointer to the sub-document.
        from: String,
        /// Transform to apply to the value.
        #[serde(rename = "as")]
        transform: Option<String>,
        /// Remap of the sub-document, pointers relative to `from`.
        map: Option<BTreeMap<String, Self>>,
    },
}

/// HTML selector strategy.
#[derive(Debug, Deserialize)]
pub struct HtmlStrategy {
    /// Restricts the strategy to these upstream flavors.
    #[serde(default)]
    pub flavors: Vec<String>,
    /// Request template.
    pub request: UpstreamRequest,
    /// Selectors.
    pub select: SelectSpec,
}

/// Root selector plus the fields extracted from it.
#[derive(Debug, Deserialize)]
pub struct SelectSpec {
    /// CSS selector of the scope; the whole document when absent.
    pub root: Option<String>,
    /// Fields to extract.
    pub fields: BTreeMap<String, FieldSpec>,
}

/// One HTML field extractor.
#[expect(
    clippy::struct_excessive_bools,
    reason = "mirrors the independent reader flags of the spec"
)]
#[derive(Debug, Default, Deserialize)]
pub struct FieldSpec {
    /// CSS selector relative to the parent.
    pub sel: Option<String>,
    /// Read this attribute.
    pub attr: Option<String>,
    /// Read the text content.
    #[serde(default)]
    pub text: bool,
    /// Read the inner HTML.
    #[serde(default)]
    pub html: bool,
    /// Whether the selector matches at all.
    #[serde(default)]
    pub exists: bool,
    /// Parse the attribute as JSON.
    #[serde(default)]
    pub json: bool,
    /// Remap the parsed JSON attribute, pointers relative to its root.
    pub map: Option<BTreeMap<String, JsonMapValue>>,
    /// Produce an array of every match.
    #[serde(default)]
    pub many: bool,
    /// Missing matches yield null instead of an error.
    #[serde(default)]
    pub optional: bool,
    /// Named transform.
    #[serde(rename = "as")]
    pub transform: Option<String>,
    /// Nested fields, relative to each match.
    pub fields: Option<BTreeMap<String, Self>>,
}

/// Form submission strategy.
#[derive(Debug, Deserialize)]
pub struct FormStrategy {
    /// Restricts the strategy to these upstream flavors.
    #[serde(default)]
    pub flavors: Vec<String>,
    /// Request template.
    pub request: UpstreamRequest,
}

impl Document {
    /// Parses an `OpenAPI` document produced by `api/scripts/build.ts`.
    pub fn parse(source: &str) -> Result<Self> {
        let raw: RawDocument = serde_json::from_str(source)?;
        let mut operations = vec![];
        for item in raw.paths.into_values() {
            for op in item.into_values() {
                let schema = op
                    .responses
                    .ok
                    .content
                    .into_values()
                    .next()
                    .map(|m| m.schema)
                    .ok_or_else(|| anyhow::anyhow!("{}: no 200 response", op.operation_id))?;
                operations.push(Operation {
                    id: op.operation_id,
                    auth: op.philomena.auth,
                    routes: op.philomena.routes,
                    strategies: op.philomena.strategies,
                    examples: op
                        .examples
                        .into_iter()
                        .map(|(k, v)| {
                            let text = v.as_str().map_or_else(|| v.to_string(), str::to_owned);
                            (k, text)
                        })
                        .collect(),
                    response_schema: schema,
                });
            }
        }
        Ok(Self {
            operations,
            components: raw.components,
        })
    }

    /// Looks an operation up by id.
    pub fn operation(&self, id: &str) -> Option<&Operation> {
        self.operations.iter().find(|op| op.id == id)
    }
}
