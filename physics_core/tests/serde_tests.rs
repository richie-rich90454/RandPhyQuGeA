//! Serialization roundtrip tests for all domain models.
//!
//! Ensures that all domain types can be serialized to JSON and
//! deserialized back without data loss.

use physics_core::domain::*;
use std::collections::HashMap;

#[test]
fn test_unit_roundtrip() {
    let unit = Unit {
        id: "U1".to_string(),
        name: "Mechanics".to_string(),
        description: "Classical mechanics".to_string(),
    };
    let json = serde_json::to_string(&unit).unwrap();
    let back: Unit = serde_json::from_str(&json).unwrap();
    assert_eq!(unit, back);
}

#[test]
fn test_topic_roundtrip() {
    let topic = Topic {
        id: "T1".to_string(),
        name: "Kinematics".to_string(),
        unit_id: "U1".to_string(),
        description: "Motion".to_string(),
    };
    let json = serde_json::to_string(&topic).unwrap();
    let back: Topic = serde_json::from_str(&json).unwrap();
    assert_eq!(topic, back);
}

#[test]
fn test_skill_roundtrip() {
    let skill = Skill {
        id: "S1".to_string(),
        name: "Uniform Acceleration".to_string(),
        topic_id: "T1".to_string(),
        description: "".to_string(),
    };
    let json = serde_json::to_string(&skill).unwrap();
    let back: Skill = serde_json::from_str(&json).unwrap();
    assert_eq!(skill, back);
}

#[test]
fn test_variable_definition_roundtrip() {
    let vd = VariableDefinition {
        name: "v0".to_string(),
        var_type: "double".to_string(),
        min: Some(0.0),
        max: Some(20.0),
        step: Some(1.0),
        enum_values: None,
    };
    let json = serde_json::to_string(&vd).unwrap();
    let back: VariableDefinition = serde_json::from_str(&json).unwrap();
    assert_eq!(vd, back);
}

#[test]
fn test_enum_variable_roundtrip() {
    let vd = VariableDefinition {
        name: "dir".to_string(),
        var_type: "enum".to_string(),
        min: None,
        max: None,
        step: None,
        enum_values: Some(vec!["North".to_string(), "South".to_string()]),
    };
    let json = serde_json::to_string(&vd).unwrap();
    let back: VariableDefinition = serde_json::from_str(&json).unwrap();
    assert_eq!(vd, back);
}

#[test]
fn test_template_roundtrip() {
    let template = QuestionTemplate {
        id: "Q1".to_string(),
        topic_id: "T1".to_string(),
        skill_id: "S1".to_string(),
        question_type: "MC".to_string(),
        difficulty: 2,
        text_template: "Test {x}".to_string(),
        answer_expression: "x * 2".to_string(),
        solution_template: "Solution".to_string(),
        variable_definitions: vec![VariableDefinition {
            name: "x".to_string(),
            var_type: "int".to_string(),
            min: Some(1.0),
            max: Some(10.0),
            step: None,
            enum_values: None,
        }],
        distractor_expressions: vec!["x + 1".to_string()],
    };
    let json = serde_json::to_string(&template).unwrap();
    let back: QuestionTemplate = serde_json::from_str(&json).unwrap();
    assert_eq!(template, back);
}

#[test]
fn test_generated_question_roundtrip() {
    let mut vars = HashMap::new();
    vars.insert("x".to_string(), serde_json::json!(5.0));

    let q = GeneratedQuestion {
        id: "uuid-1".to_string(),
        topic_id: "T1".to_string(),
        skill_id: "S1".to_string(),
        question_type: "SA".to_string(),
        difficulty: 3,
        text: "Test 5".to_string(),
        answer: "10".to_string(),
        choices: None,
        solution_text: "Solution".to_string(),
        solution_latex: "Solution".to_string(),
        variables: vars,
    };
    let json = serde_json::to_string(&q).unwrap();
    let back: GeneratedQuestion = serde_json::from_str(&json).unwrap();
    assert_eq!(q.id, back.id);
    assert_eq!(q.text, back.text);
    assert_eq!(q.answer, back.answer);
}

#[test]
fn test_practice_result_roundtrip() {
    let pr = PracticeResult {
        id: "r1".to_string(),
        question_id: "q1".to_string(),
        topic_id: "T1".to_string(),
        skill_id: "S1".to_string(),
        is_correct: true,
        time_taken_ms: 5000,
        user_answer: "10".to_string(),
        timestamp: "2024-01-01".to_string(),
        mode: PracticeMode::Focused,
        difficulty: 2,
    };
    let json = serde_json::to_string(&pr).unwrap();
    let back: PracticeResult = serde_json::from_str(&json).unwrap();
    assert_eq!(pr, back);
}

#[test]
fn test_practice_mode_serialization() {
    let focused = PracticeMode::Focused;
    let mental = PracticeMode::Mental;

    let j1 = serde_json::to_string(&focused).unwrap();
    let j2 = serde_json::to_string(&mental).unwrap();

    assert_eq!(j1, "\"Focused\"");
    assert_eq!(j2, "\"Mental\"");

    let b1: PracticeMode = serde_json::from_str(&j1).unwrap();
    let b2: PracticeMode = serde_json::from_str(&j2).unwrap();

    assert_eq!(b1, PracticeMode::Focused);
    assert_eq!(b2, PracticeMode::Mental);
}

#[test]
fn test_specification_roundtrip() {
    let spec = Specification {
        units: vec![Unit { id: "U1".into(), name: "M".into(), description: "".into() }],
        topics: vec![Topic { id: "T1".into(), name: "K".into(), unit_id: "U1".into(), description: "".into() }],
        skills: vec![Skill { id: "S1".into(), name: "S".into(), topic_id: "T1".into(), description: "".into() }],
        templates: vec![QuestionTemplate {
            id: "Q1".into(), topic_id: "T1".into(), skill_id: "S1".into(),
            question_type: "SA".into(), difficulty: 1,
            text_template: "T".into(), answer_expression: "1".into(),
            solution_template: "".into(),
            variable_definitions: vec![VariableDefinition {
                name: "x".into(), var_type: "int".into(),
                min: Some(1.0), max: Some(5.0), step: None, enum_values: None,
            }],
            distractor_expressions: vec![],
        }],
    };
    let json = serde_json::to_string(&spec).unwrap();
    let back: Specification = serde_json::from_str(&json).unwrap();
    assert_eq!(spec.units.len(), back.units.len());
    assert_eq!(spec.templates.len(), back.templates.len());
}