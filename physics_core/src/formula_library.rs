//! Physics formula library.
//!
//! Provides a curated collection of common physics formulas organized by topic
//! for reference, validation, and question template authoring.

use crate::domain::FormulaEntry;

/// Build and return the standard physics formula library.
pub fn standard_formula_library() -> Vec<FormulaEntry> {
    vec![
        // Kinematics
        FormulaEntry {
            name: "Constant Velocity".to_string(),
            latex: "v = \\frac{\\Delta x}{\\Delta t}".to_string(),
            description: "Velocity equals displacement divided by time".to_string(),
            variables: vec!["v".to_string(), "x".to_string(), "t".to_string()],
            topic_id: Some("kinematics".to_string()),
        },
        FormulaEntry {
            name: "Uniform Acceleration".to_string(),
            latex: "a = \\frac{v - v_0}{t}".to_string(),
            description: "Acceleration equals change in velocity divided by time".to_string(),
            variables: vec!["a".to_string(), "v".to_string(), "v_0".to_string(), "t".to_string()],
            topic_id: Some("kinematics".to_string()),
        },
        FormulaEntry {
            name: "Displacement (Uniform Acceleration)".to_string(),
            latex: "\\Delta x = v_0 t + \\frac{1}{2} a t^2".to_string(),
            description: "Displacement under constant acceleration".to_string(),
            variables: vec!["x".to_string(), "v_0".to_string(), "a".to_string(), "t".to_string()],
            topic_id: Some("kinematics".to_string()),
        },
        FormulaEntry {
            name: "Velocity-Displacement Relation".to_string(),
            latex: "v^2 = v_0^2 + 2 a \\Delta x".to_string(),
            description: "Final velocity squared equals initial velocity squared plus 2aΔx".to_string(),
            variables: vec!["v".to_string(), "v_0".to_string(), "a".to_string(), "x".to_string()],
            topic_id: Some("kinematics".to_string()),
        },
        FormulaEntry {
            name: "Free Fall Distance".to_string(),
            latex: "h = \\frac{1}{2} g t^2".to_string(),
            description: "Distance fallen from rest under gravity".to_string(),
            variables: vec!["h".to_string(), "g".to_string(), "t".to_string()],
            topic_id: Some("kinematics".to_string()),
        },

        // Dynamics
        FormulaEntry {
            name: "Newton's Second Law".to_string(),
            latex: "F = m a".to_string(),
            description: "Net force equals mass times acceleration".to_string(),
            variables: vec!["F".to_string(), "m".to_string(), "a".to_string()],
            topic_id: Some("dynamics".to_string()),
        },
        FormulaEntry {
            name: "Weight".to_string(),
            latex: "W = m g".to_string(),
            description: "Weight equals mass times gravitational acceleration".to_string(),
            variables: vec!["W".to_string(), "m".to_string(), "g".to_string()],
            topic_id: Some("dynamics".to_string()),
        },
        FormulaEntry {
            name: "Friction Force".to_string(),
            latex: "f = \\mu N".to_string(),
            description: "Friction force equals coefficient of friction times normal force".to_string(),
            variables: vec!["f".to_string(), "\\mu".to_string(), "N".to_string()],
            topic_id: Some("dynamics".to_string()),
        },
        FormulaEntry {
            name: "Centripetal Force".to_string(),
            latex: "F_c = \\frac{m v^2}{r}".to_string(),
            description: "Centripetal force for circular motion".to_string(),
            variables: vec!["F_c".to_string(), "m".to_string(), "v".to_string(), "r".to_string()],
            topic_id: Some("dynamics".to_string()),
        },

        // Energy & Work
        FormulaEntry {
            name: "Kinetic Energy".to_string(),
            latex: "E_k = \\frac{1}{2} m v^2".to_string(),
            description: "Kinetic energy of a moving object".to_string(),
            variables: vec!["E_k".to_string(), "m".to_string(), "v".to_string()],
            topic_id: Some("energy".to_string()),
        },
        FormulaEntry {
            name: "Gravitational Potential Energy".to_string(),
            latex: "E_p = m g h".to_string(),
            description: "Potential energy near Earth's surface".to_string(),
            variables: vec!["E_p".to_string(), "m".to_string(), "g".to_string(), "h".to_string()],
            topic_id: Some("energy".to_string()),
        },
        FormulaEntry {
            name: "Work".to_string(),
            latex: "W = F d \\cos\\theta".to_string(),
            description: "Work equals force times displacement times cosine of angle".to_string(),
            variables: vec!["W".to_string(), "F".to_string(), "d".to_string(), "\\theta".to_string()],
            topic_id: Some("energy".to_string()),
        },
        FormulaEntry {
            name: "Power".to_string(),
            latex: "P = \\frac{W}{t} = F v".to_string(),
            description: "Power equals work divided by time, or force times velocity".to_string(),
            variables: vec!["P".to_string(), "W".to_string(), "t".to_string(), "F".to_string(), "v".to_string()],
            topic_id: Some("energy".to_string()),
        },

        // Momentum
        FormulaEntry {
            name: "Momentum".to_string(),
            latex: "p = m v".to_string(),
            description: "Momentum equals mass times velocity".to_string(),
            variables: vec!["p".to_string(), "m".to_string(), "v".to_string()],
            topic_id: Some("momentum".to_string()),
        },
        FormulaEntry {
            name: "Impulse".to_string(),
            latex: "J = F \\Delta t = \\Delta p".to_string(),
            description: "Impulse equals force times time, equals change in momentum".to_string(),
            variables: vec!["J".to_string(), "F".to_string(), "t".to_string(), "p".to_string()],
            topic_id: Some("momentum".to_string()),
        },

        // Waves
        FormulaEntry {
            name: "Wave Speed".to_string(),
            latex: "v = f \\lambda".to_string(),
            description: "Wave speed equals frequency times wavelength".to_string(),
            variables: vec!["v".to_string(), "f".to_string(), "\\lambda".to_string()],
            topic_id: Some("waves".to_string()),
        },
        FormulaEntry {
            name: "Period and Frequency".to_string(),
            latex: "T = \\frac{1}{f}".to_string(),
            description: "Period is the reciprocal of frequency".to_string(),
            variables: vec!["T".to_string(), "f".to_string()],
            topic_id: Some("waves".to_string()),
        },

        // Electricity
        FormulaEntry {
            name: "Ohm's Law".to_string(),
            latex: "V = I R".to_string(),
            description: "Voltage equals current times resistance".to_string(),
            variables: vec!["V".to_string(), "I".to_string(), "R".to_string()],
            topic_id: Some("electricity".to_string()),
        },
        FormulaEntry {
            name: "Electric Power".to_string(),
            latex: "P = V I = I^2 R = \\frac{V^2}{R}".to_string(),
            description: "Electric power in terms of voltage, current, and resistance".to_string(),
            variables: vec!["P".to_string(), "V".to_string(), "I".to_string(), "R".to_string()],
            topic_id: Some("electricity".to_string()),
        },
        FormulaEntry {
            name: "Resistance in Series".to_string(),
            latex: "R_s = R_1 + R_2 + \\dots".to_string(),
            description: "Total resistance for resistors in series".to_string(),
            variables: vec!["R_s".to_string(), "R_1".to_string(), "R_2".to_string()],
            topic_id: Some("electricity".to_string()),
        },
        FormulaEntry {
            name: "Resistance in Parallel".to_string(),
            latex: "\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\dots".to_string(),
            description: "Total resistance for resistors in parallel".to_string(),
            variables: vec!["R_p".to_string(), "R_1".to_string(), "R_2".to_string()],
            topic_id: Some("electricity".to_string()),
        },
    ]
}

/// Search formulas by topic ID.
pub fn formulas_by_topic(topic_id: &str) -> Vec<FormulaEntry> {
    standard_formula_library()
        .into_iter()
        .filter(|f| f.topic_id.as_deref() == Some(topic_id))
        .collect()
}

/// Search formulas by name (case-insensitive substring match).
pub fn search_formulas(query: &str) -> Vec<FormulaEntry> {
    let query_lower = query.to_lowercase();
    standard_formula_library()
        .into_iter()
        .filter(|f| {
            f.name.to_lowercase().contains(&query_lower)
                || f.description.to_lowercase().contains(&query_lower)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_standard_library_not_empty() {
        let formulas = standard_formula_library();
        assert!(!formulas.is_empty());
        assert!(formulas.len() >= 20);
    }

    #[test]
    fn test_formulas_by_kinematics() {
        let formulas = formulas_by_topic("kinematics");
        assert!(!formulas.is_empty());
        assert!(formulas.iter().any(|f| f.name == "Free Fall Distance"));
    }

    #[test]
    fn test_formulas_by_electricity() {
        let formulas = formulas_by_topic("electricity");
        assert!(formulas.iter().any(|f| f.name == "Ohm's Law"));
    }

    #[test]
    fn test_search_formulas_by_name() {
        let results = search_formulas("Newton");
        assert!(!results.is_empty());
        assert!(results.iter().any(|f| f.name.contains("Newton")));
    }

    #[test]
    fn test_search_formulas_by_description() {
        let results = search_formulas("friction");
        assert!(!results.is_empty());
        assert!(results.iter().any(|f| f.name == "Friction Force"));
    }

    #[test]
    fn test_search_no_match() {
        let results = search_formulas("quantum tunneling");
        assert!(results.is_empty());
    }
}