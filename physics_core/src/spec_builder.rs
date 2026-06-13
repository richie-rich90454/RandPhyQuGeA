//! Builder pattern for programmatic construction of specifications.
//!
//! Provides a fluent API for building Specification instances including
//! Units, Topics, Skills, and Templates, useful for tests and for
//! constructing specifications from external data sources.

use crate::domain::*;

/// A builder for constructing Specification instances.
pub struct SpecificationBuilder {
    units: Vec<Unit>,
    topics: Vec<Topic>,
    skills: Vec<Skill>,
    templates: Vec<QuestionTemplate>,
}

impl SpecificationBuilder {
    pub fn new() -> Self {
        SpecificationBuilder {
            units: Vec::new(),
            topics: Vec::new(),
            skills: Vec::new(),
            templates: Vec::new(),
        }
    }

    pub fn add_unit(mut self, id: &str, name: &str, description: &str) -> Self {
        self.units.push(Unit {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
        });
        self
    }

    pub fn add_topic(mut self, id: &str, name: &str, unit_id: &str, description: &str) -> Self {
        self.topics.push(Topic {
            id: id.to_string(),
            name: name.to_string(),
            unit_id: unit_id.to_string(),
            description: description.to_string(),
        });
        self
    }

    pub fn add_skill(mut self, id: &str, name: &str, topic_id: &str, description: &str) -> Self {
        self.skills.push(Skill {
            id: id.to_string(),
            name: name.to_string(),
            topic_id: topic_id.to_string(),
            description: description.to_string(),
        });
        self
    }

    pub fn add_template(mut self, template: QuestionTemplate) -> Self {
        self.templates.push(template);
        self
    }

    pub fn build(self) -> Specification {
        Specification {
            units: self.units,
            topics: self.topics,
            skills: self.skills,
            templates: self.templates,
        }
    }
}

impl Default for SpecificationBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::template_builder::TemplateBuilder;

    #[test]
    fn test_build_minimal_spec() {
        let spec = SpecificationBuilder::new()
            .add_unit("U1", "Mechanics", "Classical mechanics")
            .add_topic("T1", "Kinematics", "U1", "Motion")
            .add_skill("S1", "Uniform Acceleration", "T1", "Constant a")
            .build();

        assert_eq!(spec.units.len(), 1);
        assert_eq!(spec.topics.len(), 1);
        assert_eq!(spec.skills.len(), 1);
        assert!(spec.templates.is_empty());
    }

    #[test]
    fn test_build_with_template() {
        let template = TemplateBuilder::new("Q1", "T1", "S1")
            .text("Test {x}")
            .answer("x")
            .add_variable("x", "int", 1.0, 10.0, None)
            .build();

        let spec = SpecificationBuilder::new()
            .add_unit("U1", "Mechanics", "")
            .add_topic("T1", "Kinematics", "U1", "")
            .add_skill("S1", "UA", "T1", "")
            .add_template(template)
            .build();

        assert_eq!(spec.templates.len(), 1);
        assert_eq!(spec.templates[0].id, "Q1");
    }

    #[test]
    fn test_build_full_spec() {
        let spec = SpecificationBuilder::new()
            .add_unit("U1", "Mechanics", "Classical mechanics")
            .add_unit("U2", "Electromagnetism", "EM")
            .add_topic("T1", "Kinematics", "U1", "Motion")
            .add_topic("T2", "Circuits", "U2", "Electric")
            .add_skill("S1", "UA", "T1", "")
            .add_skill("S2", "Ohm", "T2", "")
            .add_template(
                TemplateBuilder::new("Q1", "T1", "S1")
                    .text("Q1")
                    .answer("1")
                    .add_variable("x", "int", 1.0, 5.0, None)
                    .build(),
            )
            .add_template(
                TemplateBuilder::new("Q2", "T2", "S2")
                    .text("Q2")
                    .answer("2")
                    .add_variable("y", "int", 1.0, 5.0, None)
                    .build(),
            )
            .build();

        assert_eq!(spec.units.len(), 2);
        assert_eq!(spec.topics.len(), 2);
        assert_eq!(spec.skills.len(), 2);
        assert_eq!(spec.templates.len(), 2);
    }
}