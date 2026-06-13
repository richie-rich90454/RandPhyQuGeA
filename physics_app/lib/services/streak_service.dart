import 'package:shared_preferences/shared_preferences.dart';

class StreakService {
  static const _streakKey = 'current_streak';
  static const _lastDateKey = 'last_practice_date';
  static const _bestStreakKey = 'best_streak';
  static const _totalDaysKey = 'total_days';

  Future<void> recordPractice() async {
    final prefs = await SharedPreferences.getInstance();
    final today = DateTime.now();
    final todayStr = '${today.year}-${today.month}-${today.day}';

    final lastDate = prefs.getString(_lastDateKey);
    final currentStreak = prefs.getInt(_streakKey) ?? 0;
    final bestStreak = prefs.getInt(_bestStreakKey) ?? 0;
    final totalDays = prefs.getInt(_totalDaysKey) ?? 0;

    if (lastDate == todayStr) return;

    if (lastDate != null) {
      final last = DateTime.parse(lastDate);
      final diff = today.difference(last).inDays;
      if (diff == 1) {
        await prefs.setInt(_streakKey, currentStreak + 1);
      } else {
        await prefs.setInt(_streakKey, 1);
      }
    } else {
      await prefs.setInt(_streakKey, 1);
    }

    final newStreak = prefs.getInt(_streakKey) ?? 1;
    if (newStreak > bestStreak) {
      await prefs.setInt(_bestStreakKey, newStreak);
    }

    await prefs.setString(_lastDateKey, todayStr);
    await prefs.setInt(_totalDaysKey, totalDays + 1);
  }

  Future<int> getCurrentStreak() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_streakKey) ?? 0;
  }

  Future<int> getBestStreak() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_bestStreakKey) ?? 0;
  }

  Future<int> getTotalDays() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_totalDaysKey) ?? 0;
  }
}