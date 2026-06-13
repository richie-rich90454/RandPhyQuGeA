import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physics_app/widgets/difficulty_badge.dart';
import 'package:physics_app/widgets/stat_card.dart';
import 'package:physics_app/widgets/question_card.dart';
import 'package:physics_app/widgets/answer_feedback.dart';
import 'package:physics_app/widgets/streak_display.dart';
import 'package:physics_app/widgets/promo_banner.dart';
import 'package:physics_app/widgets/empty_state.dart';
import 'package:physics_app/widgets/error_view.dart';
import 'package:physics_app/widgets/difficulty_range_slider.dart';
import 'package:physics_app/themes/app_theme.dart';

/// Golden tests for visual consistency of UI components.
/// These tests compare rendered widget images against golden files.
/// To update golden files, run: flutter test --update-goldens

void main() {
  group('DifficultyBadge golden', () {
    for (var level = 1; level <= 7; level++) {
      testWidgets('renders difficulty $level correctly', (tester) async {
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: Scaffold(
              body: Center(
                child: DifficultyBadge(level: level),
              ),
            ),
          ),
        );

        await tester.pumpAndSettle();
        await expectLater(
          find.byType(DifficultyBadge),
          matchesGoldenFile('goldens/difficulty_badge_$level.png'),
        );
      });
    }
  });

  group('StatCard golden', () {
    testWidgets('renders stat card with icon', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: Center(
              child: SizedBox(
                width: 200,
                child: StatCard(
                  icon: Icons.check_circle,
                  value: '85%',
                  label: 'Accuracy',
                  color: Colors.green,
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(StatCard),
        matchesGoldenFile('goldens/stat_card.png'),
      );
    });

    testWidgets('renders stat card with different colors', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 200,
                  child: StatCard(
                    icon: Icons.timer,
                    value: '45s',
                    label: 'Avg Time',
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: 200,
                  child: StatCard(
                    icon: Icons.local_fire_department,
                    value: '7',
                    label: 'Streak',
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(StatCard),
        matchesGoldenFile('goldens/stat_card_multi.png'),
      );
    });
  });

  group('QuestionCard golden', () {
    testWidgets('renders MC question card', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: QuestionCard(
                  questionText: 'A car accelerates from 10 m/s to 30 m/s in 5 s. What is the acceleration?',
                  questionType: 'MC',
                  difficulty: 3,
                  variables: const {'v0': '10', 'v': '30', 't': '5'},
                  choices: const ['2 m/s²', '4 m/s²', '6 m/s²', '8 m/s²'],
                  answer: '4 m/s²',
                  solutionText: 'a = (v - v0) / t = (30 - 10) / 5 = 4 m/s²',
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(QuestionCard),
        matchesGoldenFile('goldens/question_card_mc.png'),
      );
    });

    testWidgets('renders SA question card', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: QuestionCard(
                  questionText: 'A 5 kg object experiences a net force of 25 N. What is its acceleration?',
                  questionType: 'SA',
                  difficulty: 2,
                  variables: const {'m': '5', 'F': '25'},
                  answer: '5 m/s²',
                  solutionText: 'a = F / m = 25 / 5 = 5 m/s²',
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(QuestionCard),
        matchesGoldenFile('goldens/question_card_sa.png'),
      );
    });
  });

  group('AnswerFeedback golden', () {
    testWidgets('renders correct feedback', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: Center(
              child: AnswerFeedback(
                isCorrect: true,
                correctAnswer: '5 m/s²',
                userAnswer: '5 m/s²',
                solutionText: 'a = F / m = 25 / 5 = 5 m/s²',
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(AnswerFeedback),
        matchesGoldenFile('goldens/answer_feedback_correct.png'),
      );
    });

    testWidgets('renders incorrect feedback', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: Center(
              child: AnswerFeedback(
                isCorrect: false,
                correctAnswer: '5 m/s²',
                userAnswer: '3 m/s²',
                solutionText: 'a = F / m = 25 / 5 = 5 m/s²',
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(AnswerFeedback),
        matchesGoldenFile('goldens/answer_feedback_incorrect.png'),
      );
    });
  });

  group('StreakDisplay golden', () {
    testWidgets('renders streak display', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: Center(
              child: StreakDisplay(
                currentStreak: 7,
                bestStreak: 14,
                totalDays: 30,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(StreakDisplay),
        matchesGoldenFile('goldens/streak_display.png'),
      );
    });

    testWidgets('renders zero streak display', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: Center(
              child: StreakDisplay(
                currentStreak: 0,
                bestStreak: 0,
                totalDays: 0,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(StreakDisplay),
        matchesGoldenFile('goldens/streak_display_zero.png'),
      );
    });
  });

  group('EmptyState golden', () {
    testWidgets('renders empty state with icon', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: EmptyState(
              icon: Icons.inbox,
              title: 'No Questions Yet',
              subtitle: 'Start a practice session to see results here',
              actionLabel: 'Start Practice',
              onAction: () {},
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(EmptyState),
        matchesGoldenFile('goldens/empty_state.png'),
      );
    });
  });

  group('ErrorView golden', () {
    testWidgets('renders error view with retry', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: ErrorView(
              message: 'Failed to load specification',
              onRetry: () {},
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(ErrorView),
        matchesGoldenFile('goldens/error_view.png'),
      );
    });
  });

  group('PromoBanner golden', () {
    testWidgets('renders info banner', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: Column(
              children: [
                const PromoBanner(
                  message: 'New feature: Daily challenges!',
                  style: PromoBannerStyle.info,
                ),
                const SizedBox(height: 8),
                const PromoBanner(
                  message: 'Achievement unlocked: 7-day streak!',
                  style: PromoBannerStyle.achievement,
                ),
                const SizedBox(height: 8),
                const PromoBanner(
                  message: 'Your subscription expires soon',
                  style: PromoBannerStyle.warning,
                ),
                const SizedBox(height: 8),
                const PromoBanner(
                  message: 'Practice completed successfully!',
                  style: PromoBannerStyle.success,
                ),
              ],
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(PromoBanner),
        matchesGoldenFile('goldens/promo_banner_styles.png'),
      );
    });
  });

  group('DifficultyRangeSlider golden', () {
    testWidgets('renders difficulty range slider', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: DifficultyRangeSlider(
                  minDifficulty: 1,
                  maxDifficulty: 7,
                  onChanged: (min, max) {},
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(DifficultyRangeSlider),
        matchesGoldenFile('goldens/difficulty_range_slider.png'),
      );
    });
  });

  group('Dark theme golden', () {
    testWidgets('renders question card in dark theme', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: Scaffold(
            body: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: QuestionCard(
                  questionText: 'What is the voltage across a 10 ohm resistor with 2 A current?',
                  questionType: 'MC',
                  difficulty: 1,
                  variables: const {'R': '10', 'I': '2'},
                  choices: const ['5 V', '10 V', '20 V', '40 V'],
                  answer: '20 V',
                  solutionText: 'V = I * R = 2 * 10 = 20 V',
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await expectLater(
        find.byType(QuestionCard),
        matchesGoldenFile('goldens/question_card_dark.png'),
      );
    });
  });
}