import 'package:flutter/material.dart';

/// Landscape and tablet-optimized layout helpers.

/// Two-column layout for tablet/landscape mode.
class TwoColumnLayout extends StatelessWidget {
  final Widget left;
  final Widget right;
  final double leftFlex;
  final double rightFlex;

  const TwoColumnLayout({
    super.key,
    required this.left,
    required this.right,
    this.leftFlex = 1,
    this.rightFlex = 1,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 600) {
          // Mobile: stack vertically
          return Column(
            children: [
              left,
              const Divider(height: 1),
              Expanded(child: right),
            ],
          );
        }
        // Tablet/landscape: side by side
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: leftFlex.toInt(), child: left),
            const VerticalDivider(width: 1),
            Expanded(flex: rightFlex.toInt(), child: right),
          ],
        );
      },
    );
  }
}

/// Adaptive scaffold that adjusts based on screen size.
class AdaptiveScaffold extends StatelessWidget {
  final String title;
  final List<Widget> actions;
  final Widget body;
  final Widget? drawer;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;

  const AdaptiveScaffold({
    super.key,
    required this.title,
    this.actions = const [],
    required this.body,
    this.drawer,
    this.bottomNavigationBar,
    this.floatingActionButton,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: actions,
      ),
      drawer: drawer,
      body: SafeArea(child: body),
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
    );
  }
}

/// Grid that adapts columns based on screen width.
class AdaptiveGrid extends StatelessWidget {
  final List<Widget> children;
  final double childAspectRatio;

  const AdaptiveGrid({
    super.key,
    required this.children,
    this.childAspectRatio = 1.0,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 900
            ? 4
            : constraints.maxWidth > 600
                ? 3
                : 2;

        return GridView.count(
          crossAxisCount: crossAxisCount,
          childAspectRatio: childAspectRatio,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          padding: const EdgeInsets.all(12),
          children: children,
        );
      },
    );
  }
}