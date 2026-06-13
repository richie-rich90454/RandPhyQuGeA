import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Achievement definitions and tracking for gamification.
class AchievementsService {
  static final AchievementsService _instance = AchievementsService._();
  factory AchievementsService() => _instance;
  AchievementsService._();

  static const _prefsKey = 'achievements';
  Map<String, AchievementProgress> _progress = {};
  bool _loaded = false;

  static const achievements = [
    _AchievementDef(
      id: 'first_practice',
      name: 'First Steps',
      description: 'Complete your first practice session',
      icon: 'play_circle',
      tiers: [1, 5, 25, 100],
    ),
    _AchievementDef(
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Get 100% accuracy in a practice session (5+ questions)',
      icon: 'star',
      tiers: [1, 5, 10, 50],
    ),
    _AchievementDef(
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Answer correctly in under 5 seconds',
      icon: 'speed',
      tiers: [5, 25, 100, 500],
    ),
    _AchievementDef(
      id: 'daily_streak',
      name: 'Consistent Learner',
      description: 'Practice for consecutive days',
      icon: 'local_fire_department',
      tiers: [3, 7, 30, 100],
    ),
    _AchievementDef(
      id: 'question_master',
      name: 'Question Master',
      description: 'Generate questions across all topics',
      icon: 'psychology',
      tiers: [10, 50, 200, 1000],
    ),
    _AchievementDef(
      id: 'exporter',
      name: 'Knowledge Sharer',
      description: 'Export question sets',
      icon: 'file_download',
      tiers: [1, 5, 20, 50],
    ),
    _AchievementDef(
      id: 'difficulty_climber',
      name: 'Difficulty Climber',
      description: 'Complete sessions at difficulty 5+',
      icon: 'trending_up',
      tiers: [3, 10, 25, 100],
    ),
    _AchievementDef(
      id: 'variety_practitioner',
      name: 'Variety Seeker',
      description: 'Practice both focused and mental modes',
      icon: 'explore',
      tiers: [1, 10, 50, 200],
    ),
  ];

  Future<void> _ensureLoaded() async {
    if (_loaded) return;
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_prefsKey);
    if (stored != null) {
      final map = jsonDecode(stored) as Map<String, dynamic>;
      _progress = map.map((k, v) => MapEntry(
        k, AchievementProgress.fromJson(v as Map<String, dynamic>),
      ));
    }
    _loaded = true;
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    final map = _progress.map((k, v) => MapEntry(k, v.toJson()));
    await prefs.setString(_prefsKey, jsonEncode(map));
  }

  Future<void> recordProgress(String achievementId, {int increment = 1}) async {
    await _ensureLoaded();
    _progress.putIfAbsent(achievementId, () => AchievementProgress());
    final p = _progress[achievementId]!;
    final oldTier = p.currentTier;
    p.count += increment;
    p.lastUpdated = DateTime.now().toIso8601String();
    p.currentTier = _calculateTier(achievementId, p.count);

    if (p.currentTier > oldTier) {
      p.newlyUnlocked = true;
    }

    await _save();
  }

  int _calculateTier(String id, int count) {
    final def = achievements.firstWhere((a) => a.id == id);
    int tier = 0;
    for (final threshold in def.tiers) {
      if (count >= threshold) tier++;
    }
    return tier;
  }

  Future<List<AchievementState>> getAllAchievements() async {
    await _ensureLoaded();
    return achievements.map((def) {
      final progress = _progress[def.id];
      return AchievementState(
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        currentCount: progress?.count ?? 0,
        currentTier: progress?.currentTier ?? 0,
        maxTier: def.tiers.length,
        thresholds: def.tiers,
        newlyUnlocked: progress?.newlyUnlocked ?? false,
      );
    }).toList();
  }

  Future<void> markSeen(String achievementId) async {
    await _ensureLoaded();
    if (_progress.containsKey(achievementId)) {
      _progress[achievementId]!.newlyUnlocked = false;
      await _save();
    }
  }

  Future<void> resetAll() async {
    _progress.clear();
    _loaded = true;
    await _save();
  }
}

class _AchievementDef {
  final String id;
  final String name;
  final String description;
  final String icon;
  final List<int> tiers;

  const _AchievementDef({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.tiers,
  });
}

class AchievementProgress {
  int count;
  String lastUpdated;
  int currentTier;
  bool newlyUnlocked;

  AchievementProgress({
    this.count = 0,
    this.lastUpdated = '',
    this.currentTier = 0,
    this.newlyUnlocked = false,
  });

  factory AchievementProgress.fromJson(Map<String, dynamic> json) {
    return AchievementProgress(
      count: json['count'] ?? 0,
      lastUpdated: json['lastUpdated'] ?? '',
      currentTier: json['currentTier'] ?? 0,
      newlyUnlocked: json['newlyUnlocked'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'count': count,
    'lastUpdated': lastUpdated,
    'currentTier': currentTier,
    'newlyUnlocked': newlyUnlocked,
  };
}

class AchievementState {
  final String id;
  final String name;
  final String description;
  final String icon;
  final int currentCount;
  final int currentTier;
  final int maxTier;
  final List<int> thresholds;
  final bool newlyUnlocked;

  const AchievementState({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.currentCount,
    required this.currentTier,
    required this.maxTier,
    required this.thresholds,
    required this.newlyUnlocked,
  });

  double get progressToNextTier {
    if (currentTier >= maxTier) return 1.0;
    final prev = currentTier > 0 ? thresholds[currentTier - 1] : 0;
    final next = thresholds[currentTier];
    return (currentCount - prev) / (next - prev);
  }

  bool get isMaxed => currentTier >= maxTier;
}