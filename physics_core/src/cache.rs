//! Question cache for efficient reuse of generated questions.
//!
//! Provides an in-memory LRU-style cache for generated questions
//! to avoid redundant generation and improve performance in
//! practice sessions and batch operations.

use crate::domain::GeneratedQuestion;
use std::collections::HashMap;

/// A cache for generated questions with optional capacity limit.
///
/// When the cache exceeds its capacity, the oldest entries are evicted.
/// Questions are keyed by a combination of their template ID and variable values.
pub struct QuestionCache {
    /// Maximum number of entries before eviction.
    capacity: usize,
    /// The cached questions, keyed by a unique hash of the template+variables.
    entries: HashMap<String, CachedQuestion>,
    /// Ordered keys for FIFO eviction.
    order: Vec<String>,
    /// Whether the cache is enabled.
    enabled: bool,
}

struct CachedQuestion {
    question: GeneratedQuestion,
    /// Unix timestamp of when this was cached (for TTL).
    cached_at: u64,
}

impl QuestionCache {
    /// Create a new cache with the given capacity.
    pub fn new(capacity: usize) -> Self {
        QuestionCache {
            capacity,
            entries: HashMap::new(),
            order: Vec::new(),
            enabled: capacity > 0,
        }
    }

    /// Create a disabled cache (no caching).
    pub fn disabled() -> Self {
        QuestionCache {
            capacity: 0,
            entries: HashMap::new(),
            order: Vec::new(),
            enabled: false,
        }
    }

    /// Check if the cache is enabled.
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Get a cached question by its key.
    pub fn get(&self, key: &str) -> Option<&GeneratedQuestion> {
        if !self.enabled {
            return None;
        }
        self.entries.get(key).map(|c| &c.question)
    }

    /// Insert a question into the cache.
    /// Returns the key used for future retrieval.
    pub fn insert(&mut self, key: String, question: GeneratedQuestion) {
        if !self.enabled {
            return;
        }

        // Evict oldest if at capacity
        while self.entries.len() >= self.capacity {
            if let Some(old_key) = self.order.first().cloned() {
                self.entries.remove(&old_key);
                self.order.remove(0);
            } else {
                break;
            }
        }

        // Remove existing entry if key already present (update order)
        if let Some(pos) = self.order.iter().position(|k| k == &key) {
            self.order.remove(pos);
        }

        self.order.push(key.clone());
        self.entries.insert(
            key,
            CachedQuestion {
                question,
                cached_at: current_timestamp(),
            },
        );
    }

    /// Remove a specific entry from the cache.
    pub fn remove(&mut self, key: &str) {
        self.entries.remove(key);
        if let Some(pos) = self.order.iter().position(|k| k == key) {
            self.order.remove(pos);
        }
    }

    /// Clear all cached entries.
    pub fn clear(&mut self) {
        self.entries.clear();
        self.order.clear();
    }

    /// Get the current number of cached entries.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Check if the cache is empty.
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Evict entries older than the specified TTL in seconds.
    /// Returns the number of evicted entries.
    pub fn evict_expired(&mut self, ttl_seconds: u64) -> usize {
        if ttl_seconds == 0 {
            return 0;
        }
        let now = current_timestamp();
        let expired_keys: Vec<String> = self
            .entries
            .iter()
            .filter(|(_, c)| now - c.cached_at > ttl_seconds)
            .map(|(k, _)| k.clone())
            .collect();

        let count = expired_keys.len();
        for key in &expired_keys {
            self.remove(key);
        }
        count
    }

    /// Generate a cache key from a template ID and variable values.
    pub fn make_key(template_id: &str, variables: &HashMap<String, f64>) -> String {
        let mut parts: Vec<String> = vec![template_id.to_string()];
        let mut sorted_vars: Vec<(&String, &f64)> = variables.iter().collect();
        sorted_vars.sort_by(|a, b| a.0.cmp(b.0));
        for (name, value) in sorted_vars {
            parts.push(format!("{}={}", name, value));
        }
        parts.join("|")
    }
}

/// Get the current Unix timestamp in seconds.
/// Uses a simple counter in tests; real implementation in production.
fn current_timestamp() -> u64 {
    #[cfg(test)]
    {
        use std::sync::atomic::{AtomicU64, Ordering};
        static COUNTER: AtomicU64 = AtomicU64::new(1000000);
        COUNTER.fetch_add(1, Ordering::SeqCst)
    }
    #[cfg(not(test))]
    {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::*;
    use std::collections::HashMap;

    fn make_test_question(id: &str) -> GeneratedQuestion {
        GeneratedQuestion {
            id: id.to_string(),
            topic_id: "T1".to_string(),
            skill_id: "S1".to_string(),
            question_type: "SA".to_string(),
            difficulty: 1,
            text: format!("Test {}", id),
            answer: "5".to_string(),
            choices: None,
            solution_text: "Solution".to_string(),
            solution_latex: "".to_string(),
            variables: HashMap::new(),
        }
    }

    #[test]
    fn test_cache_insert_and_get() {
        let mut cache = QuestionCache::new(10);
        let q = make_test_question("q1");
        cache.insert("key1".to_string(), q.clone());
        assert_eq!(cache.len(), 1);

        let retrieved = cache.get("key1").unwrap();
        assert_eq!(retrieved.id, "q1");
    }

    #[test]
    fn test_cache_miss() {
        let cache = QuestionCache::new(10);
        assert!(cache.get("nonexistent").is_none());
    }

    #[test]
    fn test_cache_capacity_eviction() {
        let mut cache = QuestionCache::new(3);
        cache.insert("k1".to_string(), make_test_question("q1"));
        cache.insert("k2".to_string(), make_test_question("q2"));
        cache.insert("k3".to_string(), make_test_question("q3"));
        cache.insert("k4".to_string(), make_test_question("q4"));

        // k1 should be evicted (oldest)
        assert_eq!(cache.len(), 3);
        assert!(cache.get("k1").is_none());
        assert!(cache.get("k2").is_some());
        assert!(cache.get("k3").is_some());
        assert!(cache.get("k4").is_some());
    }

    #[test]
    fn test_cache_update_existing() {
        let mut cache = QuestionCache::new(10);
        cache.insert("k1".to_string(), make_test_question("q1"));
        cache.insert("k1".to_string(), make_test_question("q1_updated"));

        assert_eq!(cache.len(), 1);
        assert_eq!(cache.get("k1").unwrap().id, "q1_updated");
    }

    #[test]
    fn test_cache_clear() {
        let mut cache = QuestionCache::new(10);
        cache.insert("k1".to_string(), make_test_question("q1"));
        cache.insert("k2".to_string(), make_test_question("q2"));
        cache.clear();
        assert!(cache.is_empty());
    }

    #[test]
    fn test_cache_remove() {
        let mut cache = QuestionCache::new(10);
        cache.insert("k1".to_string(), make_test_question("q1"));
        cache.insert("k2".to_string(), make_test_question("q2"));
        cache.remove("k1");
        assert_eq!(cache.len(), 1);
        assert!(cache.get("k1").is_none());
        assert!(cache.get("k2").is_some());
    }

    #[test]
    fn test_disabled_cache() {
        let mut cache = QuestionCache::disabled();
        assert!(!cache.is_enabled());
        cache.insert("k1".to_string(), make_test_question("q1"));
        assert!(cache.is_empty());
        assert!(cache.get("k1").is_none());
    }

    #[test]
    fn test_make_key() {
        let mut vars = HashMap::new();
        vars.insert("v".to_string(), 30.0);
        vars.insert("v0".to_string(), 10.0);
        let key = QuestionCache::make_key("Q1", &vars);
        assert!(key.contains("Q1"));
        assert!(key.contains("v=30"));
        assert!(key.contains("v0=10"));
    }

    #[test]
    fn test_evict_expired() {
        let mut cache = QuestionCache::new(10);
        cache.insert("k1".to_string(), make_test_question("q1"));
        cache.insert("k2".to_string(), make_test_question("q2"));

        // TTL of 0 means no eviction
        let evicted = cache.evict_expired(0);
        assert_eq!(evicted, 0);
        assert_eq!(cache.len(), 2);
    }
}