//! Specification metadata module.
//!
//! Provides metadata types for tracking specification version,
//! authorship, creation dates, and change history.

use serde::{Deserialize, Serialize};

/// Metadata about a specification file.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SpecMetadata {
    /// Specification format version.
    pub version: String,
    /// Human-readable title.
    pub title: String,
    /// Author name.
    pub author: String,
    /// Brief description.
    pub description: String,
    /// Creation date (ISO 8601 format).
    pub created_at: String,
    /// Last modification date (ISO 8601 format).
    pub updated_at: String,
    /// License identifier (e.g., "MIT", "CC-BY-4.0").
    pub license: String,
    /// Language code (e.g., "en", "zh").
    pub language: String,
    /// Subject area (e.g., "Physics", "Mathematics").
    pub subject: String,
    /// Target grade level or audience.
    pub target_audience: String,
    /// Custom tags for categorization.
    pub tags: Vec<String>,
}

impl Default for SpecMetadata {
    fn default() -> Self {
        SpecMetadata {
            version: "1.0.0".to_string(),
            title: "Untitled Specification".to_string(),
            author: "Unknown".to_string(),
            description: String::new(),
            created_at: String::new(),
            updated_at: String::new(),
            license: "MIT".to_string(),
            language: "en".to_string(),
            subject: "Physics".to_string(),
            target_audience: "High School".to_string(),
            tags: Vec::new(),
        }
    }
}

impl SpecMetadata {
    /// Create metadata with minimal required fields.
    pub fn new(title: &str, author: &str) -> Self {
        SpecMetadata {
            title: title.to_string(),
            author: author.to_string(),
            ..Default::default()
        }
    }

    /// Set the version field.
    pub fn with_version(mut self, version: &str) -> Self {
        self.version = version.to_string();
        self
    }

    /// Set the description field.
    pub fn with_description(mut self, description: &str) -> Self {
        self.description = description.to_string();
        self
    }

    /// Set the language field.
    pub fn with_language(mut self, language: &str) -> Self {
        self.language = language.to_string();
        self
    }

    /// Set the subject field.
    pub fn with_subject(mut self, subject: &str) -> Self {
        self.subject = subject.to_string();
        self
    }

    /// Set the target audience.
    pub fn with_target_audience(mut self, audience: &str) -> Self {
        self.target_audience = audience.to_string();
        self
    }

    /// Add a tag.
    pub fn with_tag(mut self, tag: &str) -> Self {
        self.tags.push(tag.to_string());
        self
    }

    /// Set the license.
    pub fn with_license(mut self, license: &str) -> Self {
        self.license = license.to_string();
        self
    }

    /// Serialize to JSON.
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }

    /// Deserialize from JSON.
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    /// Check if the metadata has all required fields populated.
    pub fn is_valid(&self) -> bool {
        !self.title.is_empty()
            && !self.author.is_empty()
            && !self.version.is_empty()
            && !self.language.is_empty()
    }
}

/// Statistics about a specification.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SpecStatistics {
    /// Number of units.
    pub unit_count: usize,
    /// Number of topics.
    pub topic_count: usize,
    /// Number of skills.
    pub skill_count: usize,
    /// Number of question templates.
    pub template_count: usize,
    /// Number of templates per question type.
    pub templates_by_type: std::collections::HashMap<String, usize>,
    /// Number of templates per difficulty level.
    pub templates_by_difficulty: std::collections::HashMap<i32, usize>,
    /// Number of templates per topic.
    pub templates_by_topic: std::collections::HashMap<String, usize>,
    /// Average number of variables per template.
    pub avg_variables_per_template: f64,
    /// Number of multiple-choice templates.
    pub mc_template_count: usize,
    /// Number of short-answer templates.
    pub sa_template_count: usize,
}

impl SpecStatistics {
    /// Compute statistics from a specification.
    pub fn from_specification(spec: &crate::domain::Specification) -> Self {
        let mut templates_by_type = std::collections::HashMap::new();
        let mut templates_by_difficulty = std::collections::HashMap::new();
        let mut templates_by_topic = std::collections::HashMap::new();
        let mut total_vars = 0usize;
        let mut mc_count = 0usize;
        let mut sa_count = 0usize;

        for template in &spec.templates {
            *templates_by_type
                .entry(template.question_type.clone())
                .or_insert(0) += 1;
            *templates_by_difficulty
                .entry(template.difficulty)
                .or_insert(0) += 1;
            *templates_by_topic
                .entry(template.topic_id.clone())
                .or_insert(0) += 1;
            total_vars += template.variable_definitions.len();

            match template.question_type.as_str() {
                "MC" => mc_count += 1,
                "SA" => sa_count += 1,
                _ => {}
            }
        }

        let avg_vars = if spec.templates.is_empty() {
            0.0
        } else {
            total_vars as f64 / spec.templates.len() as f64
        };

        SpecStatistics {
            unit_count: spec.units.len(),
            topic_count: spec.topics.len(),
            skill_count: spec.skills.len(),
            template_count: spec.templates.len(),
            templates_by_type,
            templates_by_difficulty,
            templates_by_topic,
            avg_variables_per_template: avg_vars,
            mc_template_count: mc_count,
            sa_template_count: sa_count,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::*;

    fn make_test_spec() -> crate::domain::Specification {
        crate::domain::Specification {
            units: vec![
                Unit { id: "U1".into(), name: "Mech".into(), description: "".into() },
                Unit { id: "U2".into(), name: "EM".into(), description: "".into() },
            ],
            topics: vec![
                Topic { id: "T1".into(), name: "Kin".into(), unit_id: "U1".into(), description: "".into() },
                Topic { id: "T2".into(), name: "Circ".into(), unit_id: "U2".into(), description: "".into() },
            ],
            skills: vec![
                Skill { id: "S1".into(), name: "UA".into(), topic_id: "T1".into(), description: "".into() },
                Skill { id: "S2".into(), name: "Ohm".into(), topic_id: "T2".into(), description: "".into() },
            ],
            templates: vec![
                QuestionTemplate {
                    id: "Q1".into(), topic_id: "T1".into(), skill_id: "S1".into(),
                    question_type: "MC".into(), difficulty: 2,
                    text_template: "T".into(), answer_expression: "1".into(),
                    solution_template: "".into(),
                    variable_definitions: vec![
                        VariableDefinition { name: "x".into(), var_type: "int".into(), min: Some(1.0), max: Some(10.0), step: None, enum_values: None },
                        VariableDefinition { name: "y".into(), var_type: "int".into(), min: Some(1.0), max: Some(10.0), step: None, enum_values: None },
                    ],
                    distractor_expressions: vec![],
                },
                QuestionTemplate {
                    id: "Q2".into(), topic_id: "T2".into(), skill_id: "S2".into(),
                    question_type: "SA".into(), difficulty: 3,
                    text_template: "T".into(), answer_expression: "2".into(),
                    solution_template: "".into(),
                    variable_definitions: vec![
                        VariableDefinition { name: "z".into(), var_type: "double".into(), min: Some(1.0), max: Some(10.0), step: Some(0.5), enum_values: None },
                    ],
                    distractor_expressions: vec![],
                },
            ],
        }
    }

    #[test]
    fn test_metadata_default() {
        let _meta = SpecMetadata::default();
        assert_eq!(_meta.version, "1.0.0");
        assert_eq!(_meta.language, "en");
        assert_eq!(_meta.license, "MIT");
    }

    #[test]
    fn test_metadata_builder() {
        let meta = SpecMetadata::new("Physics QBank", "John Doe")
            .with_version("2.0.0")
            .with_description("A collection of physics questions")
            .with_language("en")
            .with_subject("Physics")
            .with_target_audience("High School")
            .with_tag("mechanics")
            .with_tag("kinematics")
            .with_license("CC-BY-4.0");

        assert_eq!(meta.title, "Physics QBank");
        assert_eq!(meta.version, "2.0.0");
        assert_eq!(meta.tags.len(), 2);
        assert!(meta.is_valid());
    }

    #[test]
    fn test_metadata_invalid() {
        // An empty title makes the metadata invalid
        let invalid = SpecMetadata {
            title: "".to_string(),
            ..Default::default()
        };
        assert!(!invalid.is_valid());
    }

    #[test]
    fn test_metadata_json_roundtrip() {
        let meta = SpecMetadata::new("Test", "Author");
        let json = meta.to_json().unwrap();
        let parsed = SpecMetadata::from_json(&json).unwrap();
        assert_eq!(meta.title, parsed.title);
        assert_eq!(meta.author, parsed.author);
    }

    #[test]
    fn test_spec_statistics() {
        let spec = make_test_spec();
        let stats = SpecStatistics::from_specification(&spec);

        assert_eq!(stats.unit_count, 2);
        assert_eq!(stats.topic_count, 2);
        assert_eq!(stats.skill_count, 2);
        assert_eq!(stats.template_count, 2);
        assert_eq!(stats.mc_template_count, 1);
        assert_eq!(stats.sa_template_count, 1);
        assert_eq!(stats.avg_variables_per_template, 1.5);
        assert_eq!(*stats.templates_by_type.get("MC").unwrap(), 1);
        assert_eq!(*stats.templates_by_type.get("SA").unwrap(), 1);
        assert_eq!(*stats.templates_by_difficulty.get(&2).unwrap(), 1);
        assert_eq!(*stats.templates_by_difficulty.get(&3).unwrap(), 1);
    }

    #[test]
    fn test_empty_spec_statistics() {
        let spec = crate::domain::Specification {
            units: vec![],
            topics: vec![],
            skills: vec![],
            templates: vec![],
        };
        let stats = SpecStatistics::from_specification(&spec);
        assert_eq!(stats.unit_count, 0);
        assert_eq!(stats.template_count, 0);
        assert_eq!(stats.avg_variables_per_template, 0.0);
    }
}