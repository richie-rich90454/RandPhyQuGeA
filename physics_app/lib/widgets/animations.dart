import 'package:flutter/material.dart';

/// Reusable animated transition wrappers for route changes.
class AppTransitions {
  /// Slide + fade transition for page routes.
  static PageRouteBuilder slideTransition(Widget page) {
    return PageRouteBuilder(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.05, 0.0),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          )),
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
      },
    );
  }

  /// Scale transition for dialogs and modals.
  static PageRouteBuilder scaleTransition(Widget page) {
    return PageRouteBuilder(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return ScaleTransition(
          scale: Tween<double>(begin: 0.95, end: 1.0).animate(
            CurvedAnimation(parent: animation, curve: Curves.easeOutBack),
          ),
          child: FadeTransition(opacity: animation, child: child),
        );
      },
    );
  }
}

/// Animated container that pulses on state change.
class PulseWidget extends StatefulWidget {
  final Widget child;
  final bool pulse;
  final Color? pulseColor;

  const PulseWidget({
    super.key,
    required this.child,
    this.pulse = false,
    this.pulseColor,
  });

  @override
  State<PulseWidget> createState() => _PulseWidgetState();
}

class _PulseWidgetState extends State<PulseWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _animation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void didUpdateWidget(PulseWidget old) {
    super.didUpdateWidget(old);
    if (widget.pulse && !old.pulse) {
      _controller.repeat(reverse: true);
    } else if (!widget.pulse && old.pulse) {
      _controller.stop();
      _controller.reset();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.pulse) {
      return widget.child;
    }

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) => Transform.scale(
        scale: _animation.value,
        child: child,
      ),
      child: widget.child,
    );
  }
}

/// Animated checkmark for correct answers.
class CorrectAnswerAnimation extends StatefulWidget {
  final bool show;

  const CorrectAnswerAnimation({super.key, this.show = false});

  @override
  State<CorrectAnswerAnimation> createState() => _CorrectAnswerAnimationState();
}

class _CorrectAnswerAnimationState extends State<CorrectAnswerAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.elasticOut);
  }

  @override
  void didUpdateWidget(CorrectAnswerAnimation old) {
    super.didUpdateWidget(old);
    if (widget.show && !old.show) {
      _controller.forward(from: 0);
    } else if (!widget.show && old.show) {
      _controller.reset();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _animation,
      child: Icon(
        Icons.check_circle,
        color: Colors.green.shade600,
        size: 64,
      ),
    );
  }
}