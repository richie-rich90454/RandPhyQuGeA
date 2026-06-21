//! Question generation engine.
//!
//! Selects random templates matching user filters, generates random
//! variable values within defined ranges, evaluates answer expressions,
//! and produces complete questions with distractors and solutions.

use crate::domain::*;
use crate::evaluator::ExpressionEvaluator;
use crate::random::{RandomGenerator, UniformRandomGenerator, VariableGenerator};
use std::collections::HashMap;

/// Structured filter for question generation with builder-like API.
#[derive(Debug, Clone, Default)]
pub struct QuestionFilter {
    pub topic_id: Option<String>,
    pub skill_id: Option<String>,
    pub min_difficulty: Option<i32>,
    pub max_difficulty: Option<i32>,
    pub question_type: Option<String>,
    pub exclude_ids: Vec<String>,
    pub template_ids: Option<Vec<String>>,
}

impl QuestionFilter {
    pub fn new() -> Self {
        QuestionFilter::default()
    }

    pub fn with_topic(mut self, topic_id: &str) -> Self {
        self.topic_id = Some(topic_id.to_string());
        self
    }

    pub fn with_skill(mut self, skill_id: &str) -> Self {
        self.skill_id = Some(skill_id.to_string());
        self
    }

    pub fn with_difficulty_range(mut self, min: i32, max: i32) -> Self {
        self.min_difficulty = Some(min);
        self.max_difficulty = Some(max);
        self
    }

    pub fn with_question_type(mut self, qt: &str) -> Self {
        self.question_type = Some(qt.to_string());
        self
    }

    pub fn exclude(mut self, ids: Vec<String>) -> Self {
        self.exclude_ids = ids;
        self
    }

    pub fn with_template_ids(mut self, ids: Vec<String>) -> Self {
        self.template_ids = Some(ids);
        self
    }
}

/// Format a numeric answer, truncating trailing zeros.
///
/// Integers are rendered without a decimal point; other values are
/// rendered with up to four decimal places, stripping trailing zeros.
fn format_numeric_answer(value: f64) -> String {
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

/// Trait abstraction over question types.
///
/// Each handler knows how to generate choices, validate a user's answer,
/// and format the correct answer for a specific question type. New question
/// types can be added by implementing this trait and registering with the
/// `QuestionTypeRegistry` (see SubTask 8.2) without modifying the core
/// generator logic.
pub trait QuestionTypeHandler: Send + Sync {
    /// Returns the question type identifier (e.g., "MC", "SA", "TF").
    fn type_id(&self) -> &str;

    /// Generate the choices for the question.
    ///
    /// Returns an empty vector for types without choices (e.g., SA), or the
    /// full set of choices (distractors plus the answer, shuffled) for MC.
    fn generate_choices(
        &self,
        template: &QuestionTemplate,
        variables: &HashMap<String, f64>,
        answer: f64,
        evaluator: &ExpressionEvaluator,
    ) -> Vec<String>;

    /// Validate the user's answer against the correct answer.
    fn validate_answer(&self, user_answer: &str, correct_answer: f64, tolerance: f64) -> bool;

    /// Format the answer for display.
    fn format_answer(&self, answer: f64) -> String;
}

pub struct QuestionGenerator {
    templates: Vec<QuestionTemplate>,
    registry: QuestionTypeRegistry,
}

impl QuestionGenerator {
    pub fn new(templates: Vec<QuestionTemplate>) -> Self {
        QuestionGenerator {
            templates,
            registry: QuestionTypeRegistry::default(),
        }
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

        Some(self.generate_from_template(template, rng))
    }

    pub fn generate_with_filter(&self, filter: &QuestionFilter) -> Option<GeneratedQuestion> {
        let mut rng = UniformRandomGenerator::new();
        self.generate_with_filter_rng(filter, &mut rng)
    }

    pub fn generate_with_filter_rng(
        &self,
        filter: &QuestionFilter,
        rng: &mut UniformRandomGenerator,
    ) -> Option<GeneratedQuestion> {
        let candidates = self.filter_templates_by_struct(filter);

        if candidates.is_empty() {
            return None;
        }

        let idx = rng.next_int(0, candidates.len() as i32 - 1) as usize;
        let template = &candidates[idx];

        Some(self.generate_from_template(template, rng))
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

    pub fn generate_batch_with_filter(
        &self,
        count: usize,
        filter: &QuestionFilter,
    ) -> Vec<GeneratedQuestion> {
        let mut rng = UniformRandomGenerator::new();
        let mut results = Vec::new();

        for _ in 0..count {
            if let Some(q) = self.generate_with_filter_rng(filter, &mut rng) {
                results.push(q);
            }
        }

        results
    }

    /// Generate unique questions without duplicate templates.
    pub fn generate_unique(
        &self,
        count: usize,
        filter: &QuestionFilter,
    ) -> Vec<GeneratedQuestion> {
        let mut rng = UniformRandomGenerator::new();
        let mut results = Vec::new();
        let mut used_template_ids: Vec<String> = Vec::new();

        let base_candidates = self.filter_templates_by_struct(filter);
        if base_candidates.is_empty() {
            return results;
        }

        let max_attempts = count * 3;
        let mut attempts = 0;

        while results.len() < count && attempts < max_attempts {
            let available: Vec<&&QuestionTemplate> = base_candidates
                .iter()
                .filter(|t| !used_template_ids.contains(&t.id))
                .collect();

            if available.is_empty() {
                break;
            }

            let idx = rng.next_int(0, available.len() as i32 - 1) as usize;
            let template = available[idx];
            used_template_ids.push(template.id.clone());

            let q = self.generate_from_template(template, &mut rng);
            results.push(q);
            attempts += 1;
        }

        results
    }

    /// Count templates matching the given filter criteria.
    pub fn count_templates(&self, filter: &QuestionFilter) -> usize {
        self.filter_templates_by_struct(filter).len()
    }

    /// Get available template IDs matching the filter.
    pub fn get_template_ids(&self, filter: &QuestionFilter) -> Vec<String> {
        self.filter_templates_by_struct(filter)
            .iter()
            .map(|t| t.id.clone())
            .collect()
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

    fn filter_templates_by_struct(
        &self,
        filter: &QuestionFilter,
    ) -> Vec<&QuestionTemplate> {
        self.templates
            .iter()
            .filter(|t| {
                if let Some(ref tid) = filter.topic_id {
                    if t.topic_id != *tid {
                        return false;
                    }
                }
                if let Some(ref sid) = filter.skill_id {
                    if t.skill_id != *sid {
                        return false;
                    }
                }
                if let Some(min_d) = filter.min_difficulty {
                    if t.difficulty < min_d {
                        return false;
                    }
                }
                if let Some(max_d) = filter.max_difficulty {
                    if t.difficulty > max_d {
                        return false;
                    }
                }
                if let Some(ref qt) = filter.question_type {
                    if t.question_type != *qt {
                        return false;
                    }
                }
                if !filter.exclude_ids.is_empty() && filter.exclude_ids.contains(&t.id) {
                    return false;
                }
                if let Some(ref ids) = filter.template_ids {
                    if !ids.contains(&t.id) {
                        return false;
                    }
                }
                true
            })
            .collect()
    }

    fn generate_from_template(
        &self,
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

        // Dispatch to the appropriate handler via the registry. Unknown types
        // fall back to the ShortAnswerHandler.
        let handler = self.registry.get_or_default(&template.question_type);
        let evaluator = ExpressionEvaluator;

        let answer = handler.format_answer(answer_value);

        let choices_vec = handler.generate_choices(template, &variables, answer_value, &evaluator);
        let choices = if choices_vec.is_empty() {
            None
        } else {
            Some(choices_vec)
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

    pub(crate) fn shuffle<T>(list: &mut Vec<T>, rng: &mut UniformRandomGenerator) {
        for i in (1..list.len()).rev() {
            let j = rng.next_int(0, i as i32) as usize;
            list.swap(i, j);
        }
    }
}

/// Handler for multiple-choice questions.
///
/// Generates distractors from the template's distractor expressions, drops any
/// that equal the answer, appends the answer, and shuffles the result.
pub struct MultipleChoiceHandler;

impl QuestionTypeHandler for MultipleChoiceHandler {
    fn type_id(&self) -> &str {
        "MC"
    }

    fn generate_choices(
        &self,
        template: &QuestionTemplate,
        variables: &HashMap<String, f64>,
        answer: f64,
        _evaluator: &ExpressionEvaluator,
    ) -> Vec<String> {
        let mut choices = Vec::new();
        for expr in &template.distractor_expressions {
            if let Ok(val) = ExpressionEvaluator::evaluate(expr, variables) {
                let formatted = format_numeric_answer(val);
                if formatted != format_numeric_answer(answer) {
                    choices.push(formatted);
                }
            }
        }
        choices.push(format_numeric_answer(answer));
        let mut rng = UniformRandomGenerator::new();
        QuestionGenerator::shuffle(&mut choices, &mut rng);
        choices
    }

    fn validate_answer(&self, user_answer: &str, correct_answer: f64, tolerance: f64) -> bool {
        ExpressionEvaluator::compare_answers(
            user_answer,
            &format_numeric_answer(correct_answer),
            tolerance,
        )
    }

    fn format_answer(&self, answer: f64) -> String {
        format_numeric_answer(answer)
    }
}

/// Handler for short-answer questions.
///
/// Short-answer questions have no choices; the user types a numeric answer
/// that is validated against the correct value within a tolerance.
pub struct ShortAnswerHandler;

impl QuestionTypeHandler for ShortAnswerHandler {
    fn type_id(&self) -> &str {
        "SA"
    }

    fn generate_choices(
        &self,
        _template: &QuestionTemplate,
        _variables: &HashMap<String, f64>,
        _answer: f64,
        _evaluator: &ExpressionEvaluator,
    ) -> Vec<String> {
        Vec::new()
    }

    fn validate_answer(&self, user_answer: &str, correct_answer: f64, tolerance: f64) -> bool {
        ExpressionEvaluator::compare_answers(
            user_answer,
            &format_numeric_answer(correct_answer),
            tolerance,
        )
    }

    fn format_answer(&self, answer: f64) -> String {
        format_numeric_answer(answer)
    }
}

/// Handler for true/false questions.
///
/// Choices are always `["True", "False"]`. The correct answer is encoded as a
/// non-zero (True) or zero (False) numeric value.
pub struct TrueFalseHandler;

impl QuestionTypeHandler for TrueFalseHandler {
    fn type_id(&self) -> &str {
        "TF"
    }

    fn generate_choices(
        &self,
        _template: &QuestionTemplate,
        _variables: &HashMap<String, f64>,
        _answer: f64,
        _evaluator: &ExpressionEvaluator,
    ) -> Vec<String> {
        vec!["True".to_string(), "False".to_string()]
    }

    fn validate_answer(&self, user_answer: &str, correct_answer: f64, _tolerance: f64) -> bool {
        let trimmed = user_answer.trim().to_lowercase();
        let user_is_true = match trimmed.as_str() {
            "true" => true,
            "false" => false,
            _ => return false,
        };
        let correct_is_true = correct_answer != 0.0;
        user_is_true == correct_is_true
    }

    fn format_answer(&self, answer: f64) -> String {
        if answer != 0.0 {
            "True".to_string()
        } else {
            "False".to_string()
        }
    }
}

/// Handler for fill-in-the-blank questions.
///
/// Behaves like short-answer but the UI renders `___` where the blank is.
/// Validation is a case-insensitive trimmed string comparison.
pub struct FillInBlankHandler;

impl QuestionTypeHandler for FillInBlankHandler {
    fn type_id(&self) -> &str {
        "FB"
    }

    fn generate_choices(
        &self,
        _template: &QuestionTemplate,
        _variables: &HashMap<String, f64>,
        _answer: f64,
        _evaluator: &ExpressionEvaluator,
    ) -> Vec<String> {
        Vec::new()
    }

    fn validate_answer(&self, user_answer: &str, correct_answer: f64, _tolerance: f64) -> bool {
        let user = user_answer.trim().to_lowercase();
        let correct = self.format_answer(correct_answer).to_lowercase();
        user == correct
    }

    fn format_answer(&self, answer: f64) -> String {
        format_numeric_answer(answer)
    }
}

/// Handler for numeric-entry questions.
///
/// Like short-answer but only numeric input is accepted.
pub struct NumericEntryHandler;

impl QuestionTypeHandler for NumericEntryHandler {
    fn type_id(&self) -> &str {
        "NE"
    }

    fn generate_choices(
        &self,
        _template: &QuestionTemplate,
        _variables: &HashMap<String, f64>,
        _answer: f64,
        _evaluator: &ExpressionEvaluator,
    ) -> Vec<String> {
        Vec::new()
    }

    fn validate_answer(&self, user_answer: &str, correct_answer: f64, tolerance: f64) -> bool {
        ExpressionEvaluator::compare_answers(
            user_answer,
            &format_numeric_answer(correct_answer),
            tolerance,
        )
    }

    fn format_answer(&self, answer: f64) -> String {
        format_numeric_answer(answer)
    }
}

/// Registry of question type handlers, keyed by their `type_id`.
///
/// The registry allows new question types to be added without modifying the
/// core generator — simply implement `QuestionTypeHandler` and register an
/// instance. `get_or_default` falls back to `ShortAnswerHandler` for unknown
/// types.
pub struct QuestionTypeRegistry {
    handlers: HashMap<String, Box<dyn QuestionTypeHandler>>,
}

impl QuestionTypeRegistry {
    pub fn new() -> Self {
        QuestionTypeRegistry {
            handlers: HashMap::new(),
        }
    }

    pub fn register(&mut self, handler: Box<dyn QuestionTypeHandler>) {
        let id = handler.type_id().to_string();
        self.handlers.insert(id, handler);
    }

    pub fn get(&self, type_id: &str) -> Option<&dyn QuestionTypeHandler> {
        self.handlers.get(type_id).map(|h| h.as_ref())
    }

    /// Returns the handler for `type_id`, falling back to `ShortAnswerHandler`
    /// if the type is not registered.
    pub fn get_or_default(&self, type_id: &str) -> &dyn QuestionTypeHandler {
        self.handlers
            .get(type_id)
            .map(|h| h.as_ref())
            .unwrap_or_else(|| {
                self.handlers
                    .get("SA")
                    .map(|h| h.as_ref())
                    .expect("ShortAnswerHandler must always be registered as the default")
            })
    }
}

impl Default for QuestionTypeRegistry {
    fn default() -> Self {
        let mut registry = Self::new();
        registry.register(Box::new(ShortAnswerHandler));
        registry.register(Box::new(MultipleChoiceHandler));
        registry.register(Box::new(TrueFalseHandler));
        registry.register(Box::new(FillInBlankHandler));
        registry.register(Box::new(NumericEntryHandler));
        registry
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

    #[test]
    fn test_generate_with_seed_reproducibility() {
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
Var.x: Type=int;Min=1;Max=100
"#;

        let spec = SpecificationParser::parse(input).unwrap();
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
    fn test_no_matching_templates() {
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
Difficulty: 3
TextTemplate: Test {x}
AnswerExpression: x
Var.x: Type=int;Min=1;Max=10
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let q = gen.generate(None, None, Some(10), None, None);
        assert!(q.is_none());
    }

    #[test]
    fn test_filter_by_question_type() {
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
QuestionType: MultipleChoice
Difficulty: 1
TextTemplate: MC {x}
AnswerExpression: x
Var.x: Type=int;Min=1;Max=10
Distractor: x+1
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let q = gen.generate(None, None, None, None, Some("MC")).unwrap();
        assert_eq!(q.question_type, "MC");
        assert!(q.choices.is_some());
    }

    #[test]
    fn test_shuffle_preserves_elements() {
        let mut rng = UniformRandomGenerator::with_seed(42);
        let mut list = vec!["A", "B", "C", "D"];
        let original = list.clone();
        QuestionGenerator::shuffle(&mut list, &mut rng);
        assert_eq!(list.len(), original.len());
        for item in &original {
            assert!(list.contains(item));
        }
    }

    #[test]
    fn test_question_filter_builder() {
        let filter = QuestionFilter::new()
            .with_topic("T1")
            .with_skill("S1")
            .with_difficulty_range(1, 3)
            .with_question_type("MC");

        assert_eq!(filter.topic_id, Some("T1".to_string()));
        assert_eq!(filter.skill_id, Some("S1".to_string()));
        assert_eq!(filter.min_difficulty, Some(1));
        assert_eq!(filter.max_difficulty, Some(3));
        assert_eq!(filter.question_type, Some("MC".to_string()));
    }

    #[test]
    fn test_question_filter_exclude() {
        let filter = QuestionFilter::new()
            .exclude(vec!["Q1".to_string(), "Q2".to_string()]);

        assert_eq!(filter.exclude_ids.len(), 2);
        assert!(filter.exclude_ids.contains(&"Q1".to_string()));
    }

    #[test]
    fn test_generate_with_filter() {
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
Var.x: Type=int;Min=1;Max=10
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);

        let filter = QuestionFilter::new()
            .with_topic("T1")
            .with_difficulty_range(1, 5);

        let q = gen.generate_with_filter(&filter).unwrap();
        assert_eq!(q.topic_id, "T1");
    }

    #[test]
    fn test_generate_unique() {
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
TextTemplate: A {x}
AnswerExpression: x
Var.x: Type=int;Min=1;Max=10

[TEMPLATE]
Id: Q2
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 2
TextTemplate: B {x}
AnswerExpression: x * 2
Var.x: Type=int;Min=1;Max=10
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);
        let filter = QuestionFilter::new();

        let questions = gen.generate_unique(2, &filter);
        assert_eq!(questions.len(), 2);
        assert_ne!(questions[0].id, questions[1].id);
    }

    #[test]
    fn test_count_templates() {
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
TextTemplate: A {x}
AnswerExpression: x
Var.x: Type=int;Min=1;Max=10

[TEMPLATE]
Id: Q2
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 3
TextTemplate: B {x}
AnswerExpression: x * 2
Var.x: Type=int;Min=1;Max=10
Distractor: x+1
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let gen = QuestionGenerator::new(spec.templates);

        assert_eq!(gen.count_templates(&QuestionFilter::new()), 2);
        assert_eq!(gen.count_templates(&QuestionFilter::new().with_question_type("MC")), 1);
        assert_eq!(gen.count_templates(&QuestionFilter::new().with_difficulty_range(3, 5)), 1);
    }
}