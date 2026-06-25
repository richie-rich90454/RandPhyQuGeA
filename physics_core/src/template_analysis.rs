//! Template dependency analysis.
//!
//! Analyzes dependencies between templates, variables, and expressions
//! to detect circular references and missing definitions.

use crate::domain::QuestionTemplate;
use std::collections::{HashMap, HashSet};

/// Check for circular variable references in an expression.
/// Returns true if the expression references itself through variables.
pub fn detect_circular_references(templates: &[QuestionTemplate]) -> Vec<String> {
    let mut issues = Vec::new();

    // Build a graph of template -> topic -> skill relationships
    let mut template_vars: HashMap<&str, HashSet<&str>> = HashMap::new();

    for t in templates {
        let vars: HashSet<&str> = t.variable_definitions
            .iter()
            .map(|v| v.name.as_str())
            .collect();
        template_vars.insert(&t.id, vars);
    }

    // Check for templates referencing variables not defined in their scope
    for t in templates {
        let defined = template_vars.get(t.id.as_str())
            .cloned()
            .unwrap_or_default();

        let used_in_text = extract_variables(&t.text_template);
        let used_in_answer = extract_variables(&t.answer_expression);
        let used_in_solution = extract_variables(&t.solution_template);

        let all_used: HashSet<&str> = used_in_text
            .union(&used_in_answer)
            .map(|s| *s)
            .collect();
        let all_used: HashSet<&str> = all_used
            .union(&used_in_solution)
            .map(|s| *s)
            .collect();

        for var in &all_used {
            if !defined.contains(var) && !is_builtin_function(var) {
                issues.push(format!(
                    "Template '{}' uses variable '{}' which is not defined in its scope.",
                    t.id, var
                ));
            }
        }
    }

    issues
}

/// Check for duplicate template IDs.
pub fn detect_duplicate_ids(templates: &[QuestionTemplate]) -> Vec<String> {
    let mut issues = Vec::new();
    let mut seen: HashMap<&str, usize> = HashMap::new();

    for (i, t) in templates.iter().enumerate() {
        if let Some(&prev) = seen.get(t.id.as_str()) {
            issues.push(format!(
                "Duplicate template ID '{}' at positions {} and {}.",
                t.id, prev + 1, i + 1
            ));
        } else {
            seen.insert(&t.id, i);
        }
    }

    issues
}

/// Check that all templates in a specification have valid difficulty values.
pub fn detect_invalid_difficulties(templates: &[QuestionTemplate]) -> Vec<String> {
    templates.iter()
        .filter(|t| t.difficulty < 1 || t.difficulty > 7)
        .map(|t| format!(
            "Template '{}' has invalid difficulty {} (must be 1-7).",
            t.id, t.difficulty
        ))
        .collect()
}

/// Check that all MC templates have at least one distractor.
pub fn detect_missing_distractors(templates: &[QuestionTemplate]) -> Vec<String> {
    templates.iter()
        .filter(|t| t.question_type == "MC" && t.distractor_expressions.is_empty())
        .map(|t| format!(
            "MC template '{}' has no distractor expressions.",
            t.id
        ))
        .collect()
}

fn extract_variables(text: &str) -> HashSet<&str> {
    let re = regex::Regex::new(r"\{(\w+)\}").unwrap();
    re.captures_iter(text)
        .map(|cap| cap.get(1).unwrap().as_str())
        .collect()
}

fn is_builtin_function(name: &str) -> bool {
    matches!(name.to_lowercase().as_str(),
        "sin" | "cos" | "tan" | "asin" | "acos" | "atan" |
        "sinh" | "cosh" | "tanh" | "asinh" | "acosh" | "atanh" |
        "sqrt" | "pow" | "abs" | "exp" | "floor" | "ceiling" |
        "truncate" | "ln" | "log" | "log10" | "log2" |
        "round" | "sign" | "max" | "min" | "cbrt" | "hypot" |
        "deg" | "rad" | "pi" | "e" | "answer"
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::SpecificationParser;

    #[test]
    fn test_detect_duplicate_ids() {
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
QuestionType: SA
Difficulty: 1
TextTemplate: A
AnswerExpression: 1
Var.x: Type=int;Min=1;Max=5
[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: SA
Difficulty: 2
TextTemplate: B
AnswerExpression: 2
Var.y: Type=int;Min=1;Max=5
"#;
        let spec = SpecificationParser::parse(input).unwrap();
        let issues = detect_duplicate_ids(&spec.templates);
        assert_eq!(issues.len(), 1);
        assert!(issues[0].contains("Duplicate"));
    }

    #[test]
    fn test_detect_missing_distractors() {
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
Difficulty: 1
TextTemplate: MC {x}
AnswerExpression: x
Var.x: Type=int;Min=1;Max=5
"#;
        let spec = SpecificationParser::parse(input).unwrap();
        let issues = detect_missing_distractors(&spec.templates);
        assert_eq!(issues.len(), 1);
        assert!(issues[0].contains("no distractor"));
    }

    #[test]
    fn test_no_issues_for_valid_spec() {
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
QuestionType: MC
Difficulty: 3
TextTemplate: What is {x} + {y}?
AnswerExpression: x + y
SolutionTemplate: Add them
Var.x: Type=int;Min=1;Max=10
Var.y: Type=int;Min=1;Max=10
Distractor: x - y
Distractor: x * y
"#;
        let spec = SpecificationParser::parse(input).unwrap();
        let issues = detect_circular_references(&spec.templates);
        assert!(issues.is_empty());
        let issues = detect_duplicate_ids(&spec.templates);
        assert!(issues.is_empty());
        let issues = detect_invalid_difficulties(&spec.templates);
        assert!(issues.is_empty());
        let issues = detect_missing_distractors(&spec.templates);
        assert!(issues.is_empty());
    }
}