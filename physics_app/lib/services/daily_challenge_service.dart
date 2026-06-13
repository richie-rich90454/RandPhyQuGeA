import 'dart:math';

/// Daily challenge service that generates a unique challenge each day
/// based on the current date, ensuring all users see the same challenge.
class DailyChallengeService {
  static final DailyChallengeService _instance = DailyChallengeService._();
  factory DailyChallengeService() => _instance;
  DailyChallengeService._();

  /// Generate a deterministic challenge seed from today's date.
  String getTodaySeed() {
    final now = DateTime.now();
    return '${now.year}-${now.month}-${now.day}';
  }

  /// Get challenge parameters based on date.
  DailyChallenge getTodaysChallenge() {
    final seed = getTodaySeed();
    final hash = seed.hashCode.abs();

    final rng = Random(hash);

    final modes = ['focused', 'mental'];
    final mode = modes[rng.nextInt(modes.length)];

    final difficulties = [1, 2, 3, 4, 5];
    // Bias toward middle difficulties
    final baseDiff = difficulties[difficulties.length ~/ 2];
    final diffOffset = rng.nextInt(3) - 1;
    final targetDifficulty = (baseDiff + diffOffset).clamp(1, 7);

    final questionCounts = [5, 10, 15, 20];
    final questionCount = questionCounts[rng.nextInt(questionCounts.length)];

    final timeLimits = [60, 120, 180, 300];
    final timeLimit = timeLimits[rng.nextInt(timeLimits.length)];

    final challenges = [
      'Complete with 80%+ accuracy',
      'Finish with 2+ minutes remaining',
      'Get 3 perfect answers in a row',
      'Score above 70% at this difficulty',
      'Answer the first question correctly',
    ];
    final bonusChallenge = challenges[rng.nextInt(challenges.length)];

    return DailyChallenge(
      date: seed,
      mode: mode,
      targetDifficulty: targetDifficulty,
      questionCount: questionCount,
      timeLimitSeconds: timeLimit,
      bonusChallenge: bonusChallenge,
      xpReward: targetDifficulty * questionCount,
      bonusXp: targetDifficulty * 10,
    );
  }
}

class DailyChallenge {
  final String date;
  final String mode;
  final int targetDifficulty;
  final int questionCount;
  final int timeLimitSeconds;
  final String bonusChallenge;
  final int xpReward;
  final int bonusXp;

  const DailyChallenge({
    required this.date,
    required this.mode,
    required this.targetDifficulty,
    required this.questionCount,
    required this.timeLimitSeconds,
    required this.bonusChallenge,
    required this.xpReward,
    required this.bonusXp,
  });
}