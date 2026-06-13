use std::ffi::{CStr, CString};
use std::os::raw::c_char;

use crate::domain::*;
use crate::parser::SpecificationParser;
use crate::generator::QuestionGenerator;
use crate::exporters;

fn c_str_to_string(ptr: *const c_char) -> String {
    if ptr.is_null() {
        return String::new();
    }
    unsafe { CStr::from_ptr(ptr).to_string_lossy().into_owned() }
}

fn string_to_c_str(s: String) -> *mut c_char {
    CString::new(s).unwrap_or_default().into_raw()
}

unsafe fn json_to_spec(json: &str) -> Result<Specification, String> {
    serde_json::from_str(json).map_err(|e| format!("Deserialization error: {}", e))
}

/// Parse a specification file and return JSON.
/// Caller must free the returned string with `free_rust_string`.
#[no_mangle]
pub extern "C" fn parse_specification(input: *const c_char) -> *mut c_char {
    let input = c_str_to_string(input);
    match SpecificationParser::parse(&input) {
        Ok(spec) => match serde_json::to_string(&spec) {
            Ok(json) => string_to_c_str(json),
            Err(e) => string_to_c_str(format!("{{\"error\":\"{}\"}}", e)),
        },
        Err(e) => {
            string_to_c_str(format!("{{\"error\":\"Parse errors: {:?}\"}}", e.errors))
        }
    }
}

/// Generate a single question from a specification JSON.
/// Returns JSON of the generated question or null.
/// Caller must free the returned string with `free_rust_string`.
#[no_mangle]
pub extern "C" fn generate_question(
    spec_json: *const c_char,
    topic_id: *const c_char,
    skill_id: *const c_char,
    min_difficulty: i32,
    max_difficulty: i32,
    question_type: *const c_char,
) -> *mut c_char {
    let spec_json = c_str_to_string(spec_json);
    let topic_id = c_str_to_string(topic_id);
    let skill_id = c_str_to_string(skill_id);
    let question_type = c_str_to_string(question_type);

    let spec = match unsafe { json_to_spec(&spec_json) } {
        Ok(s) => s,
        Err(e) => return string_to_c_str(format!("{{\"error\":\"{}\"}}", e)),
    };

    let gen = QuestionGenerator::new(spec.templates);
    let topic_id = if topic_id.is_empty() { None } else { Some(topic_id.as_str()) };
    let skill_id = if skill_id.is_empty() { None } else { Some(skill_id.as_str()) };
    let min_difficulty = if min_difficulty < 0 { None } else { Some(min_difficulty) };
    let max_difficulty = if max_difficulty < 0 { None } else { Some(max_difficulty) };
    let question_type = if question_type.is_empty() { None } else { Some(question_type.as_str()) };

    match gen.generate(topic_id, skill_id, min_difficulty, max_difficulty, question_type) {
        Some(q) => match serde_json::to_string(&q) {
            Ok(json) => string_to_c_str(json),
            Err(e) => string_to_c_str(format!("{{\"error\":\"{}\"}}", e)),
        },
        None => string_to_c_str("null".to_string()),
    }
}

/// Generate a batch of questions from a specification JSON.
/// Caller must free the returned string with `free_rust_string`.
#[no_mangle]
pub extern "C" fn generate_batch(
    spec_json: *const c_char,
    count: i32,
    topic_id: *const c_char,
    skill_id: *const c_char,
    min_difficulty: i32,
    max_difficulty: i32,
    question_type: *const c_char,
) -> *mut c_char {
    let spec_json = c_str_to_string(spec_json);
    let topic_id = c_str_to_string(topic_id);
    let skill_id = c_str_to_string(skill_id);
    let question_type = c_str_to_string(question_type);

    let spec = match unsafe { json_to_spec(&spec_json) } {
        Ok(s) => s,
        Err(e) => return string_to_c_str(format!("{{\"error\":\"{}\"}}", e)),
    };

    let gen = QuestionGenerator::new(spec.templates);
    let topic_id = if topic_id.is_empty() { None } else { Some(topic_id.as_str()) };
    let skill_id = if skill_id.is_empty() { None } else { Some(skill_id.as_str()) };
    let min_difficulty = if min_difficulty < 0 { None } else { Some(min_difficulty) };
    let max_difficulty = if max_difficulty < 0 { None } else { Some(max_difficulty) };
    let question_type = if question_type.is_empty() { None } else { Some(question_type.as_str()) };

    let questions = gen.generate_batch(
        count as usize,
        topic_id,
        skill_id,
        min_difficulty,
        max_difficulty,
        question_type,
    );

    match serde_json::to_string(&questions) {
        Ok(json) => string_to_c_str(json),
        Err(e) => string_to_c_str(format!("{{\"error\":\"{}\"}}", e)),
    }
}

/// Export questions to a given format.
/// Caller must free the returned string with `free_rust_string`.
#[no_mangle]
pub extern "C" fn export_questions(
    questions_json: *const c_char,
    format: *const c_char,
) -> *mut c_char {
    let questions_json = c_str_to_string(questions_json);
    let format = c_str_to_string(format);

    let questions: Vec<GeneratedQuestion> = match serde_json::from_str(&questions_json) {
        Ok(q) => q,
        Err(e) => return string_to_c_str(format!("{{\"error\":\"{}\"}}", e)),
    };

    let result = match format.as_str() {
        "html" => exporters::export_html(&questions),
        "markdown" => exporters::export_markdown(&questions),
        "text" => exporters::export_text(&questions),
        "pdf" => exporters::export_pdf_html(&questions),
        _ => return string_to_c_str(format!("{{\"error\":\"Unknown format: {}\"}}", format)),
    };

    string_to_c_str(result)
}

/// Free a string allocated by this library.
#[no_mangle]
pub extern "C" fn free_rust_string(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        let _ = CString::from_raw(ptr);
    }
}