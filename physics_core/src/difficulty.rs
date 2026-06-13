//! Difficulty calibration and adjustment module.
//!
//! Provides utilities for calibrating question difficulty levels,
//! mapping between difficulty scales, and computing weighted
//! difficulty scores for adaptive practice.

use crate::domain::QuestionTemplate;
use std::collections::HashMap;

/// Difficulty level constants.
pub const MIN_DIFFICULTY: i32 = 1;
pub const MAX_DIFFICULTY: i32 = 7;

/// Difficulty labels for human-readable display.
pub const DIFFICULTY_LABELS: [&str; 7] = [
    "Very Easy",
    "Easy",
    "Moderate",
    "Challenging",
    "Hard",
    "Very Hard",
    "Expert",
];

/// Difficulty color codes (hex) for UI display.
pub const DIFFICULTY_COLORS: [&str; 7] = [
    "#4CAF50", // Green - Very Easy
    "#8BC34A", // Light Green - Easy
    "#FFC107", // Amber - Moderate
    "#FF9800", // Orange - Challenging
    "#F44336", // Red - Hard
    "#9C27B0", // Purple - Very Hard
    "#000000", // Black - Expert
];

/// Get the human-readable label for a difficulty level.
pub fn difficulty_label(level: i32) -> &'static str {
    if level < MIN_DIFFICULTY || level > MAX_DIFFICULTY {
        return "Unknown";
    }
    DIFFICULTY_LABELS[(level - 1) as usize]
}

/// Get the color code for a difficulty level.
pub fn difficulty_color(level: i32) -> &'static str {
    if level < MIN_DIFFICULTY || level > MAX_DIFFICULTY {
        return "#9E9E9E";
    }
    DIFFICULTY_COLORS[(level - 1) as usize]
}

/// Clamp a difficulty value to the valid range [1, 7].
pub fn clamp_difficulty(level: i32) -> i32 {
    level.clamp(MIN_DIFFICULTY, MAX_DIFFICULTY)
}

/// Compute a weighted difficulty score based on the number of variables,
/// answer complexity, and template difficulty.
///
/// Higher scores indicate more complex questions.
pub fn weighted_difficulty(template: &QuestionTemplate) -> f64 {
    let base = template.difficulty as f64;

    // Variable count factor: more variables = more complex
    let var_factor = 1.0 + (template.variable_definitions.len() as f64).ln() * 0.3;

    // Answer expression complexity factor
    let expr_complexity = compute_expression_complexity(&template.answer_expression);
    let expr_factor = 1.0 + expr_complexity * 0.1;

    // Distractor factor: having distractors adds complexity
    let distractor_factor = if template.distractor_expressions.is_empty() {
        0.9
    } else {
        1.0 + (template.distractor_expressions.len() as f64).min(4.0) * 0.05
    };

    // Question type factor
    let type_factor = match template.question_type.as_str() {
        "MC" => 1.1,  // Multiple choice slightly harder (need to distinguish)
        "SA" => 1.0,  // Short answer baseline
        _ => 1.0,
    };

    let weighted = base * var_factor * expr_factor * distractor_factor * type_factor;

    // Clamp to reasonable range
    weighted.clamp(1.0, 7.0)
}

/// Compute a complexity score for an expression based on operations and nesting.
fn compute_expression_complexity(expr: &str) -> f64 {
    let mut score = 0.0;

    // Count operators
    for c in expr.chars() {
        match c {
            '+' | '-' => score += 0.5,
            '*' | '/' => score += 1.0,
            '(' => score += 0.5,
            _ => {}
        }
    }

    // Count function calls
    let functions = ["sin", "cos", "tan", "sqrt", "pow", "log", "ln", "abs", "exp"];
    for func in &functions {
        if expr.to_lowercase().contains(func) {
            score += 1.5;
        }
    }

    score
}

/// Suggest a difficulty adjustment based on user performance.
///
/// If the user is performing well (high accuracy), increase difficulty.
/// If struggling (low accuracy), decrease difficulty.
pub fn suggest_difficulty_adjustment(
    current_difficulty: i32,
    accuracy: f64,
    target_accuracy: f64,
) -> i32 {
    if accuracy > target_accuracy + 0.15 {
        // User is doing well, increase difficulty
        clamp_difficulty(current_difficulty + 1)
    } else if accuracy < target_accuracy - 0.15 {
        // User is struggling, decrease difficulty
        clamp_difficulty(current_difficulty - 1)
    } else {
        // Keep current difficulty
        current_difficulty
    }
}

/// Compute the distribution of templates by difficulty level.
pub fn difficulty_distribution(
    templates: &[QuestionTemplate],
) -> HashMap<i32, usize> {
    let mut dist = HashMap::new();
    for template in templates {
        *dist.entry(template.difficulty).or_insert(0) += 1;
    }
    dist
}

/// Find the most common difficulty level in a set of templates.
pub fn modal_difficulty(templates: &[QuestionTemplate]) -> Option<i32> {
    let dist = difficulty_distribution(templates);
    dist.into_iter()
        .max_by_key(|&(_, count)| count)
        .map(|(level, _)| level)
}

/// Compute the average difficulty of a set of templates.
pub fn average_difficulty(templates: &[QuestionTemplate]) -> f64 {
    if templates.is_empty() {
        return 0.0;
    }
    let sum: i32 = templates.iter().map(|t| t.difficulty).sum();
    sum as f64 / templates.len() as f64
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::*;

    fn make_template(difficulty: i32, var_count: usize, expr: &str) -> QuestionTemplate {
        QuestionTemplate {
            id: "Q1".into(),
            topic_id: "T1".into(),
            skill_id: "S1".into(),
            question_type: "SA".into(),
            difficulty,
            text_template: "Test".into(),
            answer_expression: expr.to_string(),
            solution_template: "".into(),
            variable_definitions: vec![
                VariableDefinition {
                    name: "x".into(),
                    var_type: "int".into(),
                    min: Some(1.0),
                    max: Some(10.0),
                    step: None,
                    enum_values: None,
                };
                var_count
            ],
            distractor_expressions: vec![],
        }
    }

    #[test]
    fn test_difficulty_label() {
        assert_eq!(difficulty_label(1), "Very Easy");
        assert_eq!(difficulty_label(4), "Challenging");
        assert_eq!(difficulty_label(7), "Expert");
        assert_eq!(difficulty_label(0), "Unknown");
        assert_eq!(difficulty_label(8), "Unknown");
    }

    #[test]
    fn test_difficulty_color() {
        assert_eq!(difficulty_color(1), "#4CAF50");
        assert_eq!(difficulty_color(7), "#000000");
        assert_eq!(difficulty_color(0), "#9E9E9E");
    }

    #[test]
    fn test_clamp_difficulty() {
        assert_eq!(clamp_difficulty(0), 1);
        assert_eq!(clamp_difficulty(5), 5);
        assert_eq!(clamp_difficulty(10), 7);
    }

    #[test]
    fn test_weighted_difficulty() {
        let template = make_template(3, 2, "x + y");
        let weighted = weighted_difficulty(&template);
        assert!(weighted >= 1.0 && weighted <= 7.0);
    }

    #[test]
    fn test_weighted_difficulty_complex_expression() {
        let simple = make_template(3, 1, "x");
        let complex = make_template(3, 1, "sin(x) * sqrt(y) / (a + b)");
        assert!(weighted_difficulty(&complex) > weighted_difficulty(&simple));
    }

    #[test]
    fn test_suggest_increase_difficulty() {
        // High accuracy should suggest increasing
        let new = suggest_difficulty_adjustment(3, 0.95, 0.75);
        assert_eq!(new, 4);
    }

    #[test]
    fn test_suggest_decrease_difficulty() {
        // Low accuracy should suggest decreasing
        let new = suggest_difficulty_adjustment(3, 0.4, 0.75);
        assert_eq!(new, 2);
    }

    #[test]
    fn test_suggest_keep_difficulty() {
        let new = suggest_difficulty_adjustment(3, 0.7, 0.75);
        assert_eq!(new, 3);
    }

    #[test]
    fn test_suggest_at_boundaries() {
        // Can't go below 1
        assert_eq!(suggest_difficulty_adjustment(1, 0.4, 0.75), 1);
        // Can't go above 7
        assert_eq!(suggest_difficulty_adjustment(7, 0.95, 0.75), 7);
    }

    #[test]
    fn test_difficulty_distribution() {
        let templates = vec![
            make_template(1, 1, "x"),
            make_template(1, 1, "x"),
            make_template(3, 1, "x"),
            make_template(5, 1, "x"),
        ];
        let dist = difficulty_distribution(&templates);
        assert_eq!(dist[&1], 2);
        assert_eq!(dist[&3], 1);
        assert_eq!(dist[&5], 1);
    }

    #[test]
    fn test_modal_difficulty() {
        let templates = vec![
            make_template(1, 1, "x"),
            make_template(3, 1, "x"),
            make_template(3, 1, "x"),
            make_template(5, 1, "x"),
        ];
        assert_eq!(modal_difficulty(&templates), Some(3));
    }

    #[test]
    fn test_modal_difficulty_empty() {
        assert_eq!(modal_difficulty(&[]), None);
    }

    #[test]
    fn test_average_difficulty() {
        let templates = vec![
            make_template(1, 1, "x"),
            make_template(3, 1, "x"),
            make_template(5, 1, "x"),
        ];
        assert_eq!(average_difficulty(&templates), 3.0);
    }

    #[test]
    fn test_average_difficulty_empty() {
        assert_eq!(average_difficulty(&[]), 0.0);
    }
}