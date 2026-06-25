use wasm_bindgen::prelude::*;
use crate::domain::*;
use crate::parser::SpecificationParser;
use crate::generator::QuestionGenerator;
use crate::exporters;

#[wasm_bindgen]
pub fn parse_specification(input: &str) -> Result<String, JsValue> {
    let spec = SpecificationParser::parse(input)
        .map_err(|e| JsValue::from_str(&format!("Parse error: {:?}", e.errors)))?;
    serde_json::to_string(&spec)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn generate_question(
    spec_json: &str,
    topic_id: Option<String>,
    skill_id: Option<String>,
    min_difficulty: Option<i32>,
    max_difficulty: Option<i32>,
    question_type: Option<String>,
) -> Result<String, JsValue> {
    let spec: Specification = serde_json::from_str(spec_json)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;

    let gen = QuestionGenerator::new(spec.templates);
    let question = gen.generate(
        topic_id.as_deref(),
        skill_id.as_deref(),
        min_difficulty,
        max_difficulty,
        question_type.as_deref(),
    );

    serde_json::to_string(&question)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn generate_batch(
    spec_json: &str,
    count: usize,
    topic_id: Option<String>,
    skill_id: Option<String>,
    min_difficulty: Option<i32>,
    max_difficulty: Option<i32>,
    question_type: Option<String>,
) -> Result<String, JsValue> {
    let spec: Specification = serde_json::from_str(spec_json)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;

    let gen = QuestionGenerator::new(spec.templates);
    let questions = gen.generate_batch(
        count,
        topic_id.as_deref(),
        skill_id.as_deref(),
        min_difficulty,
        max_difficulty,
        question_type.as_deref(),
    );

    serde_json::to_string(&questions)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn export_questions(
    questions_json: &str,
    format: &str,
) -> Result<String, JsValue> {
    let questions: Vec<GeneratedQuestion> = serde_json::from_str(questions_json)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;

    let result = match format {
        "html" => exporters::export_html(&questions),
        "markdown" => exporters::export_markdown(&questions),
        "text" => exporters::export_text(&questions),
        "pdf" => exporters::export_pdf_html(&questions),
        _ => return Err(JsValue::from_str(&format!("Unknown format: {}", format))),
    };

    Ok(result)
}