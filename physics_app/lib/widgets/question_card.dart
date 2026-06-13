import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

class QuestionCard extends StatelessWidget {
  final String text;
  final int? questionNumber;

  const QuestionCard({super.key, required this.text, this.questionNumber});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (questionNumber != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  'Question $questionNumber',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
              ),
            Math.tex(
              text,
              mathStyle: MathStyle.display,
              textStyle: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}