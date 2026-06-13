import 'package:flutter/material.dart';

/// View for displaying and managing a weekly study plan.
class StudyPlanView extends StatefulWidget {
  const StudyPlanView({super.key});

  @override
  State<StudyPlanView> createState() => _StudyPlanViewState();
}

class _StudyPlanViewState extends State<StudyPlanView> {
  final List<StudyPlanItem> _planItems = [
    StudyPlanItem(day: 'Mon', topic: 'Kinematics', targetQuestions: 10, completedQuestions: 0, focusArea: 'Uniform Acceleration'),
    StudyPlanItem(day: 'Tue', topic: 'Dynamics', targetQuestions: 10, completedQuestions: 0, focusArea: "Newton's Laws"),
    StudyPlanItem(day: 'Wed', topic: 'Energy', targetQuestions: 8, completedQuestions: 0, focusArea: 'Conservation of Energy'),
    StudyPlanItem(day: 'Thu', topic: 'Momentum', targetQuestions: 10, completedQuestions: 0, focusArea: 'Impulse'),
    StudyPlanItem(day: 'Fri', topic: 'Waves', targetQuestions: 8, completedQuestions: 0, focusArea: 'Wave Properties'),
    StudyPlanItem(day: 'Sat', topic: 'Review', targetQuestions: 15, completedQuestions: 0, focusArea: 'Mixed Review'),
    StudyPlanItem(day: 'Sun', topic: 'Rest', targetQuestions: 0, completedQuestions: 0, focusArea: 'Optional Practice'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final today = DateTime.now().weekday;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Study Plan'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () {},
            tooltip: 'Customize plan',
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _planItems.length,
        itemBuilder: (context, index) {
          final item = _planItems[index];
          final isToday = _getWeekday(index) == today;
          final progress = item.targetQuestions > 0
              ? item.completedQuestions / item.targetQuestions
              : 0.0;

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            color: isToday
                ? theme.colorScheme.primaryContainer
                : null,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        item.day,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                          color: isToday ? theme.colorScheme.primary : null,
                        ),
                      ),
                      if (isToday) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Today',
                            style: TextStyle(
                              color: theme.colorScheme.onPrimary,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                      const Spacer(),
                      Text(
                        '${item.completedQuestions}/${item.targetQuestions}',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(item.topic, style: theme.textTheme.bodyLarge),
                  Text(
                    'Focus: ${item.focusArea}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 6,
                      backgroundColor: theme.colorScheme.surfaceContainerHighest,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  int _getWeekday(int index) {
    // Monday=1 in Dart, our Monday is index 0
    return ((index + 1 - 1) % 7) + 1;
  }
}

class StudyPlanItem {
  final String day;
  final String topic;
  final int targetQuestions;
  int completedQuestions;
  final String focusArea;

  StudyPlanItem({
    required this.day,
    required this.topic,
    required this.targetQuestions,
    required this.completedQuestions,
    required this.focusArea,
  });
}