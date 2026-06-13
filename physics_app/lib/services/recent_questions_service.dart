import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/models.dart';

/// Tracks recently generated/viewed questions for quick access.
/// Persists the last N questions to SharedPreferences.
class RecentQuestionsService extends ChangeNotifier {
  static const int _maxRecent = 50;
  static const String _storageKey = 'recent_questions';

  List<RecentQuestionEntry> _recentQuestions = [];

  List<RecentQuestionEntry> get recentQuestions => List.unmodifiable(_recentQuestions);

  RecentQuestionsService() {
    _loadRecent();
  }

  /// Add a question to the recent list.
  Future<void> addQuestion(GeneratedQuestion question) async {
    _recentQuestions.removeWhere((e) => e.questionId == question.id);
    _recentQuestions.insert(
      0,
      RecentQuestionEntry(
        questionId: question.id,
        topicId: question.topicId,
        skillId: question.skillId,
        questionType: question.questionType,
        difficulty: question.difficulty,
        text: question.text,
        answer: question.answer,
        timestamp: DateTime.now().toIso8601String(),
      ),
    );

    if (_recentQuestions.length > _maxRecent) {
      _recentQuestions = _recentQuestions.sublist(0, _maxRecent);
    }

    await _saveRecent();
    notifyListeners();
  }

  /// Remove a specific question from recent list.
  Future<void> removeQuestion(String questionId) async {
    _recentQuestions.removeWhere((e) => e.questionId == questionId);
    await _saveRecent();
    notifyListeners();
  }

  /// Clear all recent questions.
  Future<void> clearAll() async {
    _recentQuestions.clear();
    await _saveRecent();
    notifyListeners();
  }

  /// Get recent questions filtered by topic.
  List<RecentQuestionEntry> getByTopic(String topicId) {
    return _recentQuestions.where((e) => e.topicId == topicId).toList();
  }

  /// Get recent questions filtered by difficulty range.
  List<RecentQuestionEntry> getByDifficulty(int min, int max) {
    return _recentQuestions
        .where((e) => e.difficulty >= min && e.difficulty <= max)
        .toList();
  }

  /// Get the most recent N questions.
  List<RecentQuestionEntry> getMostRecent([int count = 10]) {
    return _recentQuestions.take(count).toList();
  }

  /// Check if a question is in the recent list.
  bool contains(String questionId) {
    return _recentQuestions.any((e) => e.questionId == questionId);
  }

  Future<void> _loadRecent() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString(_storageKey);
    if (json != null) {
      final list = jsonDecode(json) as List;
      _recentQuestions = list
          .map((e) => RecentQuestionEntry.fromJson(e as Map<String, dynamic>))
          .toList();
      notifyListeners();
    }
  }

  Future<void> _saveRecent() async {
    final prefs = await SharedPreferences.getInstance();
    final json = jsonEncode(_recentQuestions.map((e) => e.toJson()).toList());
    await prefs.setString(_storageKey, json);
  }
}

/// A lightweight entry for a recently viewed question.
class RecentQuestionEntry {
  final String questionId;
  final String topicId;
  final String skillId;
  final String questionType;
  final int difficulty;
  final String text;
  final String answer;
  final String timestamp;

  RecentQuestionEntry({
    required this.questionId,
    required this.topicId,
    required this.skillId,
    required this.questionType,
    required this.difficulty,
    required this.text,
    required this.answer,
    required this.timestamp,
  });

  factory RecentQuestionEntry.fromJson(Map<String, dynamic> json) {
    return RecentQuestionEntry(
      questionId: json['question_id'] ?? '',
      topicId: json['topic_id'] ?? '',
      skillId: json['skill_id'] ?? '',
      questionType: json['question_type'] ?? '',
      difficulty: json['difficulty'] ?? 1,
      text: json['text'] ?? '',
      answer: json['answer'] ?? '',
      timestamp: json['timestamp'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'question_id': questionId,
        'topic_id': topicId,
        'skill_id': skillId,
        'question_type': questionType,
        'difficulty': difficulty,
        'text': text,
        'answer': answer,
        'timestamp': timestamp,
      };

  /// Get a relative time string (e.g., "2 min ago").
  String get relativeTime {
    try {
      final dateTime = DateTime.parse(timestamp);
      final now = DateTime.now();
      final diff = now.difference(dateTime);

      if (diff.inSeconds < 60) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${dateTime.month}/${dateTime.day}';
    } catch (_) {
      return '';
    }
  }

  /// Get a truncated preview of the question text.
  String get preview {
    if (text.length <= 60) return text;
    return '${text.substring(0, 60)}...';
  }
}