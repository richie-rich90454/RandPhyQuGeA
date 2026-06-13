import 'package:flutter/material.dart';

class DifficultyBadge extends StatelessWidget {
  final int difficulty;
  final double size;

  const DifficultyBadge({super.key, required this.difficulty, this.size = 24});

  @override
  Widget build(BuildContext context) {
    final color = difficulty <= 3
        ? Colors.green
        : difficulty <= 6
            ? Colors.orange
            : Colors.red;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        'Lv.$difficulty',
        style: TextStyle(
          fontSize: size * 0.5,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }
}