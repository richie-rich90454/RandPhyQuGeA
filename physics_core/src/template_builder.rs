//! Builder pattern for programmatic construction of question templates.
//!
//! Provides a fluent API for creating QuestionTemplate instances
//! without manually constructing all fields, useful for tests
//! and for importing questions from other formats.

use crate::domain::*;

/// A builder for constructing QuestionTemplate instances with defaults.
pub struct TemplateBuilder {
    id: String,
    topic_id: String,
    skill_id: String,
    question_type: String,
    difficulty: i32,
    text_template: String,
    answer_expression: String,
    solution_template: String,
    variable_definitions: Vec<VariableDefinition>,
    distractor_expressions: Vec<String>,
}

impl TemplateBuilder {
    pub fn new(id: &str, topic_id: &str, skill_id: &str) -> Self {
        TemplateBuilder {
            id: id.to_string(),
            topic_id: topic_id.to_string(),
            skill_id: skill_id.to_string(),
            question_type: "SA".to_string(),
            difficulty: 1,
            text_template: String::new(),
            answer_expression: String::new(),
            solution_template: String::new(),
            variable_definitions: Vec::new(),
            distractor_expressions: Vec::new(),
        }
    }

    pub fn question_type(mut self, qt: &str) -> Self {
        self.question_type = qt.to_string();
        self
    }

    pub fn difficulty(mut self, d: i32) -> Self {
        self.difficulty = d;
        self
    }

    pub fn text(mut self, t: &str) -> Self {
        self.text_template = t.to_string();
        self
    }

    pub fn answer(mut self, expr: &str) -> Self {
        self.answer_expression = expr.to_string();
        self
    }

    pub fn solution(mut self, s: &str) -> Self {
        self.solution_template = s.to_string();
        self
    }

    pub fn add_variable(
        mut self,
        name: &str,
        var_type: &str,
        min: f64,
        max: f64,
        step: Option<f64>,
    ) -> Self {
        self.variable_definitions.push(VariableDefinition {
            name: name.to_string(),
            var_type: var_type.to_string(),
            min: Some(min),
            max: Some(max),
            step,
            enum_values: None,
        });
        self
    }

    pub fn add_enum_variable(mut self, name: &str, values: Vec<&str>) -> Self {
        self.variable_definitions.push(VariableDefinition {
            name: name.to_string(),
            var_type: "enum".to_string(),
            min: None,
            max: None,
            step: None,
            enum_values: Some(values.iter().map(|s| s.to_string()).collect()),
        });
        self
    }

    pub fn add_distractor(mut self, expr: &str) -> Self {
        self.distractor_expressions.push(expr.to_string());
        self
    }

    pub fn build(self) -> QuestionTemplate {
        QuestionTemplate {
            id: self.id,
            topic_id: self.topic_id,
            skill_id: self.skill_id,
            question_type: self.question_type,
            difficulty: self.difficulty,
            text_template: self.text_template,
            answer_expression: self.answer_expression,
            solution_template: self.solution_template,
            variable_definitions: self.variable_definitions,
            distractor_expressions: self.distractor_expressions,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_builder_creates_template() {
        let template = TemplateBuilder::new("Q1", "T1", "S1")
            .question_type("MC")
            .difficulty(3)
            .text("What is {x} + {y}?")
            .answer("x + y")
            .solution("{x} + {y} = {answer}")
            .add_variable("x", "int", 1.0, 10.0, None)
            .add_variable("y", "int", 1.0, 10.0, None)
            .add_distractor("x * y")
            .add_distractor("x - y")
            .build();

        assert_eq!(template.id, "Q1");
        assert_eq!(template.question_type, "MC");
        assert_eq!(template.difficulty, 3);
        assert_eq!(template.variable_definitions.len(), 2);
        assert_eq!(template.distractor_expressions.len(), 2);
    }

    #[test]
    fn test_builder_defaults() {
        let template = TemplateBuilder::new("Q", "T", "S").build();
        assert_eq!(template.question_type, "SA");
        assert_eq!(template.difficulty, 1);
        assert!(template.variable_definitions.is_empty());
    }

    #[test]
    fn test_builder_enum_variable() {
        let template = TemplateBuilder::new("Q", "T", "S")
            .add_enum_variable("dir", vec!["N", "S", "E", "W"])
            .build();

        let vd = &template.variable_definitions[0];
        assert_eq!(vd.var_type, "enum");
        assert_eq!(
            vd.enum_values.as_ref().unwrap(),
            &vec!["N", "S", "E", "W"]
        );
    }
}