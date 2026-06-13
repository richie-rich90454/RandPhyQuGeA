import 'package:flutter/material.dart';

/// View for displaying user achievements with progress tracking.
class AchievementsView extends StatelessWidget {
  const AchievementsView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Achievements'),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () => _showInfo(context),
            tooltip: 'About achievements',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildAchievementCard(
            context,
            theme,
            icon: Icons.play_circle,
            title: 'First Steps',
            description: 'Complete your first practice session',
            progress: 0.75,
            current: 3,
            target: 4,
            tier: 2,
            color: Colors.blue,
          ),
          _buildAchievementCard(
            context,
            theme,
            icon: Icons.star,
            title: 'Perfect Score',
            description: 'Get 100% accuracy in a practice session',
            progress: 0.4,
            current: 2,
            target: 5,
            tier: 1,
            color: Colors.amber,
          ),
          _buildAchievementCard(
            context,
            theme,
            icon: Icons.speed,
            title: 'Speed Demon',
            description: 'Answer correctly in under 5 seconds',
            progress: 0.6,
            current: 15,
            target: 25,
            tier: 1,
            color: Colors.red,
          ),
          _buildAchievementCard(
            context,
            theme,
            icon: Icons.local_fire_department,
            title: 'Consistent Learner',
            description: 'Practice for consecutive days',
            progress: 0.3,
            current: 2,
            target: 7,
            tier: 0,
            color: Colors.deepOrange,
          ),
          _buildAchievementCard(
            context,
            theme,
            icon: Icons.psychology,
            title: 'Question Master',
            description: 'Generate questions across all topics',
            progress: 0.5,
            current: 25,
            target: 50,
            tier: 1,
            color: Colors.purple,
          ),
          _buildAchievementCard(
            context,
            theme,
            icon: Icons.trending_up,
            title: 'Difficulty Climber',
            description: 'Complete sessions at difficulty 5+',
            progress: 0.2,
            current: 2,
            target: 10,
            tier: 0,
            color: Colors.teal,
          ),
        ],
      ),
    );
  }

  Widget _buildAchievementCard(
    BuildContext context,
    ThemeData theme, {
    required IconData icon,
    required String title,
    required String description,
    required double progress,
    required int current,
    required int target,
    required int tier,
    required Color color,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 48,
                  height: 48,
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 3,
                    color: color,
                    backgroundColor: color.withValues(alpha: 0.2),
                  ),
                ),
                Icon(icon, color: color, size: 24),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(title, style: theme.textTheme.titleSmall),
                      const SizedBox(width: 8),
                      if (tier > 0)
                        ...List.generate(tier, (_) => Padding(
                          padding: const EdgeInsets.only(right: 2),
                          child: Icon(Icons.star, size: 14, color: Colors.amber.shade600),
                        )),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(description, style: theme.textTheme.bodySmall),
                  const SizedBox(height: 4),
                  Text(
                    '$current / $target',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About Achievements'),
        content: const Text(
          'Achievements track your progress as you practice physics. '
          'Each achievement has 4 tiers unlocked by reaching milestones. '
          'Keep practicing to earn stars and unlock all tiers!',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }
}