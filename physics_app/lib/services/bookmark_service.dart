import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class BookmarkService {
  static const _key = 'bookmarked_questions';

  Future<void> bookmark(String questionId) async {
    final prefs = await SharedPreferences.getInstance();
    final bookmarks = await getBookmarks();
    bookmarks.add(questionId);
    await prefs.setString(_key, jsonEncode(bookmarks.toList()));
  }

  Future<void> unbookmark(String questionId) async {
    final prefs = await SharedPreferences.getInstance();
    final bookmarks = await getBookmarks();
    bookmarks.remove(questionId);
    await prefs.setString(_key, jsonEncode(bookmarks.toList()));
  }

  Future<bool> isBookmarked(String questionId) async {
    final bookmarks = await getBookmarks();
    return bookmarks.contains(questionId);
  }

  Future<Set<String>> getBookmarks() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString(_key);
    if (json == null) return {};
    final list = jsonDecode(json) as List;
    return Set<String>.from(list.map((e) => e.toString()));
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}