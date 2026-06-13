import 'dart:async';
import 'package:flutter/material.dart';

/// A widget that displays a countdown timer for timed practice sessions.
///
/// Supports configurable duration, pause/resume, and visual/auditory
/// warnings when time is running low.
class PracticeTimer extends StatefulWidget {
  /// Total duration in seconds.
  final int totalSeconds;

  /// Called when the timer reaches zero.
  final VoidCallback? onTimeUp;

  /// Called when the timer ticks (each second).
  final ValueChanged<int>? onTick;

  /// Whether the timer should auto-start.
  final bool autoStart;

  /// Color for normal time display.
  final Color normalColor;

  /// Color for warning time display (< 30 seconds).
  final Color warningColor;

  /// Color for critical time display (< 10 seconds).
  final Color criticalColor;

  const PracticeTimer({
    super.key,
    required this.totalSeconds,
    this.onTimeUp,
    this.onTick,
    this.autoStart = false,
    this.normalColor = Colors.blue,
    this.warningColor = Colors.orange,
    this.criticalColor = Colors.red,
  });

  @override
  State<PracticeTimer> createState() => _PracticeTimerState();
}

class _PracticeTimerState extends State<PracticeTimer>
    with SingleTickerProviderStateMixin {
  late int _remainingSeconds;
  Timer? _timer;
  bool _isRunning = false;
  bool _isPaused = false;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.totalSeconds;
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    if (widget.autoStart) {
      start();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void start() {
    if (_isRunning) return;
    setState(() {
      _isRunning = true;
      _isPaused = false;
    });
    _startTicking();
    if (_remainingSeconds <= 10) {
      _pulseController.repeat(reverse: true);
    }
  }

  void pause() {
    _timer?.cancel();
    _pulseController.stop();
    setState(() {
      _isPaused = true;
    });
  }

  void resume() {
    setState(() {
      _isPaused = false;
    });
    _startTicking();
    if (_remainingSeconds <= 10) {
      _pulseController.repeat(reverse: true);
    }
  }

  void reset() {
    _timer?.cancel();
    _pulseController.stop();
    _pulseController.reset();
    setState(() {
      _remainingSeconds = widget.totalSeconds;
      _isRunning = false;
      _isPaused = false;
    });
  }

  void addTime(int seconds) {
    setState(() {
      _remainingSeconds += seconds;
    });
    if (_remainingSeconds > 10) {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  void _startTicking() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_remainingSeconds <= 0) {
        _timer?.cancel();
        _pulseController.stop();
        widget.onTimeUp?.call();
        return;
      }
      setState(() {
        _remainingSeconds--;
      });
      widget.onTick?.call(_remainingSeconds);

      if (_remainingSeconds <= 10) {
        _pulseController.repeat(reverse: true);
      }
    });
  }

  int get remainingSeconds => _remainingSeconds;
  bool get isRunning => _isRunning;
  bool get isPaused => _isPaused;

  Color _getTimerColor() {
    if (_remainingSeconds <= 10) return widget.criticalColor;
    if (_remainingSeconds <= 30) return widget.warningColor;
    return widget.normalColor;
  }

  String _formatTime(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  double _progressFraction() {
    if (widget.totalSeconds == 0) return 0;
    return _remainingSeconds / widget.totalSeconds;
  }

  @override
  Widget build(BuildContext context) {
    final color = _getTimerColor();
    final isLow = _remainingSeconds <= 10;

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Circular progress indicator
            SizedBox(
              width: 48,
              height: 48,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: _progressFraction(),
                    strokeWidth: 4,
                    backgroundColor: color.withAlpha(40),
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                  Icon(
                    Icons.timer,
                    size: 22,
                    color: color,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Time display with pulse animation for low time
            AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: isLow ? _pulseAnimation.value : 1.0,
                  child: Text(
                    _formatTime(_remainingSeconds),
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: color,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                );
              },
            ),

            const SizedBox(width: 8),

            // Control buttons
            if (!_isRunning)
              IconButton(
                icon: const Icon(Icons.play_arrow),
                tooltip: 'Start Timer',
                color: Colors.green,
                onPressed: start,
              )
            else if (_isPaused)
              IconButton(
                icon: const Icon(Icons.play_arrow),
                tooltip: 'Resume',
                color: Colors.green,
                onPressed: resume,
              )
            else
              IconButton(
                icon: const Icon(Icons.pause),
                tooltip: 'Pause',
                color: Colors.orange,
                onPressed: pause,
              ),

            if (_isRunning)
              IconButton(
                icon: const Icon(Icons.restore),
                tooltip: 'Reset',
                color: Colors.grey,
                onPressed: reset,
              ),
          ],
        ),
      ),
    );
  }
}