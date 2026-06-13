//! Random value generation and text template substitution.
//!
//! Provides seeded and entropy-based random generators for reproducible
//! and non-reproducible question generation, plus variable substitution
//! in question text and solution templates.

use crate::domain::VariableDefinition;
use rand::Rng;
use rand::SeedableRng;
use std::collections::HashMap;

pub trait RandomGenerator: Send + Sync {
    fn next_int(&mut self, min: i32, max: i32) -> i32;
    fn next_double(&mut self, min: f64, max: f64, step: f64) -> f64;
    fn next_from_set(&mut self, values: &[String]) -> String;
}

pub struct UniformRandomGenerator {
    rng: rand::rngs::StdRng,
}

impl UniformRandomGenerator {
    pub fn new() -> Self {
        UniformRandomGenerator {
            rng: rand::rngs::StdRng::from_entropy(),
        }
    }

    pub fn with_seed(seed: u64) -> Self {
        use rand::SeedableRng;
        UniformRandomGenerator {
            rng: rand::rngs::StdRng::seed_from_u64(seed),
        }
    }
}

impl RandomGenerator for UniformRandomGenerator {
    fn next_int(&mut self, min: i32, max: i32) -> i32 {
        if min >= max {
            return min;
        }
        self.rng.gen_range(min..=max)
    }

    fn next_double(&mut self, min: f64, max: f64, step: f64) -> f64 {
        if min >= max {
            return min;
        }
        let steps = ((max - min) / step).floor() as i32;
        if steps <= 0 {
            return min;
        }
        let step_idx = self.rng.gen_range(0..=steps);
        let value = min + step_idx as f64 * step;
        if value > max {
            max
        } else {
            value
        }
    }

    fn next_from_set(&mut self, values: &[String]) -> String {
        if values.is_empty() {
            return String::new();
        }
        let idx = self.rng.gen_range(0..values.len());
        values[idx].clone()
    }
}

pub struct VariableGenerator;

impl VariableGenerator {
    pub fn generate_variables(
        definitions: &[VariableDefinition],
        rng: &mut dyn RandomGenerator,
    ) -> HashMap<String, f64> {
        let mut variables = HashMap::new();
        for def in definitions {
            let value = match def.var_type.as_str() {
                "int" => {
                    let min = def.min.unwrap_or(0.0) as i32;
                    let max = def.max.unwrap_or(100.0) as i32;
                    rng.next_int(min, max) as f64
                }
                "double" => {
                    let min = def.min.unwrap_or(0.0);
                    let max = def.max.unwrap_or(100.0);
                    let step = def.step.unwrap_or(1.0);
                    rng.next_double(min, max, step)
                }
                "enum" => {
                    if let Some(ref enum_values) = def.enum_values {
                        let s = rng.next_from_set(enum_values);
                        s.parse::<f64>().unwrap_or(0.0)
                    } else {
                        0.0
                    }
                }
                _ => 0.0,
            };
            variables.insert(def.name.clone(), value);
        }
        variables
    }

    pub fn substitute_variables(
        template: &str,
        variables: &HashMap<String, f64>,
    ) -> String {
        let re = regex::Regex::new(r"\{(\w+)\}").unwrap();
        re.replace_all(template, |caps: &regex::Captures| {
            let var_name = &caps[1];
            if let Some(value) = variables.get(var_name) {
                format_value(*value)
            } else {
                caps[0].to_string()
            }
        })
        .to_string()
    }
}

fn format_value(value: f64) -> String {
    if value == value.trunc() {
        format!("{}", value as i64)
    } else {
        let s = format!("{:.4}", value);
        let s = s.trim_end_matches('0');
        let s = s.trim_end_matches('.');
        s.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_int_generation() {
        let mut rng = UniformRandomGenerator::with_seed(42);
        for _ in 0..100 {
            let val = rng.next_int(1, 10);
            assert!(val >= 1 && val <= 10);
        }
    }

    #[test]
    fn test_int_min_equals_max() {
        let mut rng = UniformRandomGenerator::with_seed(42);
        let val = rng.next_int(5, 5);
        assert_eq!(val, 5);
    }

    #[test]
    fn test_int_min_greater_than_max() {
        let mut rng = UniformRandomGenerator::with_seed(42);
        let val = rng.next_int(10, 1);
        assert_eq!(val, 10);
    }

    #[test]
    fn test_double_generation() {
        let mut rng = UniformRandomGenerator::with_seed(42);
        for _ in 0..100 {
            let val = rng.next_double(0.0, 10.0, 0.5);
            assert!(val >= 0.0 && val <= 10.0);
        }
    }

    #[test]
    fn test_double_min_equals_max() {
        let mut rng = UniformRandomGenerator::with_seed(42);
        let val = rng.next_double(3.0, 3.0, 0.5);
        assert_eq!(val, 3.0);
    }

    #[test]
    fn test_double_zero_step() {
        let mut rng = UniformRandomGenerator::with_seed(42);
        let val = rng.next_double(0.0, 10.0, 0.0);
        assert_eq!(val, 0.0);
    }

    #[test]
    fn test_enum_generation() {
        let mut rng = UniformRandomGenerator::with_seed(42);
        let values = vec!["A".to_string(), "B".to_string(), "C".to_string()];
        let val = rng.next_from_set(&values);
        assert!(values.contains(&val));
    }

    #[test]
    fn test_enum_empty_set() {
        let mut rng = UniformRandomGenerator::with_seed(42);
        let values: Vec<String> = vec![];
        let val = rng.next_from_set(&values);
        assert_eq!(val, "");
    }

    #[test]
    fn test_seeded_reproducibility() {
        let mut rng1 = UniformRandomGenerator::with_seed(42);
        let mut rng2 = UniformRandomGenerator::with_seed(42);
        for _ in 0..20 {
            assert_eq!(rng1.next_int(0, 100), rng2.next_int(0, 100));
        }
    }

    #[test]
    fn test_substitute_variables() {
        let mut vars = HashMap::new();
        vars.insert("v0".to_string(), 10.0);
        vars.insert("v".to_string(), 30.0);
        vars.insert("t".to_string(), 5.0);

        let result = VariableGenerator::substitute_variables(
            "A car accelerates from {v0} m/s to {v} m/s in {t} s.",
            &vars,
        );
        assert_eq!(result, "A car accelerates from 10 m/s to 30 m/s in 5 s.");
    }

    #[test]
    fn test_substitute_unknown_variable() {
        let vars = HashMap::new();
        let result = VariableGenerator::substitute_variables("Value: {x}", &vars);
        assert_eq!(result, "Value: {x}");
    }

    #[test]
    fn test_substitute_multiple_occurrences() {
        let mut vars = HashMap::new();
        vars.insert("x".to_string(), 5.0);
        let result = VariableGenerator::substitute_variables("{x} plus {x} = 2*{x}", &vars);
        assert_eq!(result, "5 plus 5 = 2*5");
    }

    #[test]
    fn test_format_double_value() {
        let mut vars = HashMap::new();
        vars.insert("x".to_string(), 3.1400);
        let result = VariableGenerator::substitute_variables("{x}", &vars);
        assert_eq!(result, "3.14");
    }

    #[test]
    fn test_generate_int_variables() {
        let defs = vec![
            VariableDefinition {
                name: "x".to_string(),
                var_type: "int".to_string(),
                min: Some(1.0),
                max: Some(10.0),
                step: None,
                enum_values: None,
            },
        ];
        let mut rng = UniformRandomGenerator::with_seed(42);
        let vars = VariableGenerator::generate_variables(&defs, &mut rng);
        let val = vars["x"];
        assert!(val >= 1.0 && val <= 10.0);
        assert_eq!(val, val.trunc());
    }

    #[test]
    fn test_generate_enum_variables() {
        let defs = vec![
            VariableDefinition {
                name: "dir".to_string(),
                var_type: "enum".to_string(),
                min: None,
                max: None,
                step: None,
                enum_values: Some(vec!["1.0".to_string(), "2.0".to_string(), "3.0".to_string()]),
            },
        ];
        let mut rng = UniformRandomGenerator::with_seed(42);
        let vars = VariableGenerator::generate_variables(&defs, &mut rng);
        let val = vars["dir"];
        assert!(val == 1.0 || val == 2.0 || val == 3.0);
    }
}