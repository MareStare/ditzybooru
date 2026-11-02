//! Runtime engine for the `x-philomena` mappings in `api/openapi.json`.
//!
//! The same code serves requests and verifies mappings, so there is exactly one
//! extractor implementation.

#![allow(
    clippy::missing_errors_doc,
    clippy::must_use_candidate,
    reason = "internal engine API, the Result and purity are self-evident"
)]

mod engine;
mod html;
mod json;
mod spec;
mod transform;

pub use engine::{
    Context, Responses, UpstreamStatus, extract, fetch, plan_request, relevant_params,
    select_strategy, validate,
};
pub use spec::{Document, Operation, Strategy};

/// The tracked `OpenAPI` document, embedded at build time.
pub const OPENAPI_JSON: &str = include_str!("../../../api/openapi.json");
