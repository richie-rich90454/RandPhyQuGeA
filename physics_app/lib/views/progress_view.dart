import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/settings_provider.dart';
import '../models/models.dart';

class ProgressView extends StatefulWidget {
  const ProgressView({super.key});

  @override
  State<ProgressView> createState() => _ProgressViewState();
}

class _ProgressViewState extends State<ProgressView> {
  List<PracticeResult> _results = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadResults();
  }

  Future<void> _loadResults() async {
    final settings = context.read<SettingsProvider>();
    final results = await settings.loadPracticeResults();
    setState(() {
      _results = results.reversed.toList();
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Progress')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final correct = _results.where((r) => r.isCorrect).length;
    final total = _results.length;
    final accuracy = total > 0 ? (correct / total * 100).round() : 0;
    final totalTime = _results.fold<int>(0, (sum, r) => sum + r.timeTakenMs);
    final mentalResults = _results.where((r) => r.mode == 'Mental').length;
    final focusedResults = _results.where((r) => r.mode == 'Focused').length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress'),
        actions: [
          if (_results.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: _clearResults,
            ),
        ],
      ),
      body: _results.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.trending_up, size: 80, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No practice results yet.\nStart a practice session!'),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Text('$accuracy%',
                              style: TextStyle(
                                fontSize: 48,
                                fontWeight: FontWeight.bold,
                                color: accuracy >= 80
                                    ? Colors.green
                                    : accuracy >= 50
                                        ? Colors.orange
                                        : Colors.red,
                              )),
                          Text('Overall Accuracy', style: Theme.of(context).textTheme.titleSmall),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildStat(context, '$_results', 'Total Questions'),
                              _buildStat(context, '$correct', 'Correct'),
                              _buildStat(context, '${_results.length - correct}', 'Incorrect'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildStat(context, '$focusedResults', 'Focused'),
                              _buildStat(context, '$mentalResults', 'Mental'),
                              _buildStat(context, '${totalTime ~/ 1000}s', 'Total Time'),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('Recent Results', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  ..._results.take(50).map((r) => Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: r.isCorrect ? Colors.green : Colors.red,
                            radius: 16,
                            child: Icon(
                              r.isCorrect ? Icons.check : Icons.close,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                          title: Text(
                            '${r.mode} | Difficulty ${r.difficulty}',
                            style: const TextStyle(fontSize: 14),
                          ),
                          subtitle: Text(
                            'Answer: ${r.userAnswer} | ${r.timeTakenMs}ms',
                            style: const TextStyle(fontSize: 12),
                          ),
                          trailing: Text(
                            _formatDate(r.timestamp),
                            style: const TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                        ),
                      )),
                ],
              ),
            ),
    );
  }

  Widget _buildStat(BuildContext context, String value, String label) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.month}/${dt.day} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }

  Future<void> _clearResults() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Results'),
        content: const Text('Delete all practice results?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );

    if (confirmed == true) {
      final settings = context.read<SettingsProvider>();
      await settings.savePracticeResults([]);
      _loadResults();
    }
  }
}