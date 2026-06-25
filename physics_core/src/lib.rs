pub mod domain;
pub mod evaluator;
pub mod exporters;
pub mod generator;
pub mod parser;
pub mod random;
pub mod spec_builder;
pub mod template_builder;
pub mod error;
pub mod validation;
pub mod config;
pub mod cache;
pub mod metadata;
pub mod difficulty;
pub mod formula_library;
pub mod weighted_selection;
pub mod spec_merger;
pub mod unit_conversion;
pub mod template_analysis;

#[cfg(target_arch = "wasm32")]
pub mod wasm_bridge;

pub mod ffi;