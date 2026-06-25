//! Fuzz testing stubs for the physics core.
//!
//! These tests verify that random/malformed inputs don't cause panics
//! in the parser, evaluator, and generator.
//!
//! For real fuzz testing, use `cargo fuzz` with the fuzz targets
//! defined in the fuzz/ directory.

use physics_core::parser::SpecificationParser;
use physics_core::evaluator::ExpressionEvaluator;
use std::collections::HashMap;

#[test]
fn test_parser_handles_random_input() {
    // Random-ish strings should not panic
    let inputs = vec![
        "",
        "garbage",
        "[UNIT]\nId:\n",
        "[UNIT]\nId: U1\nName:\n[TOPIC]\n",
        "[[[[",
        "[UNIT]\n[TOPIC]\n[SKILL]\n[TEMPLATE]\n",
        "[UNIT]\nId: \nName: \nDescription: \n",
        "[TEMPLATE]\nId: X\n",
        "Key: Value\nKey2: Value2\n",
        "[UNIT]\nid: u1\nname: test\n[topic]\nid: t1\nname: test\nunitid: u1\n",
    ];

    for input in &inputs {
        // Should not panic, even if it returns an error
        let _ = SpecificationParser::parse(input);
    }
}

#[test]
fn test_evaluator_handles_random_input() {
    let vars = HashMap::new();
    let expressions = vec![
        "",
        "   ",
        "x + y + z",
        "sin(cos(tan(45)))",
        "1/0",
        "sqrt(-1)",
        "log(-10)",
        "ln(0)",
        "((((1)))))",
        "1+++2",
        "pow(2,3,4)",
    ];

    for expr in &expressions {
        // Should not panic, even if it returns an error
        let _ = ExpressionEvaluator::evaluate(expr, &vars);
    }
}

#[test]
fn test_evaluator_handles_extreme_values() {
    let mut vars = HashMap::new();
    vars.insert("big".to_string(), f64::MAX);
    vars.insert("small".to_string(), f64::MIN_POSITIVE);
    vars.insert("neg".to_string(), f64::MIN);

    let expressions = vec![
        "big + big",
        "big * 2",
        "small / 2",
        "neg * neg",
        "sin(big)",
        "exp(big)",
    ];

    for expr in &expressions {
        let _ = ExpressionEvaluator::evaluate(expr, &vars);
    }
}

#[test]
fn test_parser_handles_malformed_sections() {
    let inputs = vec![
        "[]\n",
        "[ \n]\n",
        "[UNIT\nId: U1\n",
        "[UNIT]\nId:U1\nName: Test\n[TOPIC]\nId:\nName:\nUnitId:\n",
        "[UNIT]\nId: U1\nName: Test\n[TOPIC]\nId:T1\nUnitId: U99\n",
        "// Comment only\n\n[UNIT]\nId: U1\nName: T\n",
        "[UNIT]\nId: U1\nName: x\n[UNIT]\nId: U1\nName: y\n",
    ];

    for input in &inputs {
        let _ = SpecificationParser::parse(input);
    }
}