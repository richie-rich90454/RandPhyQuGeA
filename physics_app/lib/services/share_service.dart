import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

/// Service for sharing content from the app.
class ShareService {
  static final ShareService _instance = ShareService._();
  factory ShareService() => _instance;
  ShareService._();

  /// Share a question as text.
  Future<void> shareQuestion({
    required String questionText,
    required String answer,
    String? solution,
    String? topic,
  }) async {
    final buffer = StringBuffer();
    buffer.writeln('Physics Question');
    if (topic != null) {
      buffer.writeln('Topic: $topic');
    }
    buffer.writeln();
    buffer.writeln('Q: $questionText');
    buffer.writeln();
    buffer.writeln('A: $answer');
    if (solution != null) {
      buffer.writeln();
      buffer.writeln('Solution: $solution');
    }

    await Share.share(buffer.toString(), subject: 'Physics Question');
  }

  /// Share a practice result summary.
  Future<void> shareResults({
    required String mode,
    required int questionsAnswered,
    required int correct,
    required double avgTimeSeconds,
  }) async {
    final accuracy = questionsAnswered > 0
        ? (correct / questionsAnswered * 100).toStringAsFixed(1)
        : '0';

    final text = '''
Practice Results - Physics Question Generator
Mode: ${mode == 'focused' ? 'Focused Practice' : 'Mental Practice'}
Questions: $questionsAnswered
Correct: $correct
Accuracy: $accuracy%
Average Time: ${avgTimeSeconds.toStringAsFixed(1)}s
''';

    await Share.share(text, subject: 'Practice Results');
  }

  /// Share a study tip or quote.
  Future<void> shareTip(String tip) async {
    await Share.share('Physics Study Tip: $tip');
  }
}