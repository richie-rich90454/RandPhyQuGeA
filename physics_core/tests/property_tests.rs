//! Property-based tests for the physics core library.
//!
//! Tests that verify invariants hold across random inputs,
//! complementing unit tests with broader coverage.

use physics_core::parser::SpecificationParser;
use physics_core::generator::QuestionGenerator;
use physics_core::evaluator::ExpressionEvaluator;
use physics_core::exporters;
use std::collections::HashMap;

#[test]
fn test_parse_roundtrip_parseable() {
    // Any valid specification should parse without errors
    let input = r#"
[UNIT]
Id: U1
Name: Mechanics
Description: Classical mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1
Description: Motion

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1
Description: Constant a

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 2
TextTemplate: A car travels {d} m in {t} s. Find speed.
AnswerExpression: d / t
SolutionTemplate: v = d / t = {d} / {t} = {answer}
Var.d: Type=double;Min=10;Max=100;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
"#;
    let spec = SpecificationParser::parse(input).unwrap();
    assert_eq!(spec.units.len(), 1);
    assert_eq!(spec.topics.len(), 1);
    assert_eq!(spec.skills.len(), 1);
    assert_eq!(spec.templates.len(), 1);
}

#[test]
fn test_generated_question_has_valid_answer() {
    let input = r#"
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
TextTemplate: Value is {x}
AnswerExpression: x * 2 + 1
SolutionTemplate: Solution
Var.x: Type=int;Min=1;Max=100
"#;
    let spec = SpecificationParser::parse(input).unwrap();
    let gen = QuestionGenerator::new(spec.templates);
    let q = gen.generate(None, None, None, None, None).unwrap();
    // Answer should be parseable as a number
    assert!(q.answer.parse::<f64>().is_ok());
}

#[test]
fn test_export_all_formats_produce_non_empty() {
    let input = r#"
[UNIT]
Id: U1
Name: M
[TOPIC]
Id: T1
Name: K
UnitId: U1
[SKILL]
Id: S1
Name: S
TopicId: T1
[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Test {x}
AnswerExpression: x
SolutionTemplate: S
Var.x: Type=int;Min=1;Max=5
"#;
    let spec = SpecificationParser::parse(input).unwrap();
    let gen = QuestionGenerator::new(spec.templates);
    let questions = gen.generate_batch(3, None, None, None, None, None);
    assert!(!questions.is_empty());

    let html = exporters::export_html(&questions);
    assert!(!html.is_empty());

    let md = exporters::export_markdown(&questions);
    assert!(!md.is_empty());

    let text = exporters::export_text(&questions);
    assert!(!text.is_empty());

    let json = exporters::export_json(&questions);
    assert!(!json.is_empty());

    let csv = exporters::export_csv(&questions);
    assert!(!csv.is_empty());
}

#[test]
fn test_evaluator_preserves_operator_precedence() {
    let vars = HashMap::new();
    // 2 + 3 * 4 = 14 (multiplication before addition)
    assert_eq!(ExpressionEvaluator::evaluate("2 + 3 * 4", &vars).unwrap(), 14.0);
    // (2 + 3) * 4 = 20
    assert_eq!(ExpressionEvaluator::evaluate("(2 + 3) * 4", &vars).unwrap(), 20.0);
    // 10 - 2 * 3 = 4
    assert_eq!(ExpressionEvaluator::evaluate("10 - 2 * 3", &vars).unwrap(), 4.0);
    // 10 / 2 + 3 = 8
    assert_eq!(ExpressionEvaluator::evaluate("10 / 2 + 3", &vars).unwrap(), 8.0);
}

#[test]
fn test_evaluator_nested_functions() {
    let vars = HashMap::new();
    // sqrt(sin(90)) = 1
    let result = ExpressionEvaluator::evaluate("sqrt(sin(90))", &vars).unwrap();
    assert!((result - 1.0).abs() < 1e-10);
    // abs(floor(-3.7)) = 4
    let result = ExpressionEvaluator::evaluate("abs(floor(-3.7))", &vars).unwrap();
    assert!((result - 4.0).abs() < 1e-10);
}

#[test]
fn test_generator_consistent_formatting() {
    let input = r#"
[UNIT]
Id: U1
Name: M
[TOPIC]
Id: T1
Name: K
UnitId: U1
[SKILL]
Id: S1
Name: S
TopicId: T1
[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: {x}
AnswerExpression: x
SolutionTemplate: S
Var.x: Type=int;Min=1;Max=5
"#;
    let spec = SpecificationParser::parse(input).unwrap();
    let gen = QuestionGenerator::new(spec.templates);
    // Generate 100 questions and verify all have consistent properties
    let questions = gen.generate_batch(100, None, None, None, None, None);
    assert_eq!(questions.len(), 100);
    for q in &questions {
        assert!(!q.id.is_empty());
        assert!(!q.text.is_empty());
        assert!(!q.answer.is_empty());
        assert_eq!(q.question_type, "SA");
        assert_eq!(q.difficulty, 1);
        assert!(q.choices.is_none());
    }
}

#[test]
fn test_mc_questions_have_choices() {
    let input = r#"
[UNIT]
Id: U1
Name: M
[TOPIC]
Id: T1
Name: K
UnitId: U1
[SKILL]
Id: S1
Name: S
TopicId: T1
[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 2
TextTemplate: What is {x} + {y}?
AnswerExpression: x + y
SolutionTemplate: Add them
Var.x: Type=int;Min=1;Max=10
Var.y: Type=int;Min=1;Max=10
Distractor: x - y
Distractor: x * y
"#;
    let spec = SpecificationParser::parse(input).unwrap();
    let gen = QuestionGenerator::new(spec.templates);
    let q = gen.generate(None, None, None, None, None).unwrap();
    assert_eq!(q.question_type, "MC");
    assert!(q.choices.is_some());
    let choices = q.choices.unwrap();
    // Answer + 2 distractors = 3 choices
    assert_eq!(choices.len(), 3);
    assert!(choices.contains(&q.answer));
}

#[test]
fn test_filter_by_topic_correct_count() {
    let input = r#"
[UNIT]
Id: U1
Name: M
[UNIT]
Id: U2
Name: E
[TOPIC]
Id: T1
Name: K
UnitId: U1
[TOPIC]
Id: T2
Name: C
UnitId: U2
[SKILL]
Id: S1
Name: UA
TopicId: T1
[SKILL]
Id: S2
Name: Ohm
TopicId: T2
[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: SA
Difficulty: 1
TextTemplate: A
AnswerExpression: 1
Var.x: Type=int;Min=1;Max=5
[TEMPLATE]
Id: Q2
TopicId: T2
SkillId: S2
QuestionType: SA
Difficulty: 2
TextTemplate: B
AnswerExpression: 2
Var.x: Type=int;Min=1;Max=5
"#;
    let spec = SpecificationParser::parse(input).unwrap();
    let gen = QuestionGenerator::new(spec.templates);
    let q = gen.generate(Some("T1"), None, None, None, None).unwrap();
    assert_eq!(q.topic_id, "T1");
}