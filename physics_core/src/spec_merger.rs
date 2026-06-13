//! Specification merger for combining multiple specifications.
//!
//! Allows merging partial specifications from different sources while
//! maintaining referential integrity by re-indexing IDs if needed.

use crate::domain::*;
use std::collections::HashMap;

/// Merge multiple specifications into one, deduplicating by ID.
/// Later specifications' entities take precedence over earlier ones with matching IDs.
pub fn merge_specifications(specs: &[&Specification]) -> Specification {
    let mut units_map: HashMap<String, Unit> = HashMap::new();
    let mut topics_map: HashMap<String, Topic> = HashMap::new();
    let mut skills_map: HashMap<String, Skill> = HashMap::new();
    let mut templates_map: HashMap<String, QuestionTemplate> = HashMap::new();

    for spec in specs {
        for unit in &spec.units {
            units_map.insert(unit.id.clone(), unit.clone());
        }
        for topic in &spec.topics {
            topics_map.insert(topic.id.clone(), topic.clone());
        }
        for skill in &spec.skills {
            skills_map.insert(skill.id.clone(), skill.clone());
        }
        for template in &spec.templates {
            templates_map.insert(template.id.clone(), template.clone());
        }
    }

    Specification {
        units: units_map.into_values().collect(),
        topics: topics_map.into_values().collect(),
        skills: skills_map.into_values().collect(),
        templates: templates_map.into_values().collect(),
    }
}

/// Compute the intersection of two specifications (entities present in both).
pub fn spec_intersection(a: &Specification, b: &Specification) -> Specification {
    let a_unit_ids: std::collections::HashSet<&str> = a.units.iter().map(|u| u.id.as_str()).collect();
    let a_topic_ids: std::collections::HashSet<&str> = a.topics.iter().map(|t| t.id.as_str()).collect();
    let a_skill_ids: std::collections::HashSet<&str> = a.skills.iter().map(|s| s.id.as_str()).collect();
    let a_template_ids: std::collections::HashSet<&str> = a.templates.iter().map(|t| t.id.as_str()).collect();

    Specification {
        units: b.units.iter().filter(|u| a_unit_ids.contains(u.id.as_str())).cloned().collect(),
        topics: b.topics.iter().filter(|t| a_topic_ids.contains(t.id.as_str())).cloned().collect(),
        skills: b.skills.iter().filter(|s| a_skill_ids.contains(s.id.as_str())).cloned().collect(),
        templates: b.templates.iter().filter(|t| a_template_ids.contains(t.id.as_str())).cloned().collect(),
    }
}

/// Filter a specification to only include entities referenced by the given topic IDs.
pub fn filter_by_topics(spec: &Specification, topic_ids: &[&str]) -> Specification {
    let topic_id_set: std::collections::HashSet<&str> = topic_ids.iter().copied().collect();
    let unit_ids: std::collections::HashSet<String> = spec.topics.iter()
        .filter(|t| topic_id_set.contains(t.id.as_str()))
        .map(|t| t.unit_id.clone())
        .collect();
    let skill_ids: std::collections::HashSet<String> = spec.skills.iter()
        .filter(|s| topic_id_set.contains(s.topic_id.as_str()))
        .map(|s| s.id.clone())
        .collect();

    Specification {
        units: spec.units.iter().filter(|u| unit_ids.contains(&u.id)).cloned().collect(),
        topics: spec.topics.iter().filter(|t| topic_id_set.contains(t.id.as_str())).cloned().collect(),
        skills: spec.skills.iter().filter(|s| topic_id_set.contains(s.topic_id.as_str())).cloned().collect(),
        templates: spec.templates.iter().filter(|t| topic_id_set.contains(t.topic_id.as_str())).cloned().collect(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::SpecificationParser;

    fn parse_simple(id_prefix: &str, unit_id: &str, topic_id: &str, skill_id: &str) -> Specification {
        let input = format!(r#"
[UNIT]
Id: {}
Name: U
[TOPIC]
Id: {}
Name: T
UnitId: {}
[SKILL]
Id: {}
Name: S
TopicId: {}
[TEMPLATE]
Id: {}_Q1
TopicId: {}
SkillId: {}
QuestionType: SA
Difficulty: 1
TextTemplate: T
AnswerExpression: 1
Var.x: Type=int;Min=1;Max=5
"#, unit_id, topic_id, unit_id, skill_id, topic_id, id_prefix, topic_id, skill_id);
        SpecificationParser::parse(&input).unwrap()
    }

    #[test]
    fn test_merge_two_specs() {
        let a = parse_simple("A", "U1", "T1", "S1");
        let b = parse_simple("B", "U1", "T2", "S2");
        let merged = merge_specifications(&[&a, &b]);
        assert_eq!(merged.units.len(), 1); // Same unit ID, deduplicated
        assert_eq!(merged.topics.len(), 2);
        assert_eq!(merged.skills.len(), 2);
        assert_eq!(merged.templates.len(), 2);
    }

    #[test]
    fn test_intersection() {
        let a = parse_simple("A", "U1", "T1", "S1");
        let b = parse_simple("B", "U1", "T1", "S1");
        let intersection = spec_intersection(&a, &b);
        assert_eq!(intersection.units.len(), 1);
        assert_eq!(intersection.topics.len(), 1);
        assert_eq!(intersection.skills.len(), 1);
    }

    #[test]
    fn test_filter_by_topics() {
        let a = parse_simple("A", "U1", "T1", "S1");
        let b = parse_simple("B", "U1", "T2", "S2");
        let merged = merge_specifications(&[&a, &b]);
        let filtered = filter_by_topics(&merged, &["T1"]);
        assert_eq!(filtered.topics.len(), 1);
        assert_eq!(filtered.templates.len(), 1);
    }
}