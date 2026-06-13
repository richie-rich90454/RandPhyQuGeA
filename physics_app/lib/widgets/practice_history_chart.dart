import 'package:flutter/material.dart';
import '../models/models.dart';

class PracticeHistoryChart extends StatelessWidget {
  final List<PracticeResult> results;
  final int maxBars;

  const PracticeHistoryChart({
    super.key,
    required this.results,
    this.maxBars = 10,
  });

  @override
  Widget build(BuildContext context) {
    if (results.isEmpty) {
      return const SizedBox(
        height: 200,
        child: Center(child: Text('No data yet')),
      );
    }

    final recent = results.reversed.take(maxBars).toList().reversed.toList();
    final maxValue = recent
        .map((r) => r.timeTakenMs.toDouble())
        .reduce((a, b) => a > b ? a : b);

    return SizedBox(
      height: 200,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: recent.map((r) {
          final height = maxValue > 0
              ? (r.timeTakenMs / maxValue * 150).clamp(10.0, 150.0)
              : 10.0;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    height: height,
                    decoration: BoxDecoration(
                      color: r.isCorrect ? Colors.green : Colors.red,
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  FittedBox(
                    child: Text(
                      '${r.timeTakenMs ~/ 1000}s',
                      style: const TextStyle(fontSize: 10),
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}