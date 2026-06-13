import 'package:flutter/material.dart';

/// Animated shimmer loading skeleton for placeholder content.
class LoadingSkeleton extends StatefulWidget {
  final int itemCount;
  final double itemHeight;
  final double spacing;
  final EdgeInsets padding;

  const LoadingSkeleton({
    super.key,
    this.itemCount = 3,
    this.itemHeight = 80,
    this.spacing = 12,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  State<LoadingSkeleton> createState() => _LoadingSkeletonState();
}

class _LoadingSkeletonState extends State<LoadingSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final baseColor = theme.brightness == Brightness.dark
        ? Colors.grey[800]!
        : Colors.grey[200]!;
    final highlightColor = theme.brightness == Brightness.dark
        ? Colors.grey[700]!
        : Colors.grey[100]!;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Padding(
          padding: widget.padding,
          child: Column(
            children: List.generate(widget.itemCount, (index) {
              return Padding(
                padding: EdgeInsets.only(bottom: widget.spacing),
                child: Container(
                  height: widget.itemHeight,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        baseColor,
                        Color.lerp(baseColor, highlightColor, _controller.value)!,
                        baseColor,
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        );
      },
    );
  }
}

/// Loading state wrapper with skeleton or spinner options.
class LoadingState extends StatelessWidget {
  final bool useSkeleton;
  final String? message;

  const LoadingState({
    super.key,
    this.useSkeleton = false,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    if (useSkeleton) {
      return const Column(
        children: [
          LoadingSkeleton(),
          LoadingSkeleton(itemCount: 2),
        ],
      );
    }

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
            ),
          ],
        ],
      ),
    );
  }
}