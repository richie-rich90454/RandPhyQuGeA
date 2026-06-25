//! Unified error types for the physics core library.
//!
//! Provides domain-specific error variants for parsing, evaluation,
//! generation, random variable, and export operations.

use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub enum PhysicsError {
    ParseError(String),
    EvaluationError(String),
    GenerationError(String),
    RandomError(String),
    ExportError(String),
    ValidationError(String),
}

impl fmt::Display for PhysicsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PhysicsError::ParseError(msg) => write!(f, "Parse error: {}", msg),
            PhysicsError::EvaluationError(msg) => write!(f, "Evaluation error: {}", msg),
            PhysicsError::GenerationError(msg) => write!(f, "Generation error: {}", msg),
            PhysicsError::RandomError(msg) => write!(f, "Random error: {}", msg),
            PhysicsError::ExportError(msg) => write!(f, "Export error: {}", msg),
            PhysicsError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
        }
    }
}

impl std::error::Error for PhysicsError {}

/// Convenience type alias for results from the physics core library.
pub type PhysicsResult<T> = Result<T, PhysicsError>;