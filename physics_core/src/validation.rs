//! Validation utilities for specification data.
//!
//! Provides functions for validating specification integrity including
//! cross-references, variable definitions, and template completeness.

use crate::domain::*;

/// Validates that a specification is internally consistent.
/// Returns a list of validation error messages.
pub fn validate_specification(spec: &Specification) -> Vec<String> {
    let mut errors = Vec::new();

    let unit_ids: std::collections::HashSet<&str> =
        spec.units.iter().map(|u| u.id.as_str()).collect();
    let topic_ids: std::collections::HashSet<&str> =
        spec.topics.iter().map(|t| t.id.as_str()).collect();
    let skill_ids: std::collections::HashSet<&str> =
        spec.skills.iter().map(|s| s.id.as_str()).collect();

    if spec.units.is_empty() {
        errors.push("Specification has no units.".to_string());
    }
    if spec.topics.is_empty() {
        errors.push("Specification has no topics.".to_string());
    }
    if spec.templates.is_empty() {
        errors.push("Specification has no question templates.".to_string());
    }

    for unit in &spec.units {
        if unit.name.is_empty() {
            errors.push(format!("Unit '{}' has an empty name.", unit.id));
        }
    }

    for topic in &spec.topics {
        if !unit_ids.contains(topic.unit_id.as_str()) {
            errors.push(format!(
                "Topic '{}' references unknown unit '{}'.",
                topic.id, topic.unit_id
            ));
        }
        if topic.name.is_empty() {
            errors.push(format!("Topic '{}' has an empty name.", topic.id));
        }
    }

    for skill in &spec.skills {
        if !topic_ids.contains(skill.topic_id.as_str()) {
            errors.push(format!(
                "Skill '{}' references unknown topic '{}'.",
                skill.id, skill.topic_id
            ));
        }
    }

    for template in &spec.templates {
        if !topic_ids.contains(template.topic_id.as_str()) {
            errors.push(format!(
                "Template '{}' references unknown topic '{}'.",
                template.id, template.topic_id
            ));
        }
        if !skill_ids.contains(template.skill_id.as_str()) {
            errors.push(format!(
                "Template '{}' references unknown skill '{}'.",
                template.id, template.skill_id
            ));
        }
        if template.variable_definitions.is_empty() {
            errors.push(format!(
                "Template '{}' has no variable definitions.",
                template.id
            ));
        }
        if template.answer_expression.is_empty() {
            errors.push(format!(
                "Template '{}' has no answer expression.",
                template.id
            ));
        }
        if template.difficulty < 1 || template.difficulty > 7 {
            errors.push(format!(
                "Template '{}' has invalid difficulty {} (must be 1-7).",
                template.id, template.difficulty
            ));
        }
    }

    errors
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_spec() {
        let spec = Specification {
            units: vec![Unit { id: "U1".into(), name: "Mech".into(), description: "".into() }],
            topics: vec![Topic { id: "T1".into(), name: "Kin".into(), unit_id: "U1".into(), description: "".into() }],
            skills: vec![Skill { id: "S1".into(), name: "UA".into(), topic_id: "T1".into(), description: "".into() }],
            templates: vec![QuestionTemplate {
                id: "Q1".into(), topic_id: "T1".into(), skill_id: "S1".into(),
                question_type: "SA".into(), difficulty: 2,
                text_template: "T".into(), answer_expression: "x".into(),
                solution_template: "".into(),
                variable_definitions: vec![VariableDefinition {
                    name: "x".into(), var_type: "int".into(),
                    min: Some(1.0), max: Some(10.0), step: None, enum_values: None,
                }],
                distractor_expressions: vec![],
            }],
        };
        let errors = validate_specification(&spec);
        assert!(errors.is_empty());
    }

    #[test]
    fn test_empty_spec() {
        let spec = Specification { units: vec![], topics: vec![], skills: vec![], templates: vec![] };
        let errors = validate_specification(&spec);
        assert!(!errors.is_empty());
    }

    #[test]
    fn test_invalid_difficulty() {
        let spec = Specification {
            units: vec![Unit { id: "U1".into(), name: "M".into(), description: "".into() }],
            topics: vec![Topic { id: "T1".into(), name: "K".into(), unit_id: "U1".into(), description: "".into() }],
            skills: vec![Skill { id: "S1".into(), name: "S".into(), topic_id: "T1".into(), description: "".into() }],
            templates: vec![QuestionTemplate {
                id: "Q1".into(), topic_id: "T1".into(), skill_id: "S1".into(),
                question_type: "SA".into(), difficulty: 10,
                text_template: "T".into(), answer_expression: "1".into(),
                solution_template: "".into(),
                variable_definitions: vec![VariableDefinition {
                    name: "x".into(), var_type: "int".into(),
                    min: Some(1.0), max: Some(5.0), step: None, enum_values: None,
                }],
                distractor_expressions: vec![],
            }],
        };
        let errors = validate_specification(&spec);
        assert!(errors.iter().any(|e| e.contains("invalid difficulty")));
    }
}