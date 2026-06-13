import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physics_app/widgets/error_view.dart';
import 'package:physics_app/widgets/empty_state.dart';
import 'package:physics_app/widgets/confirmation_dialog.dart';
import 'package:physics_app/widgets/streak_display.dart';
import 'package:physics_app/widgets/difficulty_badge.dart';
import 'package:physics_app/widgets/stat_card.dart';
import 'package:physics_app/widgets/loading_overlay.dart';
import 'package:physics_app/widgets/promo_banner.dart';

void main() {
  group('ErrorView', () {
    testWidgets('displays error message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorView(message: 'Something went wrong'),
          ),
        ),
      );

      expect(find.text('Something went wrong'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('shows retry button when callback provided', (tester) async {
      var retried = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorView(
              message: 'Error',
              onRetry: () => retried = true,
            ),
          ),
        ),
      );

      expect(find.text('Retry'), findsOneWidget);
      await tester.tap(find.text('Retry'));
      expect(retried, isTrue);
    });

    testWidgets('no retry button when callback is null', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ErrorView(message: 'Error'),
          ),
        ),
      );

      expect(find.text('Retry'), findsNothing);
    });
  });

  group('EmptyState', () {
    testWidgets('displays empty state message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyState(
              icon: Icons.inbox,
              title: 'No Data',
              subtitle: 'Nothing to show here',
            ),
          ),
        ),
      );

      expect(find.text('No Data'), findsOneWidget);
      expect(find.text('Nothing to show here'), findsOneWidget);
      expect(find.byIcon(Icons.inbox), findsOneWidget);
    });

    testWidgets('shows action button when provided', (tester) async {
      var tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              icon: Icons.inbox,
              title: 'Empty',
              subtitle: 'Nothing',
              actionLabel: 'Add Item',
              onAction: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Add Item'), findsOneWidget);
      await tester.tap(find.text('Add Item'));
      expect(tapped, isTrue);
    });

    testWidgets('no action button when not provided', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyState(
              icon: Icons.inbox,
              title: 'Empty',
              subtitle: 'Nothing',
            ),
          ),
        ),
      );

      expect(find.byType(ElevatedButton), findsNothing);
    });
  });

  group('StreakDisplay', () {
    testWidgets('displays streak values', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StreakDisplay(
              currentStreak: 7,
              bestStreak: 14,
              totalDays: 30,
            ),
          ),
        ),
      );

      expect(find.text('7'), findsOneWidget);
      expect(find.text('14'), findsOneWidget);
      expect(find.text('30'), findsOneWidget);
      expect(find.text('Current Streak'), findsOneWidget);
      expect(find.text('Best Streak'), findsOneWidget);
      expect(find.text('Total Days'), findsOneWidget);
    });

    testWidgets('displays zero streaks', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StreakDisplay(
              currentStreak: 0,
              bestStreak: 0,
              totalDays: 0,
            ),
          ),
        ),
      );

      expect(find.text('0'), findsNWidgets(3));
    });
  });

  group('DifficultyBadge', () {
    testWidgets('displays difficulty level', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: DifficultyBadge(level: 3),
          ),
        ),
      );

      expect(find.text('3'), findsOneWidget);
    });
  });

  group('StatCard', () {
    testWidgets('displays stat value and label', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatCard(
              icon: Icons.check,
              value: '85%',
              label: 'Accuracy',
              color: Colors.green,
            ),
          ),
        ),
      );

      expect(find.text('85%'), findsOneWidget);
      expect(find.text('Accuracy'), findsOneWidget);
      expect(find.byIcon(Icons.check), findsOneWidget);
    });
  });

  group('PromoBanner', () {
    testWidgets('displays message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PromoBanner(
              message: 'New feature available!',
              style: PromoBannerStyle.info,
            ),
          ),
        ),
      );

      expect(find.text('New feature available!'), findsOneWidget);
    });

    testWidgets('can be dismissed', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PromoBanner(
              message: 'Dismiss me',
              style: PromoBannerStyle.info,
            ),
          ),
        ),
      );

      expect(find.text('Dismiss me'), findsOneWidget);

      // Find and tap the close button
      await tester.tap(find.byIcon(Icons.close));
      await tester.pump();

      expect(find.text('Dismiss me'), findsNothing);
    });

    testWidgets('not dismissible when dismissible is false', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PromoBanner(
              message: 'Cannot dismiss',
              style: PromoBannerStyle.warning,
              dismissible: false,
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.close), findsNothing);
    });
  });
}