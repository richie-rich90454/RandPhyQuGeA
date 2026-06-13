import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Local leaderboard for comparing practice performance.
///
/// Stores top scores locally with categories for different
/// practice modes and difficulty levels.
class LeaderboardService {
  static final LeaderboardService _instance = LeaderboardService._();
  factory LeaderboardService() => _instance;
  LeaderboardService._();

  static const _prefsKey = 'leaderboard_entries';

  Future<void> addEntry(LeaderboardEntry entry) async {
    final entries = await getEntries();
    entries.add(entry);
    entries.sort((a, b) => b.score.compareTo(a.score));

    // Keep top 100
    final trimmed = entries.take(100).toList();
    await _save(trimmed);
  }

  Future<List<LeaderboardEntry>> getEntries({
    String? mode,
    int? difficulty,
  }) async {
    final all = await _loadAll();
    return all.where((e) {
      if (mode != null && e.mode != mode) return false;
      if (difficulty != null && e.difficulty != difficulty) return false;
      return true;
    }).toList();
  }

  Future<List<LeaderboardEntry>> getTopScores({
    int limit = 10,
    String? mode,
  }) async {
    final entries = await getEntries(mode: mode);
    return entries.take(limit).toList();
  }

  Future<List<LeaderboardEntry>> _loadAll() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_prefsKey);
    if (stored == null) return [];

    final list = jsonDecode(stored) as List;
    return list
        .map((e) => LeaderboardEntry.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _save(List<LeaderboardEntry> entries) async {
    final prefs = await SharedPreferences.getInstance();
    final json = jsonEncode(entries.map((e) => e.toJson()).toList());
    await prefs.setString(_prefsKey, json);
  }

  Future<LeaderboardStats> getStats() async {
    final all = await _loadAll();
    if (all.isEmpty) {
      return LeaderboardStats(
        totalEntries: 0,
        bestAccuracy: 0,
        bestScore: 0,
        averageScore: 0,
        mostPracticedMode: 'none',
        mostPracticedDifficulty: 0,
      );
    }

    final bestAccuracy = all
        .map((e) => e.accuracy)
        .reduce((a, b) => a > b ? a : b);
    final bestScore = all
        .map((e) => e.score)
        .reduce((a, b) => a > b ? a : b);
    final avgScore = all.map((e) => e.score).reduce((a, b) => a + b) / all.length;

    final modeCounts = <String, int>{};
    final diffCounts = <int, int>{};
    for (final e in all) {
      modeCounts[e.mode] = (modeCounts[e.mode] ?? 0) + 1;
      diffCounts[e.difficulty] = (diffCounts[e.difficulty] ?? 0) + 1;
    }
    final mostPracticedMode = modeCounts.entries
        .reduce((a, b) => a.value > b.value ? a : b)
        .key;
    final mostPracticedDifficulty = diffCounts.entries
        .reduce((a, b) => a.value > b.value ? a : b)
        .key;

    return LeaderboardStats(
      totalEntries: all.length,
      bestAccuracy: bestAccuracy,
      bestScore: bestScore,
      averageScore: avgScore,
      mostPracticedMode: mostPracticedMode,
      mostPracticedDifficulty: mostPracticedDifficulty,
    );
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefsKey);
  }
}

class LeaderboardEntry {
  final String id;
  final String mode;
  final int difficulty;
  final int questionsAnswered;
  final int correct;
  final double avgTimeMs;
  final int score;
  final String timestamp;

  LeaderboardEntry({
    required this.id,
    required this.mode,
    required this.difficulty,
    required this.questionsAnswered,
    required this.correct,
    required this.avgTimeMs,
    required this.score,
    required this.timestamp,
  });

  double get accuracy =>
      questionsAnswered > 0 ? correct / questionsAnswered : 0.0;

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      id: json['id'] ?? '',
      mode: json['mode'] ?? 'focused',
      difficulty: json['difficulty'] ?? 1,
      questionsAnswered: json['questionsAnswered'] ?? 0,
      correct: json['correct'] ?? 0,
      avgTimeMs: (json['avgTimeMs'] ?? 0).toDouble(),
      score: json['score'] ?? 0,
      timestamp: json['timestamp'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'mode': mode,
    'difficulty': difficulty,
    'questionsAnswered': questionsAnswered,
    'correct': correct,
    'avgTimeMs': avgTimeMs,
    'score': score,
    'timestamp': timestamp,
  };
}

class LeaderboardStats {
  final int totalEntries;
  final double bestAccuracy;
  final int bestScore;
  final double averageScore;
  final String mostPracticedMode;
  final int mostPracticedDifficulty;

  const LeaderboardStats({
    required this.totalEntries,
    required this.bestAccuracy,
    required this.bestScore,
    required this.averageScore,
    required this.mostPracticedMode,
    required this.mostPracticedDifficulty,
  });
}