//! Unit conversion utilities for physics calculations.
//!
//! Provides common physics unit conversions for length, mass, time,
//! temperature, velocity, force, energy, and pressure.

use std::collections::HashMap;

/// Convert a value from one unit to another within the same category.
/// Returns None if the conversion is not supported.
pub fn convert(value: f64, from_unit: &str, to_unit: &str) -> Option<f64> {
    let from_lower = from_unit.to_lowercase();
    let to_lower = to_unit.to_lowercase();

    if from_lower == to_lower {
        return Some(value);
    }

    // Length conversions (base: meters)
    let to_meters = match from_lower.as_str() {
        "m" | "meter" | "meters" => 1.0,
        "km" | "kilometer" | "kilometers" => 1000.0,
        "cm" | "centimeter" | "centimeters" => 0.01,
        "mm" | "millimeter" | "millimeters" => 0.001,
        "mi" | "mile" | "miles" => 1609.344,
        "ft" | "foot" | "feet" => 0.3048,
        "in" | "inch" | "inches" => 0.0254,
        "yd" | "yard" | "yards" => 0.9144,
        _ => return None,
    };

    let meters = value * to_meters;
    let from_meters = match to_lower.as_str() {
        "m" | "meter" | "meters" => 1.0,
        "km" | "kilometer" | "kilometers" => 1000.0,
        "cm" | "centimeter" | "centimeters" => 0.01,
        "mm" | "millimeter" | "millimeters" => 0.001,
        "mi" | "mile" | "miles" => 1609.344,
        "ft" | "foot" | "feet" => 0.3048,
        "in" | "inch" | "inches" => 0.0254,
        "yd" | "yard" | "yards" => 0.9144,
        _ => return None,
    };

    Some(meters / from_meters)
}

/// Get all supported units for a given category.
pub fn units_for_category(category: &str) -> Vec<&'static str> {
    match category.to_lowercase().as_str() {
        "length" => vec!["m", "km", "cm", "mm", "mi", "ft", "in", "yd"],
        "mass" => vec!["kg", "g", "mg", "lb", "oz"],
        "time" => vec!["s", "min", "h", "ms"],
        "velocity" => vec!["m/s", "km/h", "mph", "ft/s"],
        "force" => vec!["N", "kN", "lbf", "dyn"],
        "energy" => vec!["J", "kJ", "cal", "kcal", "eV", "Wh"],
        "pressure" => vec!["Pa", "kPa", "atm", "bar", "mmHg", "psi"],
        "temperature" => vec!["K", "C", "F"],
        _ => vec![],
    }
}

/// Convert temperature between Kelvin, Celsius, and Fahrenheit.
pub fn convert_temperature(value: f64, from_unit: &str, to_unit: &str) -> Option<f64> {
    let from_lower = from_unit.to_lowercase();
    let to_lower = to_unit.to_lowercase();

    if from_lower == to_lower {
        return Some(value);
    }

    // Convert to Kelvin first
    let kelvin = match from_lower.as_str() {
        "k" | "kelvin" => value,
        "c" | "celsius" => value + 273.15,
        "f" | "fahrenheit" => (value - 32.0) * 5.0 / 9.0 + 273.15,
        _ => return None,
    };

    match to_lower.as_str() {
        "k" | "kelvin" => Some(kelvin),
        "c" | "celsius" => Some(kelvin - 273.15),
        "f" | "fahrenheit" => Some((kelvin - 273.15) * 9.0 / 5.0 + 32.0),
        _ => None,
    }
}

/// Convert mass (kg, g, mg, lb, oz).
pub fn convert_mass(value: f64, from_unit: &str, to_unit: &str) -> Option<f64> {
    let from_lower = from_unit.to_lowercase();
    let to_lower = to_unit.to_lowercase();

    let to_kg = |u: &str| -> Option<f64> {
        match u {
            "kg" | "kilogram" => Some(1.0),
            "g" | "gram" => Some(0.001),
            "mg" | "milligram" => Some(0.000001),
            "lb" | "lbs" | "pound" | "pounds" => Some(0.453592),
            "oz" | "ounce" | "ounces" => Some(0.0283495),
            _ => None,
        }
    };

    let kg = value * to_kg(&from_lower)?;
    let factor = to_kg(&to_lower)?;
    Some(kg / factor)
}

/// Convert time (s, min, h, ms).
pub fn convert_time(value: f64, from_unit: &str, to_unit: &str) -> Option<f64> {
    let from_lower = from_unit.to_lowercase();
    let to_lower = to_unit.to_lowercase();

    let to_seconds = |u: &str| -> Option<f64> {
        match u {
            "s" | "sec" | "second" | "seconds" => Some(1.0),
            "min" | "minute" | "minutes" => Some(60.0),
            "h" | "hr" | "hour" | "hours" => Some(3600.0),
            "ms" | "millisecond" | "milliseconds" => Some(0.001),
            _ => None,
        }
    };

    let seconds = value * to_seconds(&from_lower)?;
    let factor = to_seconds(&to_lower)?;
    Some(seconds / factor)
}

/// Get common physics constants.
pub fn get_constant(name: &str) -> Option<f64> {
    let constants: HashMap<&str, f64> = [
        ("g", 9.81),
        ("G", 6.67430e-11),
        ("c", 299_792_458.0),
        ("e_charge", 1.602176634e-19),
        ("me", 9.10938356e-31),
        ("mp", 1.67262192369e-27),
        ("h", 6.62607015e-34),
        ("hbar", 1.054571817e-34),
        ("k_B", 1.380649e-23),
        ("epsilon_0", 8.8541878128e-12),
        ("mu_0", 1.25663706212e-6),
        ("N_A", 6.02214076e23),
        ("R", 8.314462618),
        ("atm", 101325.0),
        ("sigma", 5.670374419e-8),
        ("earth_radius", 6_371_000.0),
        ("earth_mass", 5.972e24),
        ("moon_radius", 1_737_400.0),
        ("moon_mass", 7.342e22),
        ("sun_mass", 1.989e30),
        ("au", 1.495978707e11),
    ]
    .iter()
    .cloned()
    .collect();

    constants.get(&name).copied()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_length_conversion() {
        assert!((convert(1.0, "km", "m").unwrap() - 1000.0).abs() < 1e-10);
        assert!((convert(100.0, "cm", "m").unwrap() - 1.0).abs() < 1e-10);
        assert!((convert(1.0, "mi", "ft").unwrap() - 5280.0).abs() < 1.0);
    }

    #[test]
    fn test_temperature_conversion() {
        assert!((convert_temperature(0.0, "C", "K").unwrap() - 273.15).abs() < 1e-10);
        assert!((convert_temperature(32.0, "F", "C").unwrap() - 0.0).abs() < 1e-10);
        assert!((convert_temperature(100.0, "C", "F").unwrap() - 212.0).abs() < 1e-10);
    }

    #[test]
    fn test_mass_conversion() {
        assert!((convert_mass(1.0, "kg", "g").unwrap() - 1000.0).abs() < 1e-10);
        assert!((convert_mass(1.0, "lb", "kg").unwrap() - 0.453592).abs() < 0.001);
    }

    #[test]
    fn test_time_conversion() {
        assert!((convert_time(1.0, "h", "min").unwrap() - 60.0).abs() < 1e-10);
        assert!((convert_time(60.0, "s", "min").unwrap() - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_constants() {
        assert!((get_constant("g").unwrap() - 9.81).abs() < 1e-10);
        assert!((get_constant("c").unwrap() - 299_792_458.0).abs() < 1e-10);
        assert!(get_constant("nonexistent").is_none());
    }

    #[test]
    fn test_units_for_category() {
        let length_units = units_for_category("length");
        assert!(length_units.contains(&"m"));
        assert!(length_units.contains(&"km"));
    }
}