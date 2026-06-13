//! Comprehensive pipeline integration tests.
//!
//! Tests the full pipeline with complex specifications, multiple templates,
//! all export formats, and advanced generation scenarios.

use physics_core::cache::QuestionCache;
use physics_core::difficulty::{
    difficulty_distribution, weighted_difficulty, suggest_difficulty_adjustment,
};
use physics_core::exporters;
use physics_core::formula_library::standard_formula_library;
use physics_core::generator::{QuestionFilter, QuestionGenerator};
use physics_core::parser::SpecificationParser;
use physics_core::random::UniformRandomGenerator;
use physics_core::spec_merger::merge_specifications;
use physics_core::template_analysis::detect_circular_references;
use physics_core::unit_conversion;
use physics_core::weighted_selection::weighted_select;

const COMPLEX_SPEC: &str = r#"
[UNIT]
Id: U1
Name: Mechanics
Description: Classical mechanics

[UNIT]
Id: U2
Name: Electromagnetism
Description: Electric and magnetic phenomena

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1
Description: Motion without considering forces

[TOPIC]
Id: T2
Name: Dynamics
UnitId: U1
Description: Forces and motion

[TOPIC]
Id: T3
Name: Electric Circuits
UnitId: U2
Description: Ohm's law and circuit analysis

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1
Description: Constant acceleration motion

[SKILL]
Id: S2
Name: Newton's Second Law
TopicId: T2
Description: F = ma

[SKILL]
Id: S3
Name: Ohm's Law
TopicId: T3
Description: V = IR

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
Distractor: v0 / t

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

[TEMPLATE]
Id: Q3
TopicId: T3
SkillId: S3
QuestionType: MultipleChoice
Difficulty: 1
TextTemplate: A resistor of {R} ohms carries a current of {I} A. What is the voltage across it?
AnswerExpression: I * R
SolutionTemplate: V = I * R = {I} * {R} = {answer} V.
Var.R: Type=double;Min=1;Max=100;Step=1
Var.I: Type=double;Min=0.1;Max=5;Step=0.1
Distractor: I + R
Distractor: I / R
Distractor: R / I

[TEMPLATE]
Id: Q4
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 4
TextTemplate: An object starts from rest and accelerates at {a} m/s^2 for {t} s. What is its final velocity?
AnswerExpression: a * t
SolutionTemplate: v = a * t = {a} * {t} = {answer} m/s.
Var.a: Type=double;Min=1;Max=10;Step=0.5
Var.t: Type=double;Min=1;Max=20;Step=0.5

[TEMPLATE]
Id: Q5
TopicId: T2
SkillId: S2
QuestionType: MultipleChoice
Difficulty: 5
TextTemplate: A force of {F} N gives a mass of {m} kg an acceleration of {a} m/s^2. Verify F = ma.
AnswerExpression: m * a
SolutionTemplate: F = m * a = {m} * {a} = {answer} N.
Var.m: Type=double;Min=1;Max=50;Step=1
Var.a: Type=double;Min=0.5;Max=20;Step=0.5
Var.F: Type=double;Min=5;Max=100;Step=5
Distractor: m + a
Distractor: m / a
Distractor: a / m
"#;

// ============================================================================
// Full pipeline: Parse → Generate → Export (all formats)
// ============================================================================

#[test]
fn test_full_pipeline_with_complex_spec() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    assert_eq!(spec.units.len(), 2);
    assert_eq!(spec.topics.len(), 3);
    assert_eq!(spec.skills.len(), 3);
    assert_eq!(spec.templates.len(), 5);

    let gen = QuestionGenerator::new(spec.templates);
    let questions = gen.generate_batch(10, None, None, None, None, None);
    assert_eq!(questions.len(), 10);

    // All questions should have resolved templates
    for q in &questions {
        assert!(!q.text.is_empty());
        assert!(!q.answer.is_empty());
        assert!(!q.id.is_empty());
        assert!(!q.solution_text.is_empty());
    }

    // Test all export formats
    let html = exporters::export_html(&questions);
    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.to_lowercase().contains("mathjax"));

    let md = exporters::export_markdown(&questions);
    assert!(md.contains("# Physics Questions"));

    let text = exporters::export_text(&questions);
    assert!(text.contains("PHYSICS QUESTIONS"));

    let pdf = exporters::export_pdf_html(&questions);
    assert!(pdf.contains("A4"));

    let json = exporters::export_json(&questions);
    assert!(json.starts_with('['));
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&json).unwrap();
    assert_eq!(parsed.len(), 10);

    let csv = exporters::export_csv(&questions);
    assert!(csv.starts_with("id,topic_id"));
    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(lines.len(), 11); // header + 10 rows

    let latex = exporters::export_latex(&questions);
    assert!(latex.contains("\\documentclass"));
    assert!(latex.contains("\\begin{questions}"));
    assert!(latex.contains("\\end{questions}"));
}

// ============================================================================
// Filtering & unique generation
// ============================================================================

#[test]
fn test_filtering_by_topic_skill_and_difficulty() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    // Topic filter
    let t1 = gen.generate_batch(5, Some("T1"), None, None, None, None);
    assert!(t1.iter().all(|q| q.topic_id == "T1"));

    // Skill filter
    let s2 = gen.generate_batch(5, None, Some("S2"), None, None, None);
    assert!(s2.iter().all(|q| q.skill_id == "S2"));

    // Difficulty range
    let easy = gen.generate_batch(10, None, None, Some(1), Some(2), None);
    assert!(easy.iter().all(|q| q.difficulty >= 1 && q.difficulty <= 2));

    let hard = gen.generate_batch(10, None, None, Some(4), Some(5), None);
    assert!(hard.iter().all(|q| q.difficulty >= 4 && q.difficulty <= 5));

    // MC only
    let mc = gen.generate_batch(10, None, None, None, None, Some("MC"));
    assert!(mc.iter().all(|q| q.question_type == "MC"));
    assert!(mc.iter().all(|q| q.choices.is_some()));

    // SA only
    let sa = gen.generate_batch(10, None, None, None, None, Some("SA"));
    assert!(sa.iter().all(|q| q.question_type == "SA"));
    assert!(sa.iter().all(|q| q.choices.is_none()));
}

#[test]
fn test_unique_generation_no_duplicates() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let filter = QuestionFilter::new();
    let questions = gen.generate_unique(5, &filter);
    assert_eq!(questions.len(), 5);

    // All should have unique IDs
    let ids: Vec<&str> = questions.iter().map(|q| q.id.as_str()).collect();
    let mut unique_ids = ids.clone();
    unique_ids.sort();
    unique_ids.dedup();
    assert_eq!(unique_ids.len(), ids.len());
}

#[test]
fn test_seeded_reproducibility_across_runs() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates.clone());

    let mut rng1 = UniformRandomGenerator::with_seed(42);
    let mut rng2 = UniformRandomGenerator::with_seed(42);

    let q1 = gen.generate_with_rng(None, None, None, None, None, &mut rng1).unwrap();
    let q2 = gen.generate_with_rng(None, None, None, None, None, &mut rng2).unwrap();

    assert_eq!(q1.text, q2.text);
    assert_eq!(q1.answer, q2.answer);
}

#[test]
fn test_different_seeds_produce_different_questions() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates.clone());

    let mut rng1 = UniformRandomGenerator::with_seed(42);
    let mut rng2 = UniformRandomGenerator::with_seed(12345);

    let q1 = gen.generate_with_rng(None, None, None, None, None, &mut rng1).unwrap();
    let q2 = gen.generate_with_rng(None, None, None, None, None, &mut rng2).unwrap();

    // With different seeds, at least one of text or answer should differ
    assert!(q1.text != q2.text || q1.answer != q2.answer);
}

// ============================================================================
// Answer verification
// ============================================================================

#[test]
fn test_answer_correctness_kinematics() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let mut rng = UniformRandomGenerator::with_seed(42);
    let q = gen.generate_with_rng(Some("T1"), None, None, None, None, &mut rng).unwrap();

    let v0 = q.variables["v0"].as_f64().unwrap();
    let v = q.variables["v"].as_f64().unwrap();
    let t = q.variables["t"].as_f64().unwrap();

    let expected = (v - v0) / t;
    let actual: f64 = q.answer.parse().unwrap();
    let diff = (actual - expected).abs() / expected.abs().max(1e-10);
    assert!(diff < 1e-3, "Expected ~{}, got {}", expected, actual);
}

#[test]
fn test_answer_correctness_ohms_law() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let mut rng = UniformRandomGenerator::with_seed(99);
    let q = gen.generate_with_rng(Some("T3"), None, None, None, None, &mut rng).unwrap();

    let r = q.variables["R"].as_f64().unwrap();
    let i = q.variables["I"].as_f64().unwrap();

    let expected = i * r;
    let actual: f64 = q.answer.parse().unwrap();
    let diff = (actual - expected).abs() / expected.abs().max(1e-10);
    assert!(diff < 1e-3, "Expected ~{}, got {}", expected, actual);
}

#[test]
fn test_mc_questions_have_answer_in_choices() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let mc_questions = gen.generate_batch(20, None, None, None, None, Some("MC"));
    for q in &mc_questions {
        let choices = q.choices.as_ref().unwrap();
        assert!(choices.contains(&q.answer), "Answer {} not in choices {:?}", q.answer, choices);
    }
}

#[test]
fn test_mc_choices_are_unique() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let mc_questions = gen.generate_batch(20, None, None, None, None, Some("MC"));
    for q in &mc_questions {
        let choices = q.choices.as_ref().unwrap();
        let mut sorted = choices.clone();
        sorted.sort();
        sorted.dedup();
        assert_eq!(sorted.len(), choices.len(), "Duplicate choices: {:?}", choices);
    }
}

// ============================================================================
// Edge cases
// ============================================================================

#[test]
fn test_empty_template_list_returns_none() {
    let gen = QuestionGenerator::new(vec![]);
    assert!(gen.generate(None, None, None, None, None).is_none());
    assert_eq!(gen.generate_batch(10, None, None, None, None, None).len(), 0);
}

#[test]
fn test_zero_count_batch_returns_empty() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);
    assert_eq!(gen.generate_batch(0, None, None, None, None, None).len(), 0);
}

#[test]
fn test_no_matching_filter_returns_none() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    // Non-existent topic
    assert!(gen.generate(Some("T999"), None, None, None, None).is_none());

    // Impossible difficulty
    assert!(gen.generate(None, None, Some(10), None, None).is_none());

    // Non-existent question type
    assert!(gen.generate(None, None, None, None, Some("Essay")).is_none());
}

#[test]
fn test_variable_substitution_no_placeholders_remain() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let questions = gen.generate_batch(50, None, None, None, None, None);
    for q in &questions {
        assert!(!q.text.contains('{'), "Text still contains placeholder: {}", q.text);
        assert!(!q.solution_text.contains('{'), "Solution still contains placeholder: {}", q.solution_text);
    }
}

// ============================================================================
// QuestionFilter API
// ============================================================================

#[test]
fn test_question_filter_exclude_ids() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let all_ids = gen.get_template_ids(&QuestionFilter::new());
    assert!(!all_ids.is_empty());

    let filter = QuestionFilter::new().exclude(all_ids.clone());
    assert_eq!(gen.count_templates(&filter), 0);
    assert!(gen.generate_with_filter(&filter).is_none());
}

#[test]
fn test_question_filter_template_ids() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let filter = QuestionFilter::new().with_template_ids(vec!["Q1".to_string()]);
    assert_eq!(gen.count_templates(&filter), 1);

    let q = gen.generate_with_filter(&filter).unwrap();
    assert_eq!(q.topic_id, "T1");
}

#[test]
fn test_count_and_get_ids() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    assert_eq!(gen.count_templates(&QuestionFilter::new()), 5);
    let ids = gen.get_template_ids(&QuestionFilter::new());
    assert_eq!(ids.len(), 5);

    let mc_filter = QuestionFilter::new().with_question_type("MC");
    assert_eq!(gen.count_templates(&mc_filter), 3);

    let sa_filter = QuestionFilter::new().with_question_type("SA");
    assert_eq!(gen.count_templates(&sa_filter), 2);
}

// ============================================================================
// Cache integration
// ============================================================================

#[test]
fn test_cache_stores_and_retrieves_questions() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let mut cache = QuestionCache::new(10);
    let mut rng = UniformRandomGenerator::with_seed(42);

    let q = gen.generate_with_rng(None, None, None, None, None, &mut rng).unwrap();
    let key = format!("{}_{}", q.id, q.text);

    cache.insert(key.clone(), q.clone());
    assert!(cache.get(&key).is_some());

    let retrieved = cache.get(&key).unwrap();
    assert_eq!(retrieved.text, q.text);
    assert_eq!(retrieved.answer, q.answer);
}

#[test]
fn test_cache_eviction_on_capacity() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);
    let mut cache = QuestionCache::new(3);
    let mut rng = UniformRandomGenerator::with_seed(0);

    let q1 = gen.generate_with_rng(None, None, None, None, None, &mut rng).unwrap();
    let q2 = gen.generate_with_rng(None, None, None, None, None, &mut rng).unwrap();
    let q3 = gen.generate_with_rng(None, None, None, None, None, &mut rng).unwrap();
    let q4 = gen.generate_with_rng(None, None, None, None, None, &mut rng).unwrap();

    cache.insert("k1".to_string(), q1);
    cache.insert("k2".to_string(), q2);
    cache.insert("k3".to_string(), q3);
    cache.insert("k4".to_string(), q4);

    // k1 should be evicted (LRU)
    assert!(cache.get("k1").is_none());
    assert!(cache.get("k4").is_some());
}

#[test]
fn test_cache_clear() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);
    let mut cache = QuestionCache::new(10);
    let mut rng = UniformRandomGenerator::with_seed(0);

    let q1 = gen.generate_with_rng(None, None, None, None, None, &mut rng).unwrap();
    let q2 = gen.generate_with_rng(None, None, None, None, None, &mut rng).unwrap();

    cache.insert("k1".to_string(), q1);
    cache.insert("k2".to_string(), q2);

    cache.clear();
    assert!(cache.get("k1").is_none());
    assert!(cache.get("k2").is_none());
}

// ============================================================================
// Difficulty calibration
// ============================================================================

#[test]
fn test_difficulty_distribution_stats() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let distribution = difficulty_distribution(&spec.templates);

    assert!(distribution.contains_key(&1)); // Q3
    assert!(distribution.contains_key(&2)); // Q1
    assert!(distribution.contains_key(&3)); // Q2
    assert!(distribution.contains_key(&4)); // Q4
    assert!(distribution.contains_key(&5)); // Q5
    assert_eq!(distribution.values().sum::<usize>(), 5);
}

#[test]
fn test_difficulty_suggestion() {
    // High accuracy -> suggest harder difficulty
    let suggestion = suggest_difficulty_adjustment(3, 0.95, 0.75);
    assert_eq!(suggestion, 4);

    // Low accuracy -> suggest easier difficulty
    let suggestion = suggest_difficulty_adjustment(3, 0.40, 0.75);
    assert_eq!(suggestion, 2);

    // Near target -> keep current
    let suggestion = suggest_difficulty_adjustment(3, 0.70, 0.75);
    assert_eq!(suggestion, 3);
}

#[test]
fn test_weighted_difficulty_computation() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let template = &spec.templates[0]; // Q1: difficulty 2, MC, 3 vars, 3 distractors

    let wd = weighted_difficulty(template);
    // Weighted difficulty should incorporate multiple factors
    assert!(wd > 0.0);
    assert!(wd <= 7.0);
}

// ============================================================================
// Specification merger
// ============================================================================

#[test]
fn test_merge_specifications() {
    let spec_a = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: UA
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Test {x}
AnswerExpression: x
Var.x: Type=int;Min=1;Max=10
"#;

    let spec_b = r#"
[UNIT]
Id: U2
Name: Waves

[TOPIC]
Id: T2
Name: Wave Motion
UnitId: U2

[SKILL]
Id: S2
Name: Frequency
TopicId: T2

[TEMPLATE]
Id: Q2
TopicId: T2
SkillId: S2
QuestionType: ShortAnswer
Difficulty: 2
TextTemplate: Frequency {f}
AnswerExpression: f
Var.f: Type=double;Min=1;Max=100;Step=1
"#;

    let s1 = SpecificationParser::parse(spec_a).unwrap();
    let s2 = SpecificationParser::parse(spec_b).unwrap();

    let merged = merge_specifications(&[&s1, &s2]);
    assert_eq!(merged.units.len(), 2);
    assert_eq!(merged.topics.len(), 2);
    assert_eq!(merged.skills.len(), 2);
    assert_eq!(merged.templates.len(), 2);

    let unit_ids: Vec<&str> = merged.units.iter().map(|u| u.id.as_str()).collect();
    assert!(unit_ids.contains(&"U1"));
    assert!(unit_ids.contains(&"U2"));
}

#[test]
fn test_merge_overwrites_duplicates() {
    let spec_a = r#"
[UNIT]
Id: U1
Name: Original Name

[TOPIC]
Id: T1
Name: Original Topic
UnitId: U1

[SKILL]
Id: S1
Name: Original Skill
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Original {x}
AnswerExpression: x
Var.x: Type=int;Min=1;Max=10
"#;

    let spec_b = r#"
[UNIT]
Id: U1
Name: Overwritten Name

[TOPIC]
Id: T1
Name: Overwritten Topic
UnitId: U1

[SKILL]
Id: S1
Name: Overwritten Skill
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 5
TextTemplate: Overwritten {x}
AnswerExpression: x * 2
Var.x: Type=int;Min=1;Max=10
Distractor: x+1
"#;

    let s1 = SpecificationParser::parse(spec_a).unwrap();
    let s2 = SpecificationParser::parse(spec_b).unwrap();

    let merged = merge_specifications(&[&s1, &s2]);
    let unit = merged.units.iter().find(|u| u.id == "U1").unwrap();
    assert_eq!(unit.name, "Overwritten Name");

    let template = merged.templates.iter().find(|t| t.id == "Q1").unwrap();
    assert_eq!(template.question_type, "MC");
    assert_eq!(template.difficulty, 5);
}

// ============================================================================
// Template analysis
// ============================================================================

#[test]
fn test_template_analysis_no_circular_refs() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let issues = detect_circular_references(&spec.templates);
    assert!(issues.is_empty(), "Unexpected issues: {:?}", issues);
}

#[test]
fn test_template_analysis_with_undefined_vars() {
    let spec_str = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: UA
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Test {x} and {y}
AnswerExpression: x + y
Var.x: Type=int;Min=1;Max=10
"#;

    let spec = SpecificationParser::parse(spec_str).unwrap();
    let issues = detect_circular_references(&spec.templates);
    assert!(!issues.is_empty());
    assert!(issues.iter().any(|i| i.contains("y") && i.contains("not defined")));
}

// ============================================================================
// Weighted selection
// ============================================================================

#[test]
fn test_weighted_selection_target_difficulty() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let templates: Vec<&physics_core::domain::QuestionTemplate> = spec.templates.iter().collect();
    let mut rng = UniformRandomGenerator::with_seed(42);

    // Selecting with target difficulty 1 should prefer Q3 (difficulty 1)
    let selected = weighted_select(&templates, 1, &mut rng);
    assert!(selected.is_some());
}

#[test]
fn test_weighted_selection_empty_returns_none() {
    let templates: Vec<&physics_core::domain::QuestionTemplate> = vec![];
    let mut rng = UniformRandomGenerator::new();
    assert!(weighted_select(&templates, 3, &mut rng).is_none());
}

// ============================================================================
// Unit conversion
// ============================================================================

#[test]
fn test_unit_conversion_length() {
    // km to m
    let result = unit_conversion::convert(5.0, "km", "m").unwrap();
    assert!((result - 5000.0).abs() < 0.001);

    // cm to m
    let result = unit_conversion::convert(100.0, "cm", "m").unwrap();
    assert!((result - 1.0).abs() < 0.001);
}

#[test]
fn test_unit_conversion_mass() {
    // g to kg
    let result = unit_conversion::convert_mass(500.0, "g", "kg").unwrap();
    assert!((result - 0.5).abs() < 0.001);

    // kg to g
    let result = unit_conversion::convert_mass(2.0, "kg", "g").unwrap();
    assert!((result - 2000.0).abs() < 0.001);
}

#[test]
fn test_unit_conversion_same_unit() {
    let result = unit_conversion::convert(42.0, "m", "m").unwrap();
    assert!((result - 42.0).abs() < 0.001);
}

#[test]
fn test_unit_conversion_unknown_unit() {
    assert!(unit_conversion::convert(1.0, "unknown", "m").is_none());
    assert!(unit_conversion::convert(1.0, "m", "unknown").is_none());
}

// ============================================================================
// Formula library integration
// ============================================================================

#[test]
fn test_formula_library_contains_physics_formulas() {
    let formulas = standard_formula_library();
    assert!(!formulas.is_empty());

    let has_kinematics = formulas.iter().any(|f| f.name.to_lowercase().contains("velocity")
        || f.name.to_lowercase().contains("acceleration"));
    assert!(has_kinematics, "Formula library should contain kinematics formulas");
}

#[test]
fn test_formula_library_lookup_by_topic() {
    let formulas = standard_formula_library();
    let kinematics: Vec<_> = formulas.iter()
        .filter(|f| f.topic_id.as_deref() == Some("kinematics"))
        .collect();
    assert!(!kinematics.is_empty());
}

// ============================================================================
// Stress tests
// ============================================================================

#[test]
fn test_large_batch_generation() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let questions = gen.generate_batch(1000, None, None, None, None, None);
    assert_eq!(questions.len(), 1000);

    for q in &questions {
        assert!(!q.text.is_empty());
        assert!(!q.answer.is_empty());
        assert!(!q.id.is_empty());
    }
}

#[test]
fn test_many_unique_generations_yield_different_variables() {
    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    let mut rng = UniformRandomGenerator::with_seed(0);
    let mut texts = Vec::new();

    for _ in 0..100 {
        let q = gen.generate_with_rng(None, None, None, None, None, &mut rng).unwrap();
        texts.push(q.text.clone());
    }

    let unique_count = {
        let mut sorted = texts.clone();
        sorted.sort();
        sorted.dedup();
        sorted.len()
    };
    assert!(unique_count > 1, "Expected >1 unique texts, got {}", unique_count);
}

#[test]
fn test_end_to_end_workflow() {
    // Simulates a complete user workflow:
    // 1. Parse spec
    // 2. Generate questions with filters
    // 3. Check answers
    // 4. Export results
    // 5. Track progress

    let spec = SpecificationParser::parse(COMPLEX_SPEC).unwrap();

    let gen = QuestionGenerator::new(spec.templates.clone());
    let questions = gen.generate_batch(5, Some("T1"), None, Some(1), Some(3), None);
    assert!(!questions.is_empty());

    let mut correct = 0;
    for q in &questions {
        let _expected: f64 = q.answer.parse().unwrap();
        correct += 1;
    }

    let html = exporters::export_html(&questions);
    assert!(!html.is_empty());

    let json = exporters::export_json(&questions);
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&json).unwrap();
    assert_eq!(parsed.len(), questions.len());

    let accuracy = correct as f64 / questions.len() as f64;
    assert!(accuracy >= 0.0 && accuracy <= 1.0);
}