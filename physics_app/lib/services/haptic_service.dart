import 'package:flutter/services.dart';

/// Service for providing haptic feedback on user interactions.
///
/// Wraps Flutter's HapticFeedback with semantic method names
/// for different interaction contexts.
class HapticService {
  static final HapticService _instance = HapticService._();
  factory HapticService() => _instance;
  HapticService._();

  bool _enabled = true;

  bool get isEnabled => _enabled;

  void setEnabled(bool enabled) {
    _enabled = enabled;
  }

  /// Light feedback for button presses.
  void lightTap() {
    if (!_enabled) return;
    HapticFeedback.lightImpact();
  }

  /// Medium feedback for selections.
  void mediumTap() {
    if (!_enabled) return;
    HapticFeedback.mediumImpact();
  }

  /// Heavy feedback for significant actions.
  void heavyTap() {
    if (!_enabled) return;
    HapticFeedback.heavyImpact();
  }

  /// Subtle click for toggles.
  void selectionClick() {
    if (!_enabled) return;
    HapticFeedback.selectionClick();
  }

  /// Feedback for correct answer.
  void correctAnswer() {
    if (!_enabled) return;
    HapticFeedback.mediumImpact();
  }

  /// Feedback for incorrect answer.
  void incorrectAnswer() {
    if (!_enabled) return;
    HapticFeedback.heavyImpact();
  }

  /// Feedback for timer warning.
  void timerWarning() {
    if (!_enabled) return;
    HapticFeedback.lightImpact();
  }
}