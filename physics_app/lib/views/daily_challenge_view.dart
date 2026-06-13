import 'package:flutter/material.dart';
import '../services/daily_challenge_service.dart';

/// View for the daily challenge feature.
class DailyChallengeView extends StatefulWidget {
  const DailyChallengeView({super.key});

  @override
  State<DailyChallengeView> createState() => _DailyChallengeViewState();
}

class _DailyChallengeViewState extends State<DailyChallengeView> {
  late DailyChallenge _challenge;
  bool _completed = false;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _challenge = DailyChallengeService().getTodaysChallenge();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daily Challenge'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () {},
            tooltip: 'Challenge history',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header card
            Card(
              color: theme.colorScheme.primaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Icon(
                      Icons.emoji_events,
                      size: 64,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Challenge for ${_challenge.date}',
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _completed ? 'Completed!' : 'Ready for a challenge?',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Challenge details
            _buildDetailRow(
              theme,
              Icons.fitness_center,
              'Mode',
              _challenge.mode == 'focused' ? 'Focused Practice' : 'Mental Practice',
            ),
            _buildDetailRow(
              theme,
              Icons.trending_up,
              'Target Difficulty',
              'Level ${_challenge.targetDifficulty}',
            ),
            _buildDetailRow(
              theme,
              Icons.quiz,
              'Questions',
              '${_challenge.questionCount}',
            ),
            _buildDetailRow(
              theme,
              Icons.timer,
              'Time Limit',
              '${(_challenge.timeLimitSeconds / 60).toStringAsFixed(0)} minutes',
            ),
            _buildDetailRow(
              theme,
              Icons.stars,
              'XP Reward',
              '${_challenge.xpReward} XP',
            ),
            _buildDetailRow(
              theme,
              Icons.auto_awesome,
              'Bonus Challenge',
              _challenge.bonusChallenge,
              bonus: true,
            ),

            const SizedBox(height: 32),

            // Action button
            FilledButton.icon(
              onPressed: _completed ? null : () {
                setState(() => _started = true);
                // Navigate to practice mode with challenge params
              },
              icon: Icon(_started ? Icons.replay : Icons.play_arrow),
              label: Text(_completed
                  ? 'Already completed'
                  : _started
                      ? 'Try Again'
                      : 'Start Challenge'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),

            if (_completed) ...[
              const SizedBox(height: 16),
              Text(
                'Come back tomorrow for a new challenge!',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    ThemeData theme,
    IconData icon,
    String label,
    String value, {
    bool bonus = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: bonus ? Colors.amber : theme.colorScheme.primary),
          const SizedBox(width: 12),
          Text(label, style: theme.textTheme.bodyMedium),
          const Spacer(),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: bonus ? Colors.amber.shade700 : null,
            ),
          ),
        ],
      ),
    );
  }
}