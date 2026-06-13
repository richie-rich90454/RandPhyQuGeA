use crate::domain::*;
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq)]
pub struct ParseError {
    pub line: usize,
    pub message: String,
}

#[derive(Debug)]
pub struct ParseException {
    pub errors: Vec<ParseError>,
}

impl std::fmt::Display for ParseException {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Parse errors: {:?}", self.errors)
    }
}

impl std::error::Error for ParseException {}

pub struct SpecificationParser;

impl SpecificationParser {
    pub fn parse(input: &str) -> Result<Specification, ParseException> {
        let lines: Vec<&str> = input.lines().collect();
        let mut errors: Vec<ParseError> = Vec::new();
        let mut units: Vec<Unit> = Vec::new();
        let mut topics: Vec<Topic> = Vec::new();
        let mut skills: Vec<Skill> = Vec::new();
        let mut templates: Vec<QuestionTemplate> = Vec::new();

        let mut current_section: Option<String> = None;
        let mut current_block: HashMap<String, Vec<String>> = HashMap::new();

        for (i, raw_line) in lines.iter().enumerate() {
            let line = raw_line.trim();
            let line_number = i + 1;

            if line.is_empty() || line.starts_with("//") {
                continue;
            }

            if line.starts_with('[') && line.ends_with(']') {
                let section_name = &line[1..line.len() - 1];
                if section_name.is_empty() {
                    errors.push(ParseError {
                        line: line_number,
                        message: "Empty section header [].".to_string(),
                    });
                    continue;
                }

                if let Some(ref section) = current_section {
                    if !current_block.is_empty() {
                        Self::process_block(
                            section,
                            &current_block,
                            line_number,
                            &mut units,
                            &mut topics,
                            &mut skills,
                            &mut templates,
                            &mut errors,
                        );
                    }
                }

                current_section = Some(section_name.to_uppercase());
                current_block = HashMap::new();
                continue;
            }

            if current_section.is_none() {
                errors.push(ParseError {
                    line: line_number,
                    message: "Content found before any section header.".to_string(),
                });
                continue;
            }

            if let Some(colon_idx) = line.find(':') {
                let key = line[..colon_idx].trim().to_string();
                let value = line[colon_idx + 1..].trim().to_string();
                current_block.entry(key).or_default().push(value);
            } else {
                errors.push(ParseError {
                    line: line_number,
                    message: "Expected key:value pair.".to_string(),
                });
            }
        }

        if let Some(ref section) = current_section {
            if !current_block.is_empty() {
                Self::process_block(
                    section,
                    &current_block,
                    lines.len(),
                    &mut units,
                    &mut topics,
                    &mut skills,
                    &mut templates,
                    &mut errors,
                );
            }
        }

        Self::validate_cross_references(&units, &topics, &skills, &templates, &mut errors);

        if !errors.is_empty() {
            return Err(ParseException { errors });
        }

        Ok(Specification {
            units,
            topics,
            skills,
            templates,
        })
    }

    fn process_block(
        section: &str,
        block: &HashMap<String, Vec<String>>,
        line_number: usize,
        units: &mut Vec<Unit>,
        topics: &mut Vec<Topic>,
        skills: &mut Vec<Skill>,
        templates: &mut Vec<QuestionTemplate>,
        errors: &mut Vec<ParseError>,
    ) {
        match section {
            "UNIT" => {
                if let Some(unit) = Self::parse_unit(block) {
                    units.push(unit);
                }
            }
            "TOPIC" => {
                if let Some(topic) = Self::parse_topic(block) {
                    topics.push(topic);
                }
            }
            "SKILL" => {
                if let Some(skill) = Self::parse_skill(block) {
                    skills.push(skill);
                }
            }
            "TEMPLATE" => {
                if let Some(template) = Self::parse_template(block, errors) {
                    templates.push(template);
                }
            }
            _ => {
                errors.push(ParseError {
                    line: line_number,
                    message: format!("Unknown section [{}].", section),
                });
            }
        }
    }

    fn get_single<'a>(block: &'a HashMap<String, Vec<String>>, key: &str) -> Option<&'a str> {
        let key_lower = key.to_lowercase();
        for (k, v) in block.iter() {
            if k.to_lowercase() == key_lower {
                return v.first().map(|s| s.as_str());
            }
        }
        None
    }

    fn get_multiple(block: &HashMap<String, Vec<String>>, key: &str) -> Vec<String> {
        let key_lower = key.to_lowercase();
        for (k, v) in block.iter() {
            if k.to_lowercase() == key_lower {
                return v.clone();
            }
        }
        Vec::new()
    }

    fn parse_unit(block: &HashMap<String, Vec<String>>) -> Option<Unit> {
        let id = Self::get_single(block, "Id")?;
        let name = Self::get_single(block, "Name")?;
        let description = Self::get_single(block, "Description").unwrap_or("");
        Some(Unit {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
        })
    }

    fn parse_topic(block: &HashMap<String, Vec<String>>) -> Option<Topic> {
        let id = Self::get_single(block, "Id")?;
        let name = Self::get_single(block, "Name")?;
        let unit_id = Self::get_single(block, "UnitId")?;
        let description = Self::get_single(block, "Description").unwrap_or("");
        Some(Topic {
            id: id.to_string(),
            name: name.to_string(),
            unit_id: unit_id.to_string(),
            description: description.to_string(),
        })
    }

    fn parse_skill(block: &HashMap<String, Vec<String>>) -> Option<Skill> {
        let id = Self::get_single(block, "Id")?;
        let name = Self::get_single(block, "Name")?;
        let topic_id = Self::get_single(block, "TopicId")?;
        let description = Self::get_single(block, "Description").unwrap_or("");
        Some(Skill {
            id: id.to_string(),
            name: name.to_string(),
            topic_id: topic_id.to_string(),
            description: description.to_string(),
        })
    }

    fn parse_template(
        block: &HashMap<String, Vec<String>>,
        errors: &mut Vec<ParseError>,
    ) -> Option<QuestionTemplate> {
        let id = Self::get_single(block, "Id")?.to_string();
        let topic_id = Self::get_single(block, "TopicId")?.to_string();
        let skill_id = Self::get_single(block, "SkillId")?.to_string();
        let question_type_raw = Self::get_single(block, "QuestionType")?.trim();
        let question_type = match question_type_raw {
            "MultipleChoice" => "MC".to_string(),
            "ShortAnswer" => "SA".to_string(),
            x => x.to_string(),
        };
        let difficulty_str = Self::get_single(block, "Difficulty")?;
        let difficulty: i32 = difficulty_str.parse().ok()?;
        let text_template = Self::get_single(block, "TextTemplate")?.to_string();
        let answer_expression = Self::get_single(block, "AnswerExpression")?.to_string();
        let solution_template = Self::get_single(block, "SolutionTemplate")
            .unwrap_or("")
            .to_string();

        let variable_definitions = Self::parse_variable_definitions(block, errors);
        let distractor_expressions = Self::get_multiple(block, "Distractor");

        Some(QuestionTemplate {
            id,
            topic_id,
            skill_id,
            question_type,
            difficulty,
            text_template,
            answer_expression,
            solution_template,
            variable_definitions,
            distractor_expressions,
        })
    }

    fn parse_variable_definitions(
        block: &HashMap<String, Vec<String>>,
        errors: &mut Vec<ParseError>,
    ) -> Vec<VariableDefinition> {
        let mut result = Vec::new();
        let var_keys: Vec<String> = block
            .keys()
            .filter(|k| k.to_lowercase().starts_with("var."))
            .cloned()
            .collect();

        for key in var_keys {
            let name = key[4..].to_string();
            if let Some(values) = block.get(&key) {
                for value in values {
                    if let Some(vd) = Self::parse_single_variable(&name, value, errors) {
                        result.push(vd);
                    }
                }
            }
        }

        result
    }

    fn parse_single_variable(
        name: &str,
        value: &str,
        errors: &mut Vec<ParseError>,
    ) -> Option<VariableDefinition> {
        let mut dict: HashMap<String, String> = HashMap::new();
        for segment in value.split(';') {
            let trimmed = segment.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Some(eq) = trimmed.find('=') {
                let k = trimmed[..eq].trim().to_string();
                let v = trimmed[eq + 1..].trim().to_string();
                dict.insert(k, v);
            }
        }

        let var_type = match dict.get("Type") {
            Some(t) => t.clone(),
            None => {
                errors.push(ParseError {
                    line: 0,
                    message: format!("Variable '{}' is missing required 'Type' key.", name),
                });
                return None;
            }
        };

        let min = dict
            .get("Min")
            .and_then(|s| s.parse::<f64>().ok());
        let max = dict
            .get("Max")
            .and_then(|s| s.parse::<f64>().ok());
        let step = dict
            .get("Step")
            .and_then(|s| s.parse::<f64>().ok());

        let enum_values = dict.get("Values").map(|s| {
            s.split(',')
                .map(|v| v.trim().to_string())
                .filter(|v| !v.is_empty())
                .collect()
        });

        Some(VariableDefinition {
            name: name.to_string(),
            var_type,
            min,
            max,
            step,
            enum_values,
        })
    }

    fn validate_cross_references(
        units: &[Unit],
        topics: &[Topic],
        skills: &[Skill],
        templates: &[QuestionTemplate],
        errors: &mut Vec<ParseError>,
    ) {
        let unit_ids: std::collections::HashSet<&str> =
            units.iter().map(|u| u.id.as_str()).collect();
        let topic_ids: std::collections::HashSet<&str> =
            topics.iter().map(|t| t.id.as_str()).collect();
        let skill_ids: std::collections::HashSet<&str> =
            skills.iter().map(|s| s.id.as_str()).collect();

        for topic in topics {
            if !unit_ids.contains(topic.unit_id.as_str()) {
                errors.push(ParseError {
                    line: 0,
                    message: format!(
                        "Topic '{}' references unknown Unit '{}'.",
                        topic.id, topic.unit_id
                    ),
                });
            }
        }

        for skill in skills {
            if !topic_ids.contains(skill.topic_id.as_str()) {
                errors.push(ParseError {
                    line: 0,
                    message: format!(
                        "Skill '{}' references unknown Topic '{}'.",
                        skill.id, skill.topic_id
                    ),
                });
            }
        }

        for template in templates {
            if !topic_ids.contains(template.topic_id.as_str()) {
                errors.push(ParseError {
                    line: 0,
                    message: format!(
                        "Template '{}' references unknown Topic '{}'.",
                        template.id, template.topic_id
                    ),
                });
            }
            if !skill_ids.contains(template.skill_id.as_str()) {
                errors.push(ParseError {
                    line: 0,
                    message: format!(
                        "Template '{}' references unknown Skill '{}'.",
                        template.id, template.skill_id
                    ),
                });
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_specification() {
        let input = r#"
[UNIT]
Id: U1
Name: Mechanics
Description: Classical mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1
Description: Motion in one dimension

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1
Description: Solve problems with constant acceleration

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 2
TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s. What is the acceleration?
AnswerExpression: (v - v0) / t
SolutionTemplate: Use a = (v - v0) / t.
Var.v0: Type=double;Min=0;Max=20;Step=1
Var.v: Type=double;Min=20;Max=40;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
Distractor: (v + v0) / t
Distractor: v / t
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        assert_eq!(spec.units.len(), 1);
        assert_eq!(spec.topics.len(), 1);
        assert_eq!(spec.skills.len(), 1);
        assert_eq!(spec.templates.len(), 1);

        let template = &spec.templates[0];
        assert_eq!(template.id, "Q1");
        assert_eq!(template.question_type, "MC");
        assert_eq!(template.difficulty, 2);
        assert_eq!(template.variable_definitions.len(), 3);
        assert_eq!(template.distractor_expressions.len(), 2);
    }

    #[test]
    fn test_parse_short_answer() {
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
TextTemplate: A ball falls for {t} seconds.
AnswerExpression: 0.5 * 9.81 * t * t
SolutionTemplate: Use s = (1/2)gt^2
Var.t: Type=double;Min=1;Max=5;Step=0.5
"#;

        let spec = SpecificationParser::parse(input).unwrap();
        let template = &spec.templates[0];
        assert_eq!(template.question_type, "SA");
        assert_eq!(template.variable_definitions.len(), 1);
        assert_eq!(template.distractor_expressions.len(), 0);
    }

    #[test]
    fn test_cross_ref_validation() {
        let input = r#"
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U99

[SKILL]
Id: S1
Name: Skill
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Test
AnswerExpression: 1
Var.x: Type=double;Min=1;Max=5
"#;

        let result = SpecificationParser::parse(input);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.errors.iter().any(|e| e.message.contains("unknown Unit")));
    }
}