//! Core domain model types for the physics question generator.
//!
//! Defines the data structures for units, topics, skills, question templates,
//! variable definitions, generated questions, and practice results.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Unit {
    pub id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Topic {
    pub id: String,
    pub name: String,
    pub unit_id: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub topic_id: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct VariableDefinition {
    pub name: String,
    pub var_type: String,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub step: Option<f64>,
    pub enum_values: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct QuestionTemplate {
    pub id: String,
    pub topic_id: String,
    pub skill_id: String,
    pub question_type: String,
    pub difficulty: i32,
    pub text_template: String,
    pub answer_expression: String,
    pub solution_template: String,
    pub variable_definitions: Vec<VariableDefinition>,
    pub distractor_expressions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GeneratedQuestion {
    pub id: String,
    pub topic_id: String,
    pub skill_id: String,
    pub question_type: String,
    pub difficulty: i32,
    pub text: String,
    pub answer: String,
    pub choices: Option<Vec<String>>,
    pub solution_text: String,
    pub solution_latex: String,
    pub variables: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PracticeResult {
    pub id: String,
    pub question_id: String,
    pub topic_id: String,
    pub skill_id: String,
    pub is_correct: bool,
    pub time_taken_ms: u64,
    pub user_answer: String,
    pub timestamp: String,
    pub mode: PracticeMode,
    pub difficulty: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PracticeMode {
    Mental,
    Focused,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Specification {
    pub units: Vec<Unit>,
    pub topics: Vec<Topic>,
    pub skills: Vec<Skill>,
    pub templates: Vec<QuestionTemplate>,
}

/// A group of related templates for organizational purposes.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TemplateGroup {
    pub id: String,
    pub name: String,
    pub description: String,
    pub template_ids: Vec<String>,
}

/// A tag for categorizing and filtering questions.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct QuestionTag {
    pub name: String,
    pub category: String,
}

/// A formula reference for the formula library.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormulaEntry {
    pub name: String,
    pub latex: String,
    pub description: String,
    pub variables: Vec<String>,
    pub topic_id: Option<String>,
}