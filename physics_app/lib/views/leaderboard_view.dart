import 'package:flutter/material.dart';
import '../services/leaderboard_service.dart';

/// View for the local leaderboard.
class LeaderboardView extends StatefulWidget {
  const LeaderboardView({super.key});

  @override
  State<LeaderboardView> createState() => _LeaderboardViewState();
}

class _LeaderboardViewState extends State<LeaderboardView> {
  List<LeaderboardEntry> _entries = [];
  LeaderboardStats? _stats;
  String _selectedMode = 'all';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final service = LeaderboardService();
    final entries = await service.getEntries(
      mode: _selectedMode == 'all' ? null : _selectedMode,
    );
    final stats = await service.getStats();
    if (mounted) {
      setState(() {
        _entries = entries;
        _stats = stats;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Clear leaderboard?'),
                  content: const Text('This will remove all leaderboard entries.'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                    TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Clear')),
                  ],
                ),
              );
              if (confirmed == true) {
                await LeaderboardService().clearAll();
                _loadData();
              }
            },
            tooltip: 'Clear all',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Mode filter
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'all', label: Text('All')),
                      ButtonSegment(value: 'focused', label: Text('Focused')),
                      ButtonSegment(value: 'mental', label: Text('Mental')),
                    ],
                    selected: {_selectedMode},
                    onSelectionChanged: (selection) {
                      setState(() {
                        _selectedMode = selection.first;
                        _loading = true;
                      });
                      _loadData();
                    },
                  ),
                ),

                // Stats summary
                if (_stats != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStat(theme, 'Total', '${_stats!.totalEntries}'),
                            _buildStat(theme, 'Best Score', '${_stats!.bestScore}'),
                            _buildStat(theme, 'Best Acc.', '${(_stats!.bestAccuracy * 100).round()}%'),
                          ],
                        ),
                      ),
                    ),
                  ),

                const SizedBox(height: 8),

                // Entry list
                Expanded(
                  child: _entries.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.leaderboard, size: 64,
                                  color: theme.colorScheme.onSurface.withValues(alpha: 0.3)),
                              const SizedBox(height: 16),
                              Text('No entries yet',
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                                  )),
                              const SizedBox(height: 8),
                              Text('Complete practice sessions to appear here',
                                  style: theme.textTheme.bodySmall),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _entries.length,
                          itemBuilder: (context, index) {
                            final entry = _entries[index];
                            return _buildEntryCard(theme, entry, index + 1);
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildStat(ThemeData theme, String label, String value) {
    return Column(
      children: [
        Text(value, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        Text(label, style: theme.textTheme.bodySmall),
      ],
    );
  }

  Widget _buildEntryCard(ThemeData theme, LeaderboardEntry entry, int rank) {
    final accuracy = (entry.accuracy * 100).round();
    final medalColor = rank == 1
        ? Colors.amber
        : rank == 2
            ? Colors.grey.shade400
            : rank == 3
                ? Colors.brown.shade300
                : null;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Rank
            SizedBox(
              width: 32,
              child: medalColor != null
                  ? Icon(Icons.emoji_events, color: medalColor, size: 24)
                  : Text(
                      '$rank',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.titleMedium,
                    ),
            ),
            const SizedBox(width: 12),
            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${entry.mode == 'focused' ? 'Focused' : 'Mental'} - Difficulty ${entry.difficulty}',
                    style: theme.textTheme.titleSmall,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${entry.questionsAnswered} questions, ${entry.correct} correct',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            // Score + accuracy
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${entry.score} pts',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.primary,
                  ),
                ),
                Text(
                  '$accuracy%',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: accuracy >= 80
                        ? Colors.green
                        : accuracy >= 60
                            ? Colors.orange
                            : Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}