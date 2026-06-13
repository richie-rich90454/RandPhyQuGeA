import 'package:flutter/material.dart';

/// A promotional banner that can be shown at the top of views
/// to highlight new features, tips, or achievements.
///
/// Supports different styles: info, success, warning, and achievement.
class PromoBanner extends StatefulWidget {
  final String message;
  final PromoBannerStyle style;
  final IconData? icon;
  final VoidCallback? onTap;
  final VoidCallback? onDismiss;
  final bool dismissible;

  const PromoBanner({
    super.key,
    required this.message,
    this.style = PromoBannerStyle.info,
    this.icon,
    this.onTap,
    this.onDismiss,
    this.dismissible = true,
  });

  @override
  State<PromoBanner> createState() => _PromoBannerState();
}

class _PromoBannerState extends State<PromoBanner> {
  bool _dismissed = false;

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    final (bgColor, fgColor, defaultIcon) = _getColors();
    final icon = widget.icon ?? defaultIcon;

    return Material(
      child: InkWell(
        onTap: widget.onTap,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          color: bgColor,
          child: Row(
            children: [
              Icon(icon, color: fgColor, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  widget.message,
                  style: TextStyle(
                    color: fgColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (widget.dismissible)
                InkWell(
                  onTap: () {
                    setState(() => _dismissed = true);
                    widget.onDismiss?.call();
                  },
                  child: Icon(Icons.close, color: fgColor, size: 18),
                ),
            ],
          ),
        ),
      ),
    );
  }

  (Color, Color, IconData) _getColors() {
    switch (widget.style) {
      case PromoBannerStyle.info:
        return (
          Colors.blue.shade50,
          Colors.blue.shade700,
          Icons.info_outline,
        );
      case PromoBannerStyle.success:
        return (
          Colors.green.shade50,
          Colors.green.shade700,
          Icons.check_circle_outline,
        );
      case PromoBannerStyle.warning:
        return (
          Colors.orange.shade50,
          Colors.orange.shade700,
          Icons.warning_amber_outlined,
        );
      case PromoBannerStyle.achievement:
        return (
          Colors.purple.shade50,
          Colors.purple.shade700,
          Icons.emoji_events,
        );
    }
  }
}

enum PromoBannerStyle {
  info,
  success,
  warning,
  achievement,
}