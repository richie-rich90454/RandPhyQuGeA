import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

/// Service for managing app notifications and reminders.
class NotificationService extends ChangeNotifier {
  static final NotificationService _instance = NotificationService._();
  factory NotificationService() => _instance;
  NotificationService._();

  bool _remindersEnabled = false;
  String _reminderTime = '09:00';
  bool _practiceReminder = true;
  int _questionsPerReminder = 10;

  bool get remindersEnabled => _remindersEnabled;
  String get reminderTime => _reminderTime;

  Future<void> loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _remindersEnabled = prefs.getBool('notif_reminders') ?? false;
    _reminderTime = prefs.getString('notif_time') ?? '09:00';
    _practiceReminder = prefs.getBool('notif_practice') ?? true;
    notifyListeners();
  }

  Future<void> setRemindersEnabled(bool enabled) async {
    _remindersEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notif_reminders', enabled);
    notifyListeners();
  }

  Future<void> setReminderTime(String time) async {
    _reminderTime = time;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('notif_time', time);
    notifyListeners();
  }

  Future<void> setPracticeReminder(bool enabled) async {
    _practiceReminder = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notif_practice', enabled);
    notifyListeners();
  }

  /// Check for app updates from GitHub releases.
  Future<UpdateInfo?> checkForUpdates() async {
    try {
      final response = await http.get(
        Uri.parse('https://api.github.com/repos/randphyqugea/physics-question-generator/releases/latest'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final tagName = data['tag_name'] as String?;
        final body = data['body'] as String?;
        if (tagName != null) {
          return UpdateInfo(version: tagName, releaseNotes: body ?? '');
        }
      }
    } catch (_) {
      // Offline or rate-limited; skip update check
    }
    return null;
  }
}

class UpdateInfo {
  final String version;
  final String releaseNotes;

  const UpdateInfo({required this.version, required this.releaseNotes});
}