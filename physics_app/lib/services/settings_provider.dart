import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/models.dart';

class SettingsProvider extends ChangeNotifier {
  bool _isDarkMode = false;
  String _specFilePath = '';
  String _specificationContent = '';

  bool get isDarkMode => _isDarkMode;
  String get specFilePath => _specFilePath;
  String get specificationContent => _specificationContent;

  SettingsProvider() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _isDarkMode = prefs.getBool('darkMode') ?? false;
    _specFilePath = prefs.getString('specFilePath') ?? '';
    _specificationContent = prefs.getString('specificationContent') ?? '';
    notifyListeners();
  }

  Future<void> toggleDarkMode() async {
    _isDarkMode = !_isDarkMode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('darkMode', _isDarkMode);
    notifyListeners();
  }

  Future<void> setSpecFilePath(String path, String content) async {
    _specFilePath = path;
    _specificationContent = content;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('specFilePath', path);
    await prefs.setString('specificationContent', content);
    notifyListeners();
  }

  Future<void> savePracticeResults(List<PracticeResult> results) async {
    final prefs = await SharedPreferences.getInstance();
    final json = jsonEncode(results.map((r) => r.toJson()).toList());
    await prefs.setString('practiceResults', json);
  }

  Future<List<PracticeResult>> loadPracticeResults() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString('practiceResults');
    if (json == null) return [];
    final list = jsonDecode(json) as List;
    return list.map((e) => PracticeResult.fromJson(e)).toList();
  }
}