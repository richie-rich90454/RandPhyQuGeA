/// Analytics service for tracking app usage and events.
///
/// Tracks user interactions, practice sessions, and feature usage
/// without collecting any personally identifiable information.
class AnalyticsService {
  static final AnalyticsService _instance = AnalyticsService._();
  factory AnalyticsService() => _instance;
  AnalyticsService._();

  final List<Map<String, dynamic>> _events = [];
  bool _enabled = true;

  bool get isEnabled => _enabled;

  void setEnabled(bool enabled) {
    _enabled = enabled;
  }

  void trackEvent(String name, [Map<String, dynamic>? properties]) {
    if (!_enabled) return;
    _events.add({
      'name': name,
      'properties': properties ?? {},
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  void trackView(String viewName) {
    trackEvent('view_opened', {'view': viewName});
  }

  void trackPracticeStarted(String mode, {String? topicId, int? difficulty}) {
    trackEvent('practice_started', {
      'mode': mode,
      'topic_id': topicId ?? 'any',
      'difficulty': difficulty ?? 0,
    });
  }

  void trackPracticeCompleted(String mode, {
    required int questionsAnswered,
    required int correct,
    required double avgTimeMs,
  }) {
    trackEvent('practice_completed', {
      'mode': mode,
      'questions_answered': questionsAnswered,
      'correct': correct,
      'accuracy': questionsAnswered > 0 ? correct / questionsAnswered : 0.0,
      'avg_time_ms': avgTimeMs.round(),
    });
  }

  void trackExport(String format, int questionCount) {
    trackEvent('export_performed', {
      'format': format,
      'question_count': questionCount,
    });
  }

  void trackQuestionGenerated({String? templateId, int? difficulty}) {
    trackEvent('question_generated', {
      'template_id': templateId ?? 'unknown',
      'difficulty': difficulty ?? 0,
    });
  }

  List<Map<String, dynamic>> getRecentEvents({int limit = 100}) {
    return _events.reversed.take(limit).toList();
  }

  Map<String, int> getEventCounts() {
    final counts = <String, int>{};
    for (final event in _events) {
      counts[event['name']] = (counts[event['name']] ?? 0) + 1;
    }
    return counts;
  }

  void clear() {
    _events.clear();
  }
}