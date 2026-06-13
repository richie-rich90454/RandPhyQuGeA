//! Application configuration module.
//!
//! Provides configuration types for controlling question generation,
//! export settings, and runtime behavior of the physics core library.

use serde::{Deserialize, Serialize};

/// Main application configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Generation settings
    pub generation: GenerationConfig,
    /// Export settings
    pub export: ExportConfig,
    /// Display settings
    pub display: DisplayConfig,
    /// Cache settings
    pub cache: CacheConfig,
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            generation: GenerationConfig::default(),
            export: ExportConfig::default(),
            display: DisplayConfig::default(),
            cache: CacheConfig::default(),
        }
    }
}

impl AppConfig {
    /// Load configuration from a JSON string.
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    /// Serialize configuration to a JSON string.
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }

    /// Create a configuration optimized for low-end devices.
    pub fn low_end() -> Self {
        AppConfig {
            generation: GenerationConfig {
                max_batch_size: 10,
                ..Default::default()
            },
            cache: CacheConfig {
                max_cached_questions: 50,
                ..Default::default()
            },
            ..Default::default()
        }
    }

    /// Create a configuration optimized for high-performance use.
    pub fn high_performance() -> Self {
        AppConfig {
            generation: GenerationConfig {
                max_batch_size: 500,
                ..Default::default()
            },
            cache: CacheConfig {
                max_cached_questions: 1000,
                ..Default::default()
            },
            ..Default::default()
        }
    }
}

/// Configuration for question generation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationConfig {
    /// Maximum number of questions to generate in a single batch.
    pub max_batch_size: usize,
    /// Default answer tolerance for comparison (0.0 to 1.0).
    pub default_tolerance: f64,
    /// Whether to enforce unique questions in a batch.
    pub enforce_unique: bool,
    /// Maximum retries for generating a unique question.
    pub max_unique_retries: usize,
    /// Whether to include solutions by default.
    pub include_solutions: bool,
    /// Whether to shuffle choice order for MC questions.
    pub shuffle_choices: bool,
}

impl Default for GenerationConfig {
    fn default() -> Self {
        GenerationConfig {
            max_batch_size: 100,
            default_tolerance: 0.001,
            enforce_unique: true,
            max_unique_retries: 10,
            include_solutions: true,
            shuffle_choices: true,
        }
    }
}

/// Configuration for question export.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportConfig {
    /// Whether to include MathJax in HTML exports.
    pub include_mathjax: bool,
    /// Whether to include answer key in exports.
    pub include_answer_key: bool,
    /// Whether to include solutions in exports.
    pub include_solutions: bool,
    /// Whether to include difficulty labels.
    pub include_difficulty: bool,
    /// Whether to number questions.
    pub number_questions: bool,
    /// Preferred HTML template for PDF export.
    pub pdf_page_size: String,
}

impl Default for ExportConfig {
    fn default() -> Self {
        ExportConfig {
            include_mathjax: true,
            include_answer_key: true,
            include_solutions: false,
            include_difficulty: false,
            number_questions: true,
            pdf_page_size: "A4".to_string(),
        }
    }
}

/// Configuration for display and UI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayConfig {
    /// Number of decimal places to show in answers.
    pub decimal_places: usize,
    /// Whether to use scientific notation for large/small numbers.
    pub scientific_notation: bool,
    /// Whether to show LaTeX in question text.
    pub show_latex: bool,
    /// Whether to show difficulty badges.
    pub show_difficulty: bool,
    /// Whether to show topic/skill labels.
    pub show_labels: bool,
}

impl Default for DisplayConfig {
    fn default() -> Self {
        DisplayConfig {
            decimal_places: 4,
            scientific_notation: false,
            show_latex: true,
            show_difficulty: true,
            show_labels: true,
        }
    }
}

/// Configuration for question caching.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
    /// Maximum number of cached generated questions.
    pub max_cached_questions: usize,
    /// Whether to cache generated questions in memory.
    pub enable_cache: bool,
    /// Time-to-live for cached items in seconds (0 = no expiry).
    pub ttl_seconds: u64,
}

impl Default for CacheConfig {
    fn default() -> Self {
        CacheConfig {
            max_cached_questions: 200,
            enable_cache: true,
            ttl_seconds: 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.generation.max_batch_size, 100);
        assert_eq!(config.generation.default_tolerance, 0.001);
        assert!(config.generation.enforce_unique);
        assert_eq!(config.export.pdf_page_size, "A4");
        assert_eq!(config.cache.max_cached_questions, 200);
        assert!(config.cache.enable_cache);
    }

    #[test]
    fn test_config_serialization() {
        let config = AppConfig::default();
        let json = config.to_json().unwrap();
        assert!(json.contains("max_batch_size"));
        assert!(json.contains("default_tolerance"));

        let parsed: AppConfig = AppConfig::from_json(&json).unwrap();
        assert_eq!(parsed.generation.max_batch_size, 100);
    }

    #[test]
    fn test_low_end_config() {
        let config = AppConfig::low_end();
        assert_eq!(config.generation.max_batch_size, 10);
        assert_eq!(config.cache.max_cached_questions, 50);
    }

    #[test]
    fn test_high_performance_config() {
        let config = AppConfig::high_performance();
        assert_eq!(config.generation.max_batch_size, 500);
        assert_eq!(config.cache.max_cached_questions, 1000);
    }

    #[test]
    fn test_custom_config() {
        let json = r#"{
            "generation": {
                "max_batch_size": 50,
                "default_tolerance": 0.01,
                "enforce_unique": false,
                "max_unique_retries": 5,
                "include_solutions": true,
                "shuffle_choices": false
            },
            "export": {
                "include_mathjax": false,
                "include_answer_key": true,
                "include_solutions": true,
                "include_difficulty": true,
                "number_questions": true,
                "pdf_page_size": "Letter"
            },
            "display": {
                "decimal_places": 2,
                "scientific_notation": true,
                "show_latex": false,
                "show_difficulty": false,
                "show_labels": true
            },
            "cache": {
                "max_cached_questions": 100,
                "enable_cache": false,
                "ttl_seconds": 3600
            }
        }"#;

        let config = AppConfig::from_json(json).unwrap();
        assert_eq!(config.generation.max_batch_size, 50);
        assert!(!config.generation.enforce_unique);
        assert!(!config.export.include_mathjax);
        assert_eq!(config.export.pdf_page_size, "Letter");
        assert_eq!(config.display.decimal_places, 2);
        assert!(!config.cache.enable_cache);
        assert_eq!(config.cache.ttl_seconds, 3600);
    }
}