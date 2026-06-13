import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

/// Displays a rotating set of tips during loading or idle states.
///
/// Shows physics-related tips, study advice, and app usage hints
/// that cycle automatically with a fade transition.
class TipsDisplay extends StatefulWidget {
  /// Custom tips to display (overrides default tips).
  final List<String>? tips;

  /// Duration between tip transitions.
  final Duration interval;

  /// Whether to show random tips or cycle sequentially.
  final bool random;

  const TipsDisplay({
    super.key,
    this.tips,
    this.interval = const Duration(seconds: 5),
    this.random = true,
  });

  @override
  State<TipsDisplay> createState() => _TipsDisplayState();
}

class _TipsDisplayState extends State<TipsDisplay>
    with SingleTickerProviderStateMixin {
  late List<String> _tips;
  int _currentIndex = 0;
  Timer? _timer;
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  final _random = Random();

  static const List<String> _defaultTips = [
    'Practice consistently for the best results.',
    'Use mental practice mode to improve calculation speed.',
    'Focused practice lets you target specific topics and skills.',
    'Review incorrect answers to learn from mistakes.',
    'Try increasing difficulty gradually as you improve.',
    'Export your questions to PDF for offline practice.',
    'Bookmark difficult questions to revisit them later.',
    'Track your streaks to stay motivated.',
    'Use the question bank to browse all available templates.',
    'Short, frequent practice sessions are more effective than long, rare ones.',
    'The timer in mental practice helps build exam confidence.',
    'You can filter questions by topic, skill, difficulty, and type.',
    'Check your progress view to see improvement over time.',
    'Dark mode is easier on the eyes during night study sessions.',
    'Physics formulas are easier to remember with regular practice.',
  ];

  @override
  void initState() {
    super.initState();
    _tips = widget.tips ?? _defaultTips;
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeIn),
    );
    _fadeController.forward();
    _startCycling();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _fadeController.dispose();
    super.dispose();
  }

  void _startCycling() {
    _timer = Timer.periodic(widget.interval, (_) {
      _fadeController.reverse().then((_) {
        setState(() {
          if (widget.random) {
            var next = _random.nextInt(_tips.length);
            while (next == _currentIndex && _tips.length > 1) {
              next = _random.nextInt(_tips.length);
            }
            _currentIndex = next;
          } else {
            _currentIndex = (_currentIndex + 1) % _tips.length;
          }
        });
        _fadeController.forward();
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.lightbulb_outline,
                size: 48,
                color: Colors.amber.shade300,
              ),
              const SizedBox(height: 16),
              Text(
                'Did you know?',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade600,
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                _tips[_currentIndex],
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey.shade700,
                      height: 1.5,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(
                  _tips.length,
                  (index) => Container(
                    width: 6,
                    height: 6,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: index == _currentIndex
                          ? Theme.of(context).colorScheme.primary
                          : Colors.grey.shade300,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}