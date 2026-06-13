import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Service for syncing app data across sessions.
///
/// Handles import/export of all app data including preferences,
/// practice history, bookmarks, and settings.
class DataSyncService {
  static final DataSyncService _instance = DataSyncService._();
  factory DataSyncService() => _instance;
  DataSyncService._();

  /// Export all app data as a JSON string.
  Future<String> exportAllData() async {
    final prefs = await SharedPreferences.getInstance();
    final data = <String, dynamic>{
      'version': 1,
      'exportedAt': DateTime.now().toIso8601String(),
      'settings': {
        'darkMode': prefs.getBool('darkMode') ?? false,
        'specFilePath': prefs.getString('specFilePath') ?? '',
      },
      'practiceResults': _parseList(prefs.getString('practiceResults')),
      'bookmarks': _parseList(prefs.getString('bookmarks')),
      'recentQuestions': _parseList(prefs.getString('recent_questions')),
      'streaks': prefs.getInt('streak_count') ?? 0,
      'achievements': _parseMap(prefs.getString('achievements')),
    };

    return const JsonEncoder.withIndent('  ').convert(data);
  }

  List<dynamic> _parseList(String? json) {
    if (json == null || json.isEmpty) return [];
    try {
      return jsonDecode(json) as List;
    } catch (_) {
      return [];
    }
  }

  Map<String, dynamic> _parseMap(String? json) {
    if (json == null || json.isEmpty) return {};
    try {
      return jsonDecode(json) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  /// Import data from a JSON string.
  Future<bool> importData(String json) async {
    try {
      final data = jsonDecode(json) as Map<String, dynamic>;
      final version = data['version'] as int?;
      if (version == null || version < 1) {
        return false;
      }

      final prefs = await SharedPreferences.getInstance();

      final settings = data['settings'] as Map<String, dynamic>?;
      if (settings != null) {
        if (settings.containsKey('darkMode')) {
          await prefs.setBool('darkMode', settings['darkMode'] as bool);
        }
        if (settings.containsKey('specFilePath')) {
          await prefs.setString('specFilePath', settings['specFilePath'] as String);
        }
      }

      if (data['practiceResults'] != null) {
        await prefs.setString('practiceResults', jsonEncode(data['practiceResults']));
      }
      if (data['bookmarks'] != null) {
        await prefs.setString('bookmarks', jsonEncode(data['bookmarks']));
      }
      if (data['recentQuestions'] != null) {
        await prefs.setString('recent_questions', jsonEncode(data['recentQuestions']));
      }
      if (data['streaks'] != null) {
        await prefs.setInt('streak_count', data['streaks'] as int);
      }
      if (data['achievements'] != null) {
        await prefs.setString('achievements', jsonEncode(data['achievements']));
      }

      return true;
    } catch (_) {
      return false;
    }
  }

  /// Get the estimated size of all stored data in bytes.
  Future<int> getDataSize() async {
    final data = await exportAllData();
    return data.length;
  }

  /// Clear all app data.
  Future<void> clearAllData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}