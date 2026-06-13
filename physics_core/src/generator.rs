//! Question generation engine.
//!
//! Selects random templates matching user filters, generates random
//! variable values within defined ranges, evaluates answer expressions,
//! and produces complete questions with distractors and solutions.

use crate::domain::*;
use crate::evaluator::ExpressionEvaluator;
use crate::random::{RandomGenerator, UniformRandomGenerator, VariableGenerator};
use std::collections::HashMap;

pub struct QuestionGenerator {
    templates: Vec<QuestionTemplate>,
}

impl QuestionGenerator {
    pub fn new(templates: Vec<QuestionTemplate>) -> Self {
        QuestionGenerator { templates }
    }

    pub fn generate(
        &self,
        topic_id: Option<&str>,
        skill_id: Option<&str>,
        min_difficulty: Option<i32>,
        max_difficulty: Option<i32>,
        question_type: Option<&str>,
    ) -> Option<GeneratedQuestion> {
        let mut rng = UniformRandomGenerator::new();
        self.generate_with_rng(
            topic_id,
            skill_id,
            min_difficulty,
            max_difficulty,
            question_type,
            &mut rng,
        )
    }

    pub fn generate_with_rng(
        &self,
        topic_id: Option<&str>,
        skill_id: Option<&str>,
        min_difficulty: Option<i32>,
        max_difficulty: Option<i32>,
        question_type: Option<&str>,
        rng: &mut UniformRandomGenerator,
    ) -> Option<GeneratedQuestion> {
        let candidates = self.filter_templates(
            topic_id, skill_id, min_difficulty, max_difficulty, question_type,
        );

        if candidates.is_empty() {
            return None;
        }

        let idx = rng.next_int(0, candidates.len() as i32 - 1) as usize;
        let template = &candidates[idx];

        Some(Self::generate_from_template(template, rng))
    }

    pub fn generate_batch(
        &self,
        count: usize,
        topic_id: Option<&str>,
        skill_id: Option<&str>,
        min_difficulty: Option<i32>,
        max_difficulty: Option<i32>,
        question_type: Option<&str>,
    ) -> Vec<GeneratedQuestion> {
        let mut rng = UniformRandomGenerator::new();
        let mut results = Vec::new();

        for _ in 0..count {
            if let Some(q) = self.generate_with_rng(
                topic_id,
                skill_id,
                min_difficulty,
                max_difficulty,
                question_type,
                &mut rng,
            ) {
                results.push(q);
            }
        }

        results
    }

    fn filter_templates(
        &self,
        topic_id: Option<&str>,
        skill_id: Option<&str>,
        min_difficulty: Option<i32>,
        max_difficulty: Option<i32>,
        question_type: Option<&str>,
    ) -> Vec<&QuestionTemplate> {
        self.templates
            .iter()
            .filter(|t| {
                if let Some(tid) = topic_id {
                    if t.topic_id != tid {
                        return false;
                    }
                }
                if let Some(sid) = skill_id {
                    if t.skill_id != sid {
                        return false;
                    }
                }
                if let Some(min_d) = min_difficulty {
                    if t.difficulty < min_d {
                        return false;
                    }
                }
                if let Some(max_d) = max_difficulty {
                    if t.difficulty > max_d {
                        return false;
                    }
                }
                if let Some(qt) = question_type {
                    if t.question_type != qt {
                        return false;
                    }
                }
                true
            })
            .collect()
    }

    fn generate_from_template(
        template: &QuestionTemplate,
        rng: &mut UniformRandomGenerator,
    ) -> GeneratedQuestion {
        let variables = VariableGenerator::generate_variables(
            &template.variable_definitions,
            rng,
        );

        let text = VariableGenerator::substitute_variables(&template.text_template, &variables);

        let answer_value = ExpressionEvaluator::evaluate(
            &template.answer_expression,
            &variables,
        )
        .unwrap_or(0.0);

        let answer = Self::format_answer(answer_value);

        let choices = if template.question_type == "MC" {
            let distractors = Self::generate_distractors(template, answer_value, &variables);
            let mut all_choices = distractors;
            all_choices.push(answer.clone());
            Self::shuffle(&mut all_choices, rng);
            Some(all_choices)
        } else {
            None
        };

        let solution_text = VariableGenerator::substitute_variables(
            &template.solution_template,
            &variables,
        );
        let solution_text = solution_text.replace("{answer}", &answer);

        let solution_latex = template.solution_template.clone();

        // Build variables map for JSON
        let var_map: HashMap<String, serde_json::Value> = variables
            .iter()
            .map(|(k, v)| (k.clone(), serde_json::json!(*v)))
            .collect();

        GeneratedQuestion {
            id: uuid::Uuid::new_v4().to_string(),
            topic_id: template.topic_id.clone(),
            skill_id: template.skill_id.clone(),
            question_type: template.question_type.clone(),
            difficulty: template.difficulty,
            text,
            answer,
            choices,
            solution_text,
            solution_latex,
            variables: var_map,
        }
    }

    fn generate_distractors(
        template: &QuestionTemplate,
        answer: f64,
        variables: &HashMap<String, f64>,
    ) -> Vec<String> {
        let mut distractors = Vec::new();
        for expr in &template.distractor_expressions {
            if let Ok(val) = ExpressionEvaluator::evaluate(expr, variables) {
                let formatted = Self::format_answer(val);
                if formatted != Self::format_answer(answer) {
                    distractors.push(formatted);
                }
            }
        }
        distractors
    }

    fn shuffle<T>(list: &mut Vec<T>, rng: &mut UniformRandomGenerator) {
        for i in (1..list.len()).rev() {
            let j = rng.next_int(0, i as i32) as usize;
            list.swap(i, j);
        }
    }

    fn format_answer(value: f64) -> String {
        if value == value.trunc() {
            return format!("{}", value as i64);
        }
        let mut formatted = format!("{:.4}", value);
        formatted = formatted.trim_end_matches('0').to_string();
        if formatted.ends_with('.') {
            formatted.pop();
        }
        formatted
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::SpecificationParser;

    #[test]
    fn test_generate_question() {
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
Name: Uniform Acceleration
TopicId: T1

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
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let question = gen.generate(None, None, None, None, None).unwrap();

        assert_eq!(question.question_type, "MC");
        assert!(question.choices.is_some());
        assert!(!question.text.contains("{v0}"));
        assert!(!question.text.contains("{v}"));
    }

    #[test]
    fn test_generate_short_answer() {
        let input = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S2
Name: Free Fall
TopicId: T1

[TEMPLATE]
Id: Q2
TopicId: T1
SkillId: S2
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: A ball falls for {t} seconds. How far?
AnswerExpression: 0.5 * 9.81 * t * t
SolutionTemplate: s = 0.5 * 9.81 * {t}^2 = {answer} m
Var.t: Type=double;Min=1;Max=5;Step=0.5
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let question = gen.generate(None, None, None, None, None).unwrap();

        assert_eq!(question.question_type, "SA");
        assert!(question.choices.is_none());
    }

    #[test]
    fn test_batch_generation() {
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
TextTemplate: Test {x}
AnswerExpression: x * 2
SolutionTemplate: Solution
Var.x: Type=double;Min=1;Max=10;Step=1
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let questions = gen.generate_batch(10, None, None, None, None, None);
        assert_eq!(questions.len(), 10);
    }
}