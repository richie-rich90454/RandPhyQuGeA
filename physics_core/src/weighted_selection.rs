//! Weighted random selection for templates based on difficulty.
//!
//! Supports weighted selection where templates closer to a target difficulty
//! are more likely to be selected, enabling adaptive question difficulty.

use crate::domain::QuestionTemplate;
use crate::random::{RandomGenerator, UniformRandomGenerator};

/// Select a template with probability weighted by proximity to target difficulty.
/// Templates closest to the target difficulty get the highest selection weight.
pub fn weighted_select<'a>(
    templates: &[&'a QuestionTemplate],
    target_difficulty: i32,
    rng: &mut UniformRandomGenerator,
) -> Option<&'a QuestionTemplate> {
    if templates.is_empty() {
        return None;
    }

    let weights: Vec<f64> = templates
        .iter()
        .map(|t| {
            let diff = (t.difficulty - target_difficulty).abs() as f64;
            // Gaussian-like weight: templates at target difficulty get weight 1.0,
            // farther templates get exponentially decreasing weight
            (-diff * diff / 2.0).exp()
        })
        .collect();

    let total_weight: f64 = weights.iter().sum();
    if total_weight == 0.0 {
        // Fallback: uniform random if all weights are zero
        let idx = rng.next_int(0, templates.len() as i32 - 1) as usize;
        return Some(templates[idx]);
    }

    let threshold = rng.next_double(0.0, total_weight, 0.0001);
    let mut cumulative = 0.0;
    for (i, &w) in weights.iter().enumerate() {
        cumulative += w;
        if cumulative >= threshold {
            return Some(templates[i]);
        }
    }

    // Fallback: return last template
    templates.last().copied()
}

/// Select multiple templates with weighted probability, without replacement.
pub fn weighted_select_multiple<'a>(
    templates: &[&'a QuestionTemplate],
    count: usize,
    target_difficulty: i32,
    rng: &mut UniformRandomGenerator,
) -> Vec<&'a QuestionTemplate> {
    if count >= templates.len() {
        return templates.to_vec();
    }

    let mut available: Vec<&QuestionTemplate> = templates.to_vec();
    let mut selected: Vec<&QuestionTemplate> = Vec::new();

    for _ in 0..count {
        match weighted_select(&available, target_difficulty, rng) {
            Some(t) => {
                let idx = available.iter().position(|x| x.id == t.id).unwrap();
                selected.push(available.remove(idx));
            }
            None => break,
        }
    }

    selected
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::SpecificationParser;

    fn make_test_templates() -> Vec<QuestionTemplate> {
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
TextTemplate: Easy
AnswerExpression: 1
Var.x: Type=int;Min=1;Max=5
[TEMPLATE]
Id: Q2
TopicId: T1
SkillId: S1
QuestionType: SA
Difficulty: 3
TextTemplate: Medium
AnswerExpression: 2
Var.x: Type=int;Min=1;Max=5
[TEMPLATE]
Id: Q3
TopicId: T1
SkillId: S1
QuestionType: SA
Difficulty: 5
TextTemplate: Hard
AnswerExpression: 3
Var.x: Type=int;Min=1;Max=5
"#;
        SpecificationParser::parse(input).unwrap().templates
    }

    #[test]
    fn test_weighted_select_non_empty() {
        let templates = make_test_templates();
        let refs: Vec<&QuestionTemplate> = templates.iter().collect();
        let mut rng = UniformRandomGenerator::with_seed(42);

        let result = weighted_select(&refs, 3, &mut rng);
        assert!(result.is_some());
    }

    #[test]
    fn test_weighted_select_empty() {
        let templates: Vec<&QuestionTemplate> = vec![];
        let mut rng = UniformRandomGenerator::with_seed(42);

        let result = weighted_select(&templates, 3, &mut rng);
        assert!(result.is_none());
    }

    #[test]
    fn test_weighted_select_multiple() {
        let templates = make_test_templates();
        let refs: Vec<&QuestionTemplate> = templates.iter().collect();
        let mut rng = UniformRandomGenerator::with_seed(42);

        let selected = weighted_select_multiple(&refs, 2, 3, &mut rng);
        assert_eq!(selected.len(), 2);
        // Ensure no duplicates
        assert_ne!(selected[0].id, selected[1].id);
    }

    #[test]
    fn test_weighted_select_single() {
        let templates = make_test_templates();
        let refs: Vec<&QuestionTemplate> = templates.iter().collect();
        let mut rng = UniformRandomGenerator::with_seed(42);

        let selected = weighted_select_multiple(&refs, 1, 1, &mut rng);
        assert_eq!(selected.len(), 1);
    }
}