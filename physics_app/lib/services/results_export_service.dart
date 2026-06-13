import 'dart:convert';
import '../models/models.dart';

/// Service for exporting practice results to various formats.
///
/// Supports CSV, JSON, and human-readable text formats for
/// sharing or analyzing practice session data.
class ResultsExportService {
  /// Export practice results to CSV format.
  static String exportToCsv(List<PracticeResult> results) {
    final buf = StringBuffer();
    buf.writeln('ID,Question ID,Topic ID,Skill ID,Mode,Difficulty,Correct,Time (ms),User Answer,Timestamp');
    for (final r in results) {
      buf.writeln(
        '${r.id},${r.questionId},${r.topicId},${r.skillId},${r.mode},${r.difficulty},${r.isCorrect},${r.timeTakenMs},"${r.userAnswer}",${r.timestamp}',
      );
    }
    return buf.toString();
  }

  /// Export practice results to JSON format.
  static String exportToJson(List<PracticeResult> results) {
    return const JsonEncoder.withIndent('  ')
        .convert(results.map((r) => r.toJson()).toList());
  }

  /// Export practice results to a human-readable text summary.
  static String exportToText(List<PracticeResult> results) {
    final buf = StringBuffer();
    buf.writeln('PRACTICE RESULTS SUMMARY');
    buf.writeln('=' * 50);
    buf.writeln('');

    final total = results.length;
    final correct = results.where((r) => r.isCorrect).length;
    final accuracy = total > 0 ? (correct / total * 100).toStringAsFixed(1) : '0.0';
    final avgTime = total > 0
        ? (results.map((r) => r.timeTakenMs).reduce((a, b) => a + b) / total / 1000).toStringAsFixed(2)
        : '0.00';

    buf.writeln('Total Questions: $total');
    buf.writeln('Correct: $correct');
    buf.writeln('Incorrect: ${total - correct}');
    buf.writeln('Accuracy: $accuracy%');
    buf.writeln('Average Time: ${avgTime}s');
    buf.writeln('');

    // By mode
    final mentalResults = results.where((r) => r.mode == 'Mental').toList();
    final focusedResults = results.where((r) => r.mode == 'Focused').toList();
    if (mentalResults.isNotEmpty) {
      final mCorrect = mentalResults.where((r) => r.isCorrect).length;
      buf.writeln('Mental Practice: ${mCorrect}/${mentalResults.length} correct');
    }
    if (focusedResults.isNotEmpty) {
      final fCorrect = focusedResults.where((r) => r.isCorrect).length;
      buf.writeln('Focused Practice: ${fCorrect}/${focusedResults.length} correct');
    }
    buf.writeln('');

    // By difficulty
    final byDifficulty = <int, List<PracticeResult>>{};
    for (final r in results) {
      byDifficulty.putIfAbsent(r.difficulty, () => []).add(r);
    }
    final sortedDiffs = byDifficulty.keys.toList()..sort();
    for (final diff in sortedDiffs) {
      final diffResults = byDifficulty[diff]!;
      final dCorrect = diffResults.where((r) => r.isCorrect).length;
      buf.writeln('Difficulty $diff: ${dCorrect}/${diffResults.length} correct');
    }
    buf.writeln('');

    // Individual results
    buf.writeln('-' * 50);
    buf.writeln('DETAILED RESULTS');
    buf.writeln('-' * 50);
    for (var i = 0; i < results.length; i++) {
      final r = results[i];
      final status = r.isCorrect ? 'CORRECT' : 'INCORRECT';
      final time = (r.timeTakenMs / 1000).toStringAsFixed(2);
      buf.writeln('${i + 1}. [$status] ${r.userAnswer} (${time}s) - Mode: ${r.mode}, Diff: ${r.difficulty}');
    }

    return buf.toString();
  }

  /// Export practice results to a markdown summary.
  static String exportToMarkdown(List<PracticeResult> results) {
    final buf = StringBuffer();
    buf.writeln('# Practice Results Summary');
    buf.writeln('');

    final total = results.length;
    final correct = results.where((r) => r.isCorrect).length;
    final accuracy = total > 0 ? (correct / total * 100).toStringAsFixed(1) : '0.0';
    final avgTime = total > 0
        ? (results.map((r) => r.timeTakenMs).reduce((a, b) => a + b) / total / 1000).toStringAsFixed(2)
        : '0.00';

    buf.writeln('| Metric | Value |');
    buf.writeln('|--------|-------|');
    buf.writeln('| Total Questions | $total |');
    buf.writeln('| Correct | $correct |');
    buf.writeln('| Incorrect | ${total - correct} |');
    buf.writeln('| Accuracy | $accuracy% |');
    buf.writeln('| Average Time | ${avgTime}s |');
    buf.writeln('');

    buf.writeln('## By Difficulty');
    buf.writeln('');
    buf.writeln('| Difficulty | Correct | Total | Accuracy |');
    buf.writeln('|------------|---------|-------|----------|');
    final byDifficulty = <int, List<PracticeResult>>{};
    for (final r in results) {
      byDifficulty.putIfAbsent(r.difficulty, () => []).add(r);
    }
    final sortedDiffs = byDifficulty.keys.toList()..sort();
    for (final diff in sortedDiffs) {
      final diffResults = byDifficulty[diff]!;
      final dCorrect = diffResults.where((r) => r.isCorrect).length;
      final dAcc = (dCorrect / diffResults.length * 100).toStringAsFixed(1);
      buf.writeln('| $diff | $dCorrect | ${diffResults.length} | $dAcc% |');
    }

    return buf.toString();
  }
}