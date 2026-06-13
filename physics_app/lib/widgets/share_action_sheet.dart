import 'package:flutter/material.dart';
import '../services/share_service.dart';

/// Bottom sheet with share actions for a question.
class ShareActionSheet extends StatelessWidget {
  final String questionText;
  final String answer;
  final String? solution;
  final String? topic;

  const ShareActionSheet({
    super.key,
    required this.questionText,
    required this.answer,
    this.solution,
    this.topic,
  });

  static void show(
    BuildContext context, {
    required String questionText,
    required String answer,
    String? solution,
    String? topic,
  }) {
    showModalBottomSheet(
      context: context,
      builder: (_) => ShareActionSheet(
        questionText: questionText,
        answer: answer,
        solution: solution,
        topic: topic,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Text('Share Question', style: theme.textTheme.titleMedium),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share Question'),
              subtitle: const Text('Share question text and answer'),
              onTap: () {
                Navigator.pop(context);
                ShareService().shareQuestion(
                  questionText: questionText,
                  answer: answer,
                  solution: solution,
                  topic: topic,
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.copy),
              title: const Text('Copy to Clipboard'),
              subtitle: const Text('Copy question and answer'),
              onTap: () {
                Navigator.pop(context);
                // Clipboard functionality
              },
            ),
            ListTile(
              leading: const Icon(Icons.push_pin),
              title: const Text('Pin Question'),
              subtitle: const Text('Save for later review'),
              onTap: () {
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }
}