import 'package:flutter/material.dart';

/// A widget for selecting a difficulty range using a double-sided slider.
///
/// Displays difficulty labels and colors, and supports
/// selecting both min and max difficulty levels.
class DifficultyRangeSlider extends StatefulWidget {
  final int minDifficulty;
  final int maxDifficulty;
  final RangeValues initialValues;
  final ValueChanged<RangeValues>? onChanged;

  const DifficultyRangeSlider({
    super.key,
    this.minDifficulty = 1,
    this.maxDifficulty = 7,
    this.initialValues = const RangeValues(1, 7),
    this.onChanged,
  });

  @override
  State<DifficultyRangeSlider> createState() => _DifficultyRangeSliderState();
}

class _DifficultyRangeSliderState extends State<DifficultyRangeSlider> {
  late RangeValues _values;

  static const List<String> _labels = [
    'Very Easy',
    'Easy',
    'Moderate',
    'Challenging',
    'Hard',
    'Very Hard',
    'Expert',
  ];

  static const List<Color> _colors = [
    Color(0xFF4CAF50),
    Color(0xFF8BC34A),
    Color(0xFFFFC107),
    Color(0xFFFF9800),
    Color(0xFFF44336),
    Color(0xFF9C27B0),
    Color(0xFF000000),
  ];

  @override
  void initState() {
    super.initState();
    _values = widget.initialValues;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Labels
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Difficulty Range',
              style: theme.textTheme.titleSmall,
            ),
            Text(
              '${_labels[_values.start.toInt() - 1]} - ${_labels[_values.end.toInt() - 1]}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),

        // Slider
        RangeSlider(
          values: _values,
          min: widget.minDifficulty.toDouble(),
          max: widget.maxDifficulty.toDouble(),
          divisions: widget.maxDifficulty - widget.minDifficulty,
          labels: RangeLabels(
            _labels[_values.start.toInt() - 1],
            _labels[_values.end.toInt() - 1],
          ),
          activeColor: _getColorForValue(_values.start),
          inactiveColor: Colors.grey.shade300,
          onChanged: (values) {
            setState(() => _values = values);
            widget.onChanged?.call(values);
          },
        ),

        // Difficulty indicators
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(
            _labels.length,
            (index) {
              final level = index + 1;
              final isInRange = level >= _values.start.toInt() &&
                  level <= _values.end.toInt();
              return Column(
                children: [
                  Icon(
                    Icons.circle,
                    size: isInRange ? 12 : 8,
                    color: isInRange
                        ? _colors[index]
                        : Colors.grey.shade300,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$level',
                    style: TextStyle(
                      fontSize: 10,
                      color: isInRange
                          ? _colors[index]
                          : Colors.grey.shade400,
                      fontWeight:
                          isInRange ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  Color _getColorForValue(double value) {
    final index = (value.toInt() - 1).clamp(0, _colors.length - 1);
    return _colors[index];
  }
}