import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/settings_provider.dart';
import '../models/models.dart';

class SessionSummaryView extends StatelessWidget {
  final List<PracticeResult> results;

  const SessionSummaryView({super.key, required this.results});

  @override
  Widget build(BuildContext context) {
    final correct = results.where((r) => r.isCorrect).length;
    final total = results.length;
    final accuracy = total > 0 ? (correct / total * 100).round() : 0;
    final totalTime = results.fold<int>(0, (sum, r) => sum + r.timeTakenMs);
    final avgTime = total > 0 ? totalTime ~/ total : 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Session Summary'),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text(
                      '$accuracy%',
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: accuracy >= 80 ? Colors.green : accuracy >= 50 ? Colors.orange : Colors.red,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('Accuracy', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStat(context, '$correct / $total', 'Correct'),
                        _buildStat(context, '${avgTime}ms', 'Avg Time'),
                        _buildStat(context, '${results.first.mode}', 'Mode'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text('Results', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ...results.asMap().entries.map((entry) {
              final i = entry.key;
              final r = entry.value;
              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: r.isCorrect ? Colors.green : Colors.red,
                    child: Icon(
                      r.isCorrect ? Icons.check : Icons.close,
                      color: Colors.white,
                    ),
                  ),
                  title: Text('Question ${i + 1} (Difficulty ${r.difficulty})'),
                  subtitle: Text('Your answer: ${r.userAnswer} | ${r.timeTakenMs}ms'),
                ),
              );
            }),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Back to Menu'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(BuildContext context, String value, String label) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.titleLarge),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}