import 'package:flutter/material.dart';

class AccuracyChart extends StatelessWidget {
  final double accuracy;
  final double size;

  const AccuracyChart({
    super.key,
    required this.accuracy,
    this.size = 120,
  });

  @override
  Widget build(BuildContext context) {
    final color = accuracy >= 80
        ? Colors.green
        : accuracy >= 50
            ? Colors.orange
            : Colors.red;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              value: accuracy / 100,
              strokeWidth: 10,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${accuracy.round()}%',
                style: TextStyle(
                  fontSize: size * 0.22,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                'Accuracy',
                style: TextStyle(
                  fontSize: size * 0.1,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}