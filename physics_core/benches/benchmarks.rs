use physics_core::domain::*;
use physics_core::evaluator::ExpressionEvaluator;
use physics_core::exporters;
use physics_core::generator::QuestionGenerator;
use physics_core::parser::SpecificationParser;
use std::collections::HashMap;
use std::hint::black_box;

fn bench_spec() -> String {
    r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 2
TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s.
AnswerExpression: (v - v0) / t
SolutionTemplate: Use a = (v - v0) / t.
Var.v0: Type=double;Min=0;Max=20;Step=1
Var.v: Type=double;Min=20;Max=40;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
Distractor: (v + v0) / t
Distractor: v / t
"#.to_string()
}

fn main() {
    let spec_text = bench_spec();
    let spec = SpecificationParser::parse(&spec_text).unwrap();
    let gen = QuestionGenerator::new(spec.templates);

    // Benchmark parsing
    let start = std::time::Instant::now();
    for _ in 0..1000 {
        let _ = black_box(SpecificationParser::parse(&spec_text));
    }
    let parse_dur = start.elapsed();
    println!("Parse 1000x: {:?}", parse_dur);

    // Benchmark expression evaluation
    let mut vars = HashMap::new();
    vars.insert("v0".to_string(), 10.0);
    vars.insert("v".to_string(), 30.0);
    vars.insert("t".to_string(), 5.0);
    let start = std::time::Instant::now();
    for _ in 0..100000 {
        let _ = black_box(ExpressionEvaluator::evaluate("(v - v0) / t", &vars));
    }
    println!("Eval 100000x: {:?}", start.elapsed());

    // Benchmark question generation
    let start = std::time::Instant::now();
    for _ in 0..10000 {
        let _ = black_box(gen.generate(None, None, None, None, None));
    }
    println!("Generate 10000x: {:?}", start.elapsed());

    // Benchmark batch generation
    let start = std::time::Instant::now();
    let questions = black_box(gen.generate_batch(100, None, None, None, None, None));
    println!("Generate batch 100x: {:?}", start.elapsed());

    // Benchmark HTML export
    let start = std::time::Instant::now();
    let _html = black_box(exporters::export_html(&questions));
    println!("Export HTML 100 questions: {:?}", start.elapsed());

    // Benchmark Markdown export
    let start = std::time::Instant::now();
    let _md = black_box(exporters::export_markdown(&questions));
    println!("Export Markdown 100 questions: {:?}", start.elapsed());
}