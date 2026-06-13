//! Expression evaluator with support for mathematical functions.
//!
//! Supports arithmetic, trigonometric (degree-based), logarithmic,
//! and rounding functions. Variables are substituted from a provided
//! HashMap before evaluation.

use std::collections::HashMap;

pub struct ExpressionEvaluator;

impl ExpressionEvaluator {
    pub fn evaluate(
        expression: &str,
        variables: &HashMap<String, f64>,
    ) -> Result<f64, String> {
        let expr = expression.trim();
        if expr.is_empty() {
            return Err("Empty expression".to_string());
        }

        let tokens = Self::tokenize(expr);
        let (result, _) = Self::parse_expression(&tokens, 0, variables)?;
        Ok(result)
    }

    fn tokenize(expr: &str) -> Vec<String> {
        let mut tokens = Vec::new();
        let chars: Vec<char> = expr.chars().collect();
        let mut i = 0;

        while i < chars.len() {
            let c = chars[i];

            if c.is_whitespace() {
                i += 1;
                continue;
            }

            if c == '+' || c == '-' || c == '*' || c == '/' || c == '(' || c == ')' || c == ',' {
                tokens.push(c.to_string());
                i += 1;
                continue;
            }

            if c.is_ascii_digit() || c == '.' {
                let mut num = String::new();
                while i < chars.len() && (chars[i].is_ascii_digit() || chars[i] == '.') {
                    num.push(chars[i]);
                    i += 1;
                }
                tokens.push(num);
                continue;
            }

            if c.is_alphabetic() || c == '_' {
                let mut ident = String::new();
                while i < chars.len() && (chars[i].is_alphanumeric() || chars[i] == '_') {
                    ident.push(chars[i]);
                    i += 1;
                }
                tokens.push(ident);
                continue;
            }

            i += 1;
        }

        tokens
    }

    fn parse_expression(
        tokens: &[String],
        pos: usize,
        variables: &HashMap<String, f64>,
    ) -> Result<(f64, usize), String> {
        let (mut left, mut pos) = Self::parse_term(tokens, pos, variables)?;

        while pos < tokens.len() {
            match tokens[pos].as_str() {
                "+" => {
                    let (right, new_pos) = Self::parse_term(tokens, pos + 1, variables)?;
                    left += right;
                    pos = new_pos;
                }
                "-" => {
                    let (right, new_pos) = Self::parse_term(tokens, pos + 1, variables)?;
                    left -= right;
                    pos = new_pos;
                }
                _ => break,
            }
        }

        Ok((left, pos))
    }

    fn parse_term(
        tokens: &[String],
        pos: usize,
        variables: &HashMap<String, f64>,
    ) -> Result<(f64, usize), String> {
        let (mut left, mut pos) = Self::parse_factor(tokens, pos, variables)?;

        while pos < tokens.len() {
            match tokens[pos].as_str() {
                "*" => {
                    let (right, new_pos) = Self::parse_factor(tokens, pos + 1, variables)?;
                    left *= right;
                    pos = new_pos;
                }
                "/" => {
                    let (right, new_pos) = Self::parse_factor(tokens, pos + 1, variables)?;
                    if right == 0.0 {
                        return Err("Division by zero".to_string());
                    }
                    left /= right;
                    pos = new_pos;
                }
                _ => break,
            }
        }

        Ok((left, pos))
    }

    fn parse_factor(
        tokens: &[String],
        pos: usize,
        variables: &HashMap<String, f64>,
    ) -> Result<(f64, usize), String> {
        if pos >= tokens.len() {
            return Err("Unexpected end of expression".to_string());
        }

        let token = &tokens[pos];

        // Unary minus
        if token == "-" {
            let (value, new_pos) = Self::parse_factor(tokens, pos + 1, variables)?;
            return Ok((-value, new_pos));
        }

        // Parenthesized expression
        if token == "(" {
            let (value, new_pos) = Self::parse_expression(tokens, pos + 1, variables)?;
            if new_pos < tokens.len() && tokens[new_pos] == ")" {
                return Ok((value, new_pos + 1));
            }
            return Err("Missing closing parenthesis".to_string());
        }

        // Number
        if let Ok(num) = token.parse::<f64>() {
            return Ok((num, pos + 1));
        }

        // Function call or variable
        if pos + 1 < tokens.len() && tokens[pos + 1] == "(" {
            let func_name = token.as_str();
            let (arg, new_pos) = Self::parse_expression(tokens, pos + 2, variables)?;

            // Check for second argument (comma)
            let (arg2, new_pos) = if new_pos < tokens.len() && tokens[new_pos] == "," {
                let (a2, np) = Self::parse_expression(tokens, new_pos + 1, variables)?;
                (Some(a2), np)
            } else {
                (None, new_pos)
            };

            if new_pos < tokens.len() && tokens[new_pos] == ")" {
                let result = Self::eval_function(func_name, arg, arg2)?;
                return Ok((result, new_pos + 1));
            }
            return Err("Missing closing parenthesis after function".to_string());
        }

        // Variable
        if let Some(&value) = variables.get(token) {
            return Ok((value, pos + 1));
        }

        // Constant
        if let Some(value) = Self::get_constant(token) {
            return Ok((value, pos + 1));
        }

        Err(format!("Unknown token: {}", token))
    }

    fn get_constant(name: &str) -> Option<f64> {
        match name.to_lowercase().as_str() {
            "pi" => Some(std::f64::consts::PI),
            "e" => Some(std::f64::consts::E),
            _ => None,
        }
    }

    /// Compare two numeric answers with a relative tolerance.
    /// Returns true if the answers are within the specified relative tolerance
    /// or if the absolute difference is within an epsilon for small values.
    pub fn compare_answers(user_answer: &str, correct_answer: &str, tolerance: f64) -> bool {
        let user = match user_answer.trim().parse::<f64>() {
            Ok(v) => v,
            Err(_) => return false,
        };
        let correct = match correct_answer.trim().parse::<f64>() {
            Ok(v) => v,
            Err(_) => return false,
        };

        if correct == 0.0 {
            return user.abs() < 1e-9;
        }

        let relative_error = (user - correct).abs() / correct.abs();
        relative_error < tolerance
    }

    fn eval_function(name: &str, arg1: f64, arg2: Option<f64>) -> Result<f64, String> {
        match name.to_lowercase().as_str() {
            "sin" => Ok((arg1 * std::f64::consts::PI / 180.0).sin()),
            "cos" => Ok((arg1 * std::f64::consts::PI / 180.0).cos()),
            "tan" => Ok((arg1 * std::f64::consts::PI / 180.0).tan()),
            "asin" => Ok(arg1.asin() * 180.0 / std::f64::consts::PI),
            "acos" => Ok(arg1.acos() * 180.0 / std::f64::consts::PI),
            "atan" => Ok(arg1.atan() * 180.0 / std::f64::consts::PI),
            "sqrt" => {
                if arg1 < 0.0 {
                    return Err("sqrt of negative number".to_string());
                }
                Ok(arg1.sqrt())
            }
            "pow" => {
                if let Some(exp) = arg2 {
                    Ok(arg1.powf(exp))
                } else {
                    Err("pow requires 2 arguments".to_string())
                }
            }
            "abs" => Ok(arg1.abs()),
            "exp" => Ok(arg1.exp()),
            "floor" => Ok(arg1.floor()),
            "ceiling" => Ok(arg1.ceil()),
            "truncate" => Ok(arg1.trunc()),
            "ln" => {
                if arg1 <= 0.0 {
                    return Err("ln of non-positive number".to_string());
                }
                Ok(arg1.ln())
            }
            "log" | "log10" => {
                if arg1 <= 0.0 {
                    return Err("log of non-positive number".to_string());
                }
                Ok(arg1.log10())
            }
            "round" => {
                if let Some(decimals) = arg2 {
                    let factor = 10_f64.powi(decimals as i32);
                    Ok((arg1 * factor).round() / factor)
                } else {
                    Ok(arg1.round())
                }
            }
            "sign" => Ok(if arg1 > 0.0 {
                1.0
            } else if arg1 < 0.0 {
                -1.0
            } else {
                0.0
            }),
            "max" => {
                if let Some(a2) = arg2 {
                    Ok(arg1.max(a2))
                } else {
                    Err("max requires 2 arguments".to_string())
                }
            }
            "min" => {
                if let Some(a2) = arg2 {
                    Ok(arg1.min(a2))
                } else {
                    Err("min requires 2 arguments".to_string())
                }
            }
            "log2" => {
                if arg1 <= 0.0 {
                    return Err("log2 of non-positive number".to_string());
                }
                Ok(arg1.log2())
            }
            "cbrt" => Ok(arg1.cbrt()),
            "hypot" => {
                if let Some(a2) = arg2 {
                    Ok(arg1.hypot(a2))
                } else {
                    Err("hypot requires 2 arguments".to_string())
                }
            }
            "deg" => Ok(arg1 * 180.0 / std::f64::consts::PI),
            "rad" => Ok(arg1 * std::f64::consts::PI / 180.0),
            _ => Err(format!("Unknown function: {}", name)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_arithmetic() {
        let vars = HashMap::new();
        assert_eq!(ExpressionEvaluator::evaluate("2 + 3", &vars).unwrap(), 5.0);
        assert_eq!(ExpressionEvaluator::evaluate("10 - 4", &vars).unwrap(), 6.0);
        assert_eq!(ExpressionEvaluator::evaluate("3 * 4", &vars).unwrap(), 12.0);
        assert_eq!(ExpressionEvaluator::evaluate("10 / 2", &vars).unwrap(), 5.0);
    }

    #[test]
    fn test_with_variables() {
        let mut vars = HashMap::new();
        vars.insert("v".to_string(), 30.0);
        vars.insert("v0".to_string(), 10.0);
        vars.insert("t".to_string(), 5.0);
        assert_eq!(
            ExpressionEvaluator::evaluate("(v - v0) / t", &vars).unwrap(),
            4.0
        );
    }

    #[test]
    fn test_trig_degrees() {
        let vars = HashMap::new();
        let result = ExpressionEvaluator::evaluate("sin(90)", &vars).unwrap();
        assert!((result - 1.0).abs() < 1e-10);

        let result = ExpressionEvaluator::evaluate("cos(0)", &vars).unwrap();
        assert!((result - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_sqrt() {
        let vars = HashMap::new();
        assert_eq!(ExpressionEvaluator::evaluate("sqrt(16)", &vars).unwrap(), 4.0);
    }

    #[test]
    fn test_complex_expression() {
        let mut vars = HashMap::new();
        vars.insert("h".to_string(), 20.0);
        let result = ExpressionEvaluator::evaluate("sqrt(2 * 9.81 * h)", &vars).unwrap();
        let expected = (2.0 * 9.81 * 20.0_f64).sqrt();
        assert!((result - expected).abs() < 1e-10);
    }

    #[test]
    fn test_constants() {
        let vars = HashMap::new();
        let result = ExpressionEvaluator::evaluate("pi", &vars).unwrap();
        assert!((result - std::f64::consts::PI).abs() < 1e-10);
    }

    #[test]
    fn test_empty_expression() {
        let vars = HashMap::new();
        assert!(ExpressionEvaluator::evaluate("", &vars).is_err());
        assert!(ExpressionEvaluator::evaluate("   ", &vars).is_err());
    }

    #[test]
    fn test_division_by_zero() {
        let vars = HashMap::new();
        assert!(ExpressionEvaluator::evaluate("5 / 0", &vars).is_err());
    }

    #[test]
    fn test_unary_minus() {
        let vars = HashMap::new();
        assert_eq!(ExpressionEvaluator::evaluate("-5", &vars).unwrap(), -5.0);
        assert_eq!(ExpressionEvaluator::evaluate("--5", &vars).unwrap(), 5.0);
        assert_eq!(ExpressionEvaluator::evaluate("-3 + 7", &vars).unwrap(), 4.0);
    }

    #[test]
    fn test_operator_precedence() {
        let vars = HashMap::new();
        assert_eq!(
            ExpressionEvaluator::evaluate("2 + 3 * 4", &vars).unwrap(),
            14.0
        );
        assert_eq!(
            ExpressionEvaluator::evaluate("10 - 2 * 3", &vars).unwrap(),
            4.0
        );
        assert_eq!(
            ExpressionEvaluator::evaluate("(2 + 3) * 4", &vars).unwrap(),
            20.0
        );
    }

    #[test]
    fn test_nested_parentheses() {
        let vars = HashMap::new();
        assert_eq!(
            ExpressionEvaluator::evaluate("((2 + 3))", &vars).unwrap(),
            5.0
        );
        assert_eq!(
            ExpressionEvaluator::evaluate("(2 * (3 + 4))", &vars).unwrap(),
            14.0
        );
    }

    #[test]
    fn test_floor_ceiling() {
        let vars = HashMap::new();
        assert_eq!(
            ExpressionEvaluator::evaluate("floor(3.7)", &vars).unwrap(),
            3.0
        );
        assert_eq!(
            ExpressionEvaluator::evaluate("ceiling(3.1)", &vars).unwrap(),
            4.0
        );
        assert_eq!(
            ExpressionEvaluator::evaluate("truncate(-3.7)", &vars).unwrap(),
            -3.0
        );
    }

    #[test]
    fn test_pow_function() {
        let vars = HashMap::new();
        assert_eq!(
            ExpressionEvaluator::evaluate("pow(2, 3)", &vars).unwrap(),
            8.0
        );
        assert_eq!(
            ExpressionEvaluator::evaluate("pow(5, 0)", &vars).unwrap(),
            1.0
        );
    }

    #[test]
    fn test_log_functions() {
        let vars = HashMap::new();
        let result = ExpressionEvaluator::evaluate("ln(e)", &vars).unwrap();
        assert!((result - 1.0).abs() < 1e-10);
        assert_eq!(
            ExpressionEvaluator::evaluate("log(1000)", &vars).unwrap(),
            3.0
        );
        assert!(ExpressionEvaluator::evaluate("ln(-1)", &vars).is_err());
        assert!(ExpressionEvaluator::evaluate("log(0)", &vars).is_err());
    }

    #[test]
    fn test_min_max() {
        let vars = HashMap::new();
        assert_eq!(
            ExpressionEvaluator::evaluate("min(3, 7)", &vars).unwrap(),
            3.0
        );
        assert_eq!(
            ExpressionEvaluator::evaluate("max(3, 7)", &vars).unwrap(),
            7.0
        );
    }

    #[test]
    fn test_round_function() {
        let vars = HashMap::new();
        assert_eq!(
            ExpressionEvaluator::evaluate("round(3.14159)", &vars).unwrap(),
            3.0
        );
        let result =
            ExpressionEvaluator::evaluate("round(3.14159, 2)", &vars).unwrap();
        assert!((result - 3.14).abs() < 1e-10);
    }

    #[test]
    fn test_sign_function() {
        let vars = HashMap::new();
        assert_eq!(ExpressionEvaluator::evaluate("sign(5)", &vars).unwrap(), 1.0);
        assert_eq!(
            ExpressionEvaluator::evaluate("sign(-3)", &vars).unwrap(),
            -1.0
        );
        assert_eq!(ExpressionEvaluator::evaluate("sign(0)", &vars).unwrap(), 0.0);
    }

    #[test]
    fn test_unknown_token() {
        let vars = HashMap::new();
        assert!(ExpressionEvaluator::evaluate("foo", &vars).is_err());
    }

    #[test]
    fn test_sqrt_negative() {
        let vars = HashMap::new();
        assert!(ExpressionEvaluator::evaluate("sqrt(-4)", &vars).is_err());
    }

    #[test]
    fn test_large_numbers() {
        let vars = HashMap::new();
        let result =
            ExpressionEvaluator::evaluate("1000000 * 1000000", &vars).unwrap();
        assert_eq!(result, 1_000_000_000_000.0);
    }

    #[test]
    fn test_negative_variable() {
        let mut vars = HashMap::new();
        vars.insert("x".to_string(), -10.0);
        assert_eq!(
            ExpressionEvaluator::evaluate("x * 2", &vars).unwrap(),
            -20.0
        );
        assert_eq!(
            ExpressionEvaluator::evaluate("abs(x)", &vars).unwrap(),
            10.0
        );
    }

    #[test]
    fn test_compare_answers_exact_match() {
        assert!(ExpressionEvaluator::compare_answers("5.0", "5.0", 0.001));
        assert!(ExpressionEvaluator::compare_answers("3.14", "3.14", 0.001));
    }

    #[test]
    fn test_compare_answers_within_tolerance() {
        assert!(ExpressionEvaluator::compare_answers("3.1415", "3.1416", 0.001));
        assert!(ExpressionEvaluator::compare_answers("9.81", "9.82", 0.01));
    }

    #[test]
    fn test_compare_answers_outside_tolerance() {
        assert!(!ExpressionEvaluator::compare_answers("5.0", "6.0", 0.001));
        assert!(!ExpressionEvaluator::compare_answers("100.0", "101.0", 0.001));
    }

    #[test]
    fn test_compare_answers_zero() {
        assert!(ExpressionEvaluator::compare_answers("0.0", "0.0", 0.001));
        assert!(ExpressionEvaluator::compare_answers("0.0000000001", "0.0", 0.001));
        assert!(!ExpressionEvaluator::compare_answers("1.0", "0.0", 0.001));
    }

    #[test]
    fn test_compare_answers_non_numeric() {
        assert!(!ExpressionEvaluator::compare_answers("abc", "5.0", 0.001));
        assert!(!ExpressionEvaluator::compare_answers("5.0", "abc", 0.001));
    }

    #[test]
    fn test_log2() {
        let vars = HashMap::new();
        assert_eq!(
            ExpressionEvaluator::evaluate("log2(8)", &vars).unwrap(),
            3.0
        );
        assert!(ExpressionEvaluator::evaluate("log2(0)", &vars).is_err());
    }

    #[test]
    fn test_cbrt() {
        let vars = HashMap::new();
        let result = ExpressionEvaluator::evaluate("cbrt(27)", &vars).unwrap();
        assert!((result - 3.0).abs() < 1e-10);
        let result = ExpressionEvaluator::evaluate("cbrt(-8)", &vars).unwrap();
        assert!((result - (-2.0)).abs() < 1e-10);
    }

    #[test]
    fn test_hypot() {
        let vars = HashMap::new();
        let result = ExpressionEvaluator::evaluate("hypot(3, 4)", &vars).unwrap();
        assert!((result - 5.0).abs() < 1e-10);
    }

    #[test]
    fn test_deg_rad() {
        let vars = HashMap::new();
        let result = ExpressionEvaluator::evaluate("deg(pi)", &vars).unwrap();
        assert!((result - 180.0).abs() < 1e-10);
        let result = ExpressionEvaluator::evaluate("rad(180)", &vars).unwrap();
        assert!((result - std::f64::consts::PI).abs() < 1e-10);
    }
}