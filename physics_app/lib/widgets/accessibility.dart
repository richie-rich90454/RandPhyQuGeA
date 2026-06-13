import 'package:flutter/material.dart';

/// Accessibility helpers for consistent screen reader support.
class AccessibilityHelper {
  /// Merge multiple semantics into one label.
  static String mergeLabels(List<String?> labels) {
    return labels.where((l) => l != null && l.isNotEmpty).join(', ');
  }

  /// Create a semantics label for a difficulty level.
  static String difficultyLabel(int difficulty) {
    const labels = [
      'Very Easy',
      'Easy',
      'Moderate',
      'Medium',
      'Challenging',
      'Hard',
      'Very Hard',
    ];
    if (difficulty >= 1 && difficulty <= 7) {
      return 'Difficulty ${labels[difficulty - 1]}, level $difficulty of 7';
    }
    return 'Difficulty $difficulty';
  }

  /// Create a semantics label for a practice score.
  static String scoreLabel(int correct, int total, String mode) {
    final percentage = total > 0 ? (correct * 100 / total).round() : 0;
    return '$correct of $total correct, $percentage percent accuracy in $mode mode';
  }

  /// Create a semantics label for a timer.
  static String timerLabel(int secondsRemaining) {
    final minutes = secondsRemaining ~/ 60;
    final seconds = secondsRemaining % 60;
    if (minutes > 0) {
      return '$minutes minutes and $seconds seconds remaining';
    }
    return '$seconds seconds remaining';
  }

  /// Create a semantics label for a question number.
  static String questionNumberLabel(int current, int total) {
    return 'Question $current of $total';
  }
}

/// A widget that adds consistent accessibility semantics.
class AccessibleWidget extends StatelessWidget {
  final Widget child;
  final String? label;
  final String? hint;
  final bool excludeSemantics;
  final bool isButton;
  final bool isHeader;

  const AccessibleWidget({
    super.key,
    required this.child,
    this.label,
    this.hint,
    this.excludeSemantics = false,
    this.isButton = false,
    this.isHeader = false,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      hint: hint,
      button: isButton,
      header: isHeader,
      excludeSemantics: excludeSemantics,
      child: child,
    );
  }
}

/// Responsive layout helper.
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
  });

  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < 600;

  static bool isTablet(BuildContext context) =>
      MediaQuery.of(context).size.width >= 600 &&
      MediaQuery.of(context).size.width < 1200;

  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= 1200;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 1200 && desktop != null) {
          return desktop!;
        }
        if (constraints.maxWidth >= 600 && tablet != null) {
          return tablet!;
        }
        return mobile;
      },
    );
  }
}