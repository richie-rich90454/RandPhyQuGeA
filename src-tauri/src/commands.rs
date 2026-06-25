use physics_core::domain::{Specification, GeneratedQuestion};
use physics_core::parser::SpecificationParser;
use physics_core::generator::QuestionGenerator;
use physics_core::exporters;
use physics_core::formula_library;

#[tauri::command]
pub fn parse_specification(input: String) -> Result<String, String> {
    let spec = SpecificationParser::parse(&input)
        .map_err(|e| format!("Parse error: {:?}", e.errors))?;
    serde_json::to_string(&spec).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub fn generate_question(
    spec_json: String,
    topic_id: Option<String>,
    skill_id: Option<String>,
    min_difficulty: Option<i32>,
    max_difficulty: Option<i32>,
    question_type: Option<String>,
) -> Result<String, String> {
    let spec: Specification = serde_json::from_str(&spec_json)
        .map_err(|e| format!("Deserialization error: {}", e))?;
    let gen = QuestionGenerator::new(spec.templates);
    let question = gen.generate(
        topic_id.as_deref(),
        skill_id.as_deref(),
        min_difficulty,
        max_difficulty,
        question_type.as_deref(),
    ).ok_or_else(|| "No matching template found".to_string())?;
    serde_json::to_string(&question).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub fn generate_batch(
    spec_json: String,
    count: usize,
    topic_id: Option<String>,
    skill_id: Option<String>,
    min_difficulty: Option<i32>,
    max_difficulty: Option<i32>,
    question_type: Option<String>,
) -> Result<String, String> {
    let spec: Specification = serde_json::from_str(&spec_json)
        .map_err(|e| format!("Deserialization error: {}", e))?;
    let gen = QuestionGenerator::new(spec.templates);
    let questions = gen.generate_batch(
        count,
        topic_id.as_deref(),
        skill_id.as_deref(),
        min_difficulty,
        max_difficulty,
        question_type.as_deref(),
    );
    serde_json::to_string(&questions).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub fn export_questions(questions_json: String, format: String) -> Result<String, String> {
    let questions: Vec<GeneratedQuestion> = serde_json::from_str(&questions_json)
        .map_err(|e| format!("Deserialization error: {}", e))?;
    let result = match format.as_str() {
        "html" => exporters::export_html(&questions),
        "markdown" => exporters::export_markdown(&questions),
        "text" => exporters::export_text(&questions),
        "pdf" => exporters::export_pdf_html(&questions),
        "json" => exporters::export_json(&questions),
        "csv" => exporters::export_csv(&questions),
        "latex" => exporters::export_latex(&questions),
        _ => return Err(format!("Unknown format: {}", format)),
    };
    Ok(result)
}

#[tauri::command]
pub fn get_formula_library() -> Result<String, String> {
    let formulas = formula_library::standard_formula_library();
    serde_json::to_string(&formulas).map_err(|e| format!("Serialization error: {}", e))
}
