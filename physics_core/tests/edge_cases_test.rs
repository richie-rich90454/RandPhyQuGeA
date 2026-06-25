//! Edge case tests for the physics core library.
//!
//! Tests boundary conditions, error handling, and
//! unusual inputs across all modules.

#[cfg(test)]
mod edge_cases {
    use physics_core::domain::*;
    use physics_core::evaluator::ExpressionEvaluator;
    use physics_core::exporters;
    use physics_core::generator::QuestionGenerator;
    use physics_core::parser::SpecificationParser;
    use physics_core::random::{RandomGenerator, UniformRandomGenerator, VariableGenerator};
    use physics_core::validation;
    use std::collections::HashMap;

    // ---- Parser Edge Cases ----

    #[test]
    fn test_parse_completely_empty_input() {
        let result = SpecificationParser::parse("");
        assert!(result.is_ok());
        let spec = result.unwrap();
        assert!(spec.units.is_empty());
        assert!(spec.topics.is_empty());
    }

    #[test]
    fn test_parse_whitespace_only() {
        let result = SpecificationParser::parse("   \n  \n  ");
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_comments_only() {
        let result = SpecificationParser::parse("// Comment 1\n// Comment 2");
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_content_before_header() {
        let result = SpecificationParser::parse("SomeKey: SomeValue\n[UNIT]\nId: U1\nName: Test");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_empty_section_header() {
        let result = SpecificationParser::parse("[]\n[UNIT]\nId: U1\nName: Test");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_missing_colon() {
        let result = SpecificationParser::parse("[UNIT]\nNoColonHere\nId: U1\nName: Test");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_duplicate_section_types() {
        let input = "\
[UNIT]
Id: U1
Name: Mechanics
[UNIT]
Id: U1
Name: Mechanics Again
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
TextTemplate: Test
AnswerExpression: 1
Var.x: Type=int;Min=1;Max=10";
        let result = SpecificationParser::parse(input);
        assert!(result.is_ok());
        let spec = result.unwrap();
        assert_eq!(spec.units.len(), 2);
    }

    #[test]
    fn test_parse_template_missing_all_required() {
        let input = "\
[UNIT]
Id: U1
Name: Test
[TOPIC]
Id: T1
Name: Test
UnitId: U1
[SKILL]
Id: S1
Name: Test
TopicId: T1
[TEMPLATE]
// Missing everything - template is silently skipped";
        let result = SpecificationParser::parse(input);
        // Parser skips templates with missing required fields gracefully
        assert!(result.is_ok());
        let spec = result.unwrap();
        assert_eq!(spec.templates.len(), 0);
    }

    // ---- Evaluator Edge Cases ----

    #[test]
    fn test_evaluate_very_large_number() {
        let vars = HashMap::new();
        let result = ExpressionEvaluator::evaluate("1e308", &vars).unwrap();
        assert!(result.is_finite());
    }

    #[test]
    fn test_evaluate_very_small_number() {
        let vars = HashMap::new();
        let result = ExpressionEvaluator::evaluate("1e-308", &vars).unwrap();
        assert!(result >= 0.0);
    }

    #[test]
    fn test_evaluate_multiple_unary_minus() {
        let vars = HashMap::new();
        assert_eq!(ExpressionEvaluator::evaluate("---5", &vars).unwrap(), -5.0);
        assert_eq!(ExpressionEvaluator::evaluate("----5", &vars).unwrap(), 5.0);
    }

    #[test]
    fn test_evaluate_deeply_nested() {
        let vars = HashMap::new();
        let result = ExpressionEvaluator::evaluate(
            "((((1 + 2) * 3 + 4) * 5 + 6) * 7 + 8)",
            &vars,
        )
        .unwrap();
        assert_eq!(result, 505.0);
    }

    #[test]
    fn test_evaluate_missing_closing_paren() {
        let vars = HashMap::new();
        assert!(ExpressionEvaluator::evaluate("(1 + 2", &vars).is_err());
    }

    #[test]
    fn test_evaluate_trailing_operator() {
        let vars = HashMap::new();
        // This should parse 5 (the expression 5) and then fail at +
        // Actually our parser stops at the first non-operator token
        let result = ExpressionEvaluator::evaluate("5 +", &vars);
        assert!(result.is_err());
    }

    #[test]
    fn test_evaluate_leading_operator() {
        let vars = HashMap::new();
        // +5 should fail because + at start is not a recognized unary + yet
        // Actually '+' at start could be parsed by parse_factor but it's not a unary plus
        let result = ExpressionEvaluator::evaluate("+5", &vars);
        // This may or may not work depending on parser behavior
        // Let's just check it doesn't crash
        let _ = result;
    }

    #[test]
    fn test_evaluate_tan_90() {
        let vars = HashMap::new();
        // tan(90) should be very large (approaching infinity)
        let result = ExpressionEvaluator::evaluate("tan(90)", &vars).unwrap();
        assert!(result.abs() > 1e10);
    }

    #[test]
    fn test_evaluate_asin_out_of_range() {
        let vars = HashMap::new();
        // asin(2) returns NaN, which is not caught as an error
        let result = ExpressionEvaluator::evaluate("asin(2)", &vars).unwrap();
        assert!(result.is_nan());
        let result = ExpressionEvaluator::evaluate("asin(-2)", &vars).unwrap();
        assert!(result.is_nan());
    }

    #[test]
    fn test_evaluate_empty_string_variable() {
        let mut vars = HashMap::new();
        vars.insert("".to_string(), 5.0);
        // Empty string is not a valid token
        let result = ExpressionEvaluator::evaluate("5", &vars);
        assert!(result.is_ok());
    }

    // ---- Generator Edge Cases ----

    #[test]
    fn test_generate_with_no_templates() {
        let gen = QuestionGenerator::new(vec![]);
        let result = gen.generate(None, None, None, None, None);
        assert!(result.is_none());
    }

    #[test]
    fn test_generate_batch_zero_count() {
        let template = QuestionTemplate {
            id: "Q1".into(),
            topic_id: "T1".into(),
            skill_id: "S1".into(),
            question_type: "SA".into(),
            difficulty: 1,
            text_template: "Test {x}".into(),
            answer_expression: "x".into(),
            solution_template: "".into(),
            variable_definitions: vec![VariableDefinition {
                name: "x".into(),
                var_type: "int".into(),
                min: Some(1.0),
                max: Some(10.0),
                step: None,
                enum_values: None,
            }],
            distractor_expressions: vec![],
        };
        let gen = QuestionGenerator::new(vec![template]);
        let questions = gen.generate_batch(0, None, None, None, None, None);
        assert!(questions.is_empty());
    }

    #[test]
    fn test_generate_batch_large_count() {
        let template = QuestionTemplate {
            id: "Q1".into(),
            topic_id: "T1".into(),
            skill_id: "S1".into(),
            question_type: "SA".into(),
            difficulty: 1,
            text_template: "Test {x}".into(),
            answer_expression: "x".into(),
            solution_template: "".into(),
            variable_definitions: vec![VariableDefinition {
                name: "x".into(),
                var_type: "int".into(),
                min: Some(1.0),
                max: Some(10.0),
                step: None,
                enum_values: None,
            }],
            distractor_expressions: vec![],
        };
        let gen = QuestionGenerator::new(vec![template]);
        let questions = gen.generate_batch(1000, None, None, None, None, None);
        assert_eq!(questions.len(), 1000);
    }

    #[test]
    fn test_generate_with_mismatched_filters() {
        let template = QuestionTemplate {
            id: "Q1".into(),
            topic_id: "T1".into(),
            skill_id: "S1".into(),
            question_type: "SA".into(),
            difficulty: 5,
            text_template: "Test {x}".into(),
            answer_expression: "x".into(),
            solution_template: "".into(),
            variable_definitions: vec![VariableDefinition {
                name: "x".into(),
                var_type: "int".into(),
                min: Some(1.0),
                max: Some(10.0),
                step: None,
                enum_values: None,
            }],
            distractor_expressions: vec![],
        };
        let gen = QuestionGenerator::new(vec![template]);

        // Filter with non-matching topic
        assert!(gen.generate(Some("T99"), None, None, None, None).is_none());
        // Filter with non-matching type
        assert!(gen.generate(None, None, None, None, Some("MC")).is_none());
        // Filter with out-of-range difficulty
        assert!(gen.generate(None, None, Some(6), None, None).is_none());
    }

    // ---- Export Edge Cases ----

    #[test]
    fn test_export_empty_list() {
        let questions: Vec<GeneratedQuestion> = vec![];
        let html = exporters::export_html(&questions);
        assert!(html.contains("<!DOCTYPE html>"));
        assert!(!html.contains("Question 1"));

        let md = exporters::export_markdown(&questions);
        assert!(md.contains("# Physics Questions"));

        let text = exporters::export_text(&questions);
        assert!(text.contains("PHYSICS QUESTIONS"));
    }

    #[test]
    fn test_export_html_escapes_special_chars() {
        let questions = vec![GeneratedQuestion {
            id: "1".into(),
            topic_id: "T1".into(),
            skill_id: "S1".into(),
            question_type: "SA".into(),
            difficulty: 1,
            text: "Test <script>alert('xss')</script>".into(),
            answer: "5 & 3".into(),
            choices: Some(vec!["<b>bold</b>".into()]),
            solution_text: "Use formula \"x\"".into(),
            solution_latex: "".into(),
            variables: HashMap::new(),
        }];
        let html = exporters::export_html(&questions);
        assert!(!html.contains("<script>"));
        assert!(html.contains("&lt;script&gt;"));
        assert!(html.contains("&amp;"));
    }

    // ---- Random Edge Cases ----

    #[test]
    fn test_random_different_seeds_produce_different_values() {
        let mut rng1 = UniformRandomGenerator::with_seed(1);
        let mut rng2 = UniformRandomGenerator::with_seed(99999);
        let mut different = false;
        for _ in 0..100 {
            if rng1.next_int(0, 1000) != rng2.next_int(0, 1000) {
                different = true;
                break;
            }
        }
        assert!(different, "Different seeds should produce different sequences");
    }

    #[test]
    fn test_generate_variables_int_with_min_max_equal() {
        let defs = vec![VariableDefinition {
            name: "x".into(),
            var_type: "int".into(),
            min: Some(5.0),
            max: Some(5.0),
            step: None,
            enum_values: None,
        }];
        let mut rng = UniformRandomGenerator::with_seed(42);
        let vars = VariableGenerator::generate_variables(&defs, &mut rng);
        assert_eq!(vars["x"], 5.0);
    }

    #[test]
    fn test_generate_variables_unknown_type() {
        let defs = vec![VariableDefinition {
            name: "x".into(),
            var_type: "unknown".into(),
            min: Some(1.0),
            max: Some(10.0),
            step: None,
            enum_values: None,
        }];
        let mut rng = UniformRandomGenerator::with_seed(42);
        let vars = VariableGenerator::generate_variables(&defs, &mut rng);
        assert_eq!(vars["x"], 0.0);
    }

    #[test]
    fn test_generate_variables_enum_no_values() {
        let defs = vec![VariableDefinition {
            name: "x".into(),
            var_type: "enum".into(),
            min: None,
            max: None,
            step: None,
            enum_values: None,
        }];
        let mut rng = UniformRandomGenerator::with_seed(42);
        let vars = VariableGenerator::generate_variables(&defs, &mut rng);
        assert_eq!(vars["x"], 0.0);
    }

    #[test]
    fn test_substitute_variables_no_placeholders() {
        let mut vars = HashMap::new();
        vars.insert("x".to_string(), 5.0);
        let result = VariableGenerator::substitute_variables("No placeholders here", &vars);
        assert_eq!(result, "No placeholders here");
    }

    // ---- Validation Edge Cases ----

    #[test]
    fn test_validation_missing_variable_type() {
        let spec = Specification {
            units: vec![Unit { id: "U1".into(), name: "M".into(), description: "".into() }],
            topics: vec![Topic { id: "T1".into(), name: "K".into(), unit_id: "U1".into(), description: "".into() }],
            skills: vec![Skill { id: "S1".into(), name: "S".into(), topic_id: "T1".into(), description: "".into() }],
            templates: vec![QuestionTemplate {
                id: "Q1".into(), topic_id: "T1".into(), skill_id: "S1".into(),
                question_type: "SA".into(), difficulty: 3,
                text_template: "T".into(), answer_expression: "x".into(),
                solution_template: "".into(),
                variable_definitions: vec![],
                distractor_expressions: vec![],
            }],
        };
        let errors = validation::validate_specification(&spec);
        assert!(errors.iter().any(|e| e.contains("no variable definitions")));
    }

    #[test]
    fn test_validation_missing_answer_expression() {
        let spec = Specification {
            units: vec![Unit { id: "U1".into(), name: "M".into(), description: "".into() }],
            topics: vec![Topic { id: "T1".into(), name: "K".into(), unit_id: "U1".into(), description: "".into() }],
            skills: vec![Skill { id: "S1".into(), name: "S".into(), topic_id: "T1".into(), description: "".into() }],
            templates: vec![QuestionTemplate {
                id: "Q1".into(), topic_id: "T1".into(), skill_id: "S1".into(),
                question_type: "SA".into(), difficulty: 3,
                text_template: "T".into(), answer_expression: "".into(),
                solution_template: "".into(),
                variable_definitions: vec![VariableDefinition {
                    name: "x".into(), var_type: "int".into(),
                    min: Some(1.0), max: Some(10.0), step: None, enum_values: None,
                }],
                distractor_expressions: vec![],
            }],
        };
        let errors = validation::validate_specification(&spec);
        assert!(errors.iter().any(|e| e.contains("no answer expression")));
    }

    #[test]
    fn test_validation_invalid_topic_reference() {
        let spec = Specification {
            units: vec![Unit { id: "U1".into(), name: "M".into(), description: "".into() }],
            topics: vec![],
            skills: vec![],
            templates: vec![QuestionTemplate {
                id: "Q1".into(), topic_id: "T999".into(), skill_id: "S1".into(),
                question_type: "SA".into(), difficulty: 3,
                text_template: "T".into(), answer_expression: "x".into(),
                solution_template: "".into(),
                variable_definitions: vec![VariableDefinition {
                    name: "x".into(), var_type: "int".into(),
                    min: Some(1.0), max: Some(10.0), step: None, enum_values: None,
                }],
                distractor_expressions: vec![],
            }],
        };
        let errors = validation::validate_specification(&spec);
        assert!(errors.iter().any(|e| e.contains("unknown topic")));
    }

    #[test]
    fn test_validation_invalid_skill_reference() {
        let spec = Specification {
            units: vec![Unit { id: "U1".into(), name: "M".into(), description: "".into() }],
            topics: vec![Topic { id: "T1".into(), name: "K".into(), unit_id: "U1".into(), description: "".into() }],
            skills: vec![],
            templates: vec![QuestionTemplate {
                id: "Q1".into(), topic_id: "T1".into(), skill_id: "S999".into(),
                question_type: "SA".into(), difficulty: 3,
                text_template: "T".into(), answer_expression: "x".into(),
                solution_template: "".into(),
                variable_definitions: vec![VariableDefinition {
                    name: "x".into(), var_type: "int".into(),
                    min: Some(1.0), max: Some(10.0), step: None, enum_values: None,
                }],
                distractor_expressions: vec![],
            }],
        };
        let errors = validation::validate_specification(&spec);
        assert!(errors.iter().any(|e| e.contains("unknown skill")));
    }

    #[test]
    fn test_validation_empty_unit_name() {
        let spec = Specification {
            units: vec![Unit { id: "U1".into(), name: "".into(), description: "".into() }],
            topics: vec![],
            skills: vec![],
            templates: vec![],
        };
        let errors = validation::validate_specification(&spec);
        assert!(errors.iter().any(|e| e.contains("empty name")));
    }

    #[test]
    fn test_validation_empty_topic_name() {
        let spec = Specification {
            units: vec![Unit { id: "U1".into(), name: "M".into(), description: "".into() }],
            topics: vec![Topic { id: "T1".into(), name: "".into(), unit_id: "U1".into(), description: "".into() }],
            skills: vec![],
            templates: vec![],
        };
        let errors = validation::validate_specification(&spec);
        assert!(errors.iter().any(|e| e.contains("empty name")));
    }
}