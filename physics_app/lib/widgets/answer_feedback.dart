import 'package:flutter/material.dart';

class AnswerFeedback extends StatelessWidget {
  final bool isCorrect;
  final String correctAnswer;
  final String userAnswer;
  final String? solutionText;
  final VoidCallback onNext;
  final bool isLastQuestion;

  const AnswerFeedback({
    super.key,
    required this.isCorrect,
    required this.correctAnswer,
    required this.userAnswer,
    this.solutionText,
    required this.onNext,
    required this.isLastQuestion,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: isCorrect ? Colors.green.shade50 : Colors.red.shade50,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(
                  isCorrect ? Icons.check_circle : Icons.cancel,
                  color: isCorrect ? Colors.green : Colors.red,
                  size: 28,
                ),
                const SizedBox(width: 8),
                Text(
                  isCorrect ? 'Correct!' : 'Incorrect',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isCorrect ? Colors.green : Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _infoRow('Your answer:', userAnswer),
            if (!isCorrect) ...[
              const SizedBox(height: 4),
              _infoRow('Correct answer:', correctAnswer),
            ],
            if (solutionText != null) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              Text(
                solutionText!,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onNext,
              child: Text(isLastQuestion ? 'View Summary' : 'Next Question'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label ', style: const TextStyle(fontWeight: FontWeight.bold)),
        Expanded(child: Text(value)),
      ],
    );
  }
}