import 'package:flutter/material.dart';

class StreakDisplay extends StatelessWidget {
  final int currentStreak;
  final int bestStreak;
  final int totalDays;

  const StreakDisplay({
    super.key,
    required this.currentStreak,
    required this.bestStreak,
    required this.totalDays,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildStreakItem(
              context,
              icon: Icons.local_fire_department,
              value: '$currentStreak',
              label: 'Current Streak',
              color: Colors.orange,
            ),
            _buildStreakItem(
              context,
              icon: Icons.emoji_events,
              value: '$bestStreak',
              label: 'Best Streak',
              color: Colors.amber,
            ),
            _buildStreakItem(
              context,
              icon: Icons.calendar_today,
              value: '$totalDays',
              label: 'Total Days',
              color: Colors.blue,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStreakItem(
    BuildContext context, {
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}