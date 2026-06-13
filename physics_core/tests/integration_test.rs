//! Integration tests for the physics core library.
//!
//! Tests the full pipeline: parse -> generate -> export.

use physics_core::exporters;
use physics_core::generator::QuestionGenerator;
use physics_core::parser::SpecificationParser;
use physics_core::random::UniformRandomGenerator;

const FULL_SPEC: &str = r#"
[UNIT]
Id: U1
Name: Mechanics
Description: Classical mechanics

[UNIT]
Id: U2
Name: Waves
Description: Wave phenomena

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1
Description: Motion

[TOPIC]
Id: T2
Name: Dynamics
UnitId: U1
Description: Forces

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1
Description: Constant acceleration

[SKILL]
Id: S2
Name: Newton's Second Law
TopicId: T2
Description: F = ma

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 2
TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s. What is the acceleration?
AnswerExpression: (v - v0) / t
SolutionTemplate: Use a = (v - v0) / t = ({v} - {v0}) / {t} = {answer} m/s^2.
Var.v0: Type=double;Min=0;Max=20;Step=1
Var.v: Type=double;Min=20;Max=40;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
Distractor: (v + v0) / t
Distractor: v / t

[TEMPLATE]
Id: Q2
TopicId: T2
SkillId: S2
QuestionType: ShortAnswer
Difficulty: 3
TextTemplate: A {m} kg object experiences a net force of {F} N. What is its acceleration?
AnswerExpression: F / m
SolutionTemplate: a = F / m = {F} / {m} = {answer} m/s^2.
Var.m: Type=double;Min=1;Max=20;Step=0.5
Var.F: Type=double;Min=10;Max=100;Step=5
"#;

#[test]
fn test_full_pipeline_parse_generate_export() {
    let spec = SpecificationParser::parse(FULL_SPEC).unwrap();
    assert_eq!(spec.units.len(), 2);
    assert_eq!(spec.topics.len(), 2);
    assert_eq!(spec.skills.len(), 2);
    assert_eq!(spec.templates.len(), 2);

    let gen = QuestionGenerator::new(spec.templates);
    let questions = gen.generate_batch(5, None, None, None, None, None);
    assert_eq!(questions.len(), 5);

    for q in &questions {
        assert!(!q.text.is_empty());
        assert!(!q.answer.is_empty());
        assert!(!q.id.is_empty());
    }

    let html = exporters::export_html(&questions);
    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.contains("Question 1"));

    let md = exporters::export_markdown(&questions);
    assert!(md.contains("# Physics Questions"));

    let text = exporters::export_text(&questions);
    assert!(text.contains("PHYSICS QUESTIONS"));

    let pdf = exporters::export_pdf_html(&questions);
    assert!(pdf.contains("A4"));
}

#[test]
fn test_filter_by_topic() {
    let spec = SpecificationParser::parse(FULL_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let questions = gen.generate_batch(10, Some("T1"), None, None, None, None);
    for q in &questions {
        assert_eq!(q.topic_id, "T1");
    }
}

#[test]
fn test_filter_by_difficulty_range() {
    let spec = SpecificationParser::parse(FULL_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let questions = gen.generate_batch(10, None, None, Some(1), Some(2), None);
    for q in &questions {
        assert!(q.difficulty >= 1 && q.difficulty <= 2);
    }
}

#[test]
fn test_filter_by_question_type() {
    let spec = SpecificationParser::parse(FULL_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let mc_questions = gen.generate_batch(10, None, None, None, None, Some("MC"));
    for q in &mc_questions {
        assert_eq!(q.question_type, "MC");
        assert!(q.choices.is_some());
    }

    let sa_questions = gen.generate_batch(10, None, None, None, None, Some("SA"));
    for q in &sa_questions {
        assert_eq!(q.question_type, "SA");
        assert!(q.choices.is_none());
    }
}

#[test]
fn test_seeded_generation_consistent() {
    let spec = SpecificationParser::parse(FULL_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates.clone());

    let mut rng1 = UniformRandomGenerator::with_seed(42);
    let mut rng2 = UniformRandomGenerator::with_seed(42);

    let q1 = gen
        .generate_with_rng(None, None, None, None, None, &mut rng1)
        .unwrap();
    let q2 = gen
        .generate_with_rng(None, None, None, None, None, &mut rng2)
        .unwrap();

    assert_eq!(q1.text, q2.text);
    assert_eq!(q1.answer, q2.answer);
}

#[test]
fn test_answer_expression_matches() {
    let spec = SpecificationParser::parse(FULL_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let mut rng = UniformRandomGenerator::with_seed(42);
    let q = gen
        .generate_with_rng(Some("T1"), None, None, None, None, &mut rng)
        .unwrap();

    let v0 = q.variables["v0"].as_f64().unwrap();
    let v = q.variables["v"].as_f64().unwrap();
    let t = q.variables["t"].as_f64().unwrap();

    let expected = (v - v0) / t;
    let actual: f64 = q.answer.parse().unwrap();
    let diff = (actual - expected).abs() / expected.abs().max(1e-10);

    // Answer is formatted to 4 decimal places, so use a relaxed tolerance
    assert!(diff < 1e-3, "Expected ~{}, got {}", expected, actual);
}

#[test]
fn test_variable_substitution_no_placeholders() {
    let spec = SpecificationParser::parse(FULL_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let questions = gen.generate_batch(20, None, None, None, None, None);
    for q in &questions {
        assert!(
            !q.text.contains('{'),
            "Text still contains placeholder: {}",
            q.text
        );
    }
}

#[test]
fn test_export_all_formats_can_be_called() {
    let spec = SpecificationParser::parse(FULL_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);
    let questions = gen.generate_batch(3, None, None, None, None, None);

    let html = exporters::export_html(&questions);
    assert!(!html.is_empty());

    let md = exporters::export_markdown(&questions);
    assert!(!md.is_empty());

    let text = exporters::export_text(&questions);
    assert!(!text.is_empty());

    let pdf = exporters::export_pdf_html(&questions);
    assert!(!pdf.is_empty());
}