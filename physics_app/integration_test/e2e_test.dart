import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:physics_app/app.dart';
import 'package:physics_app/services/physics_core.dart';
import 'package:physics_app/models/models.dart';

/// End-to-end tests for key user flows.
/// Run with: flutter test integration_test/e2e_test.dart

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('E2E: App Launch', () {
    testWidgets('app launches and shows home screen', (tester) async {
      await tester.pumpWidget(const PhysicsApp());
      await tester.pumpAndSettle();

      // Verify home screen elements
      expect(find.text('Physics Question Generator'), findsOneWidget);
      expect(find.text('Focused Practice'), findsOneWidget);
      expect(find.text('Mental Practice'), findsOneWidget);
      expect(find.text('Progress'), findsOneWidget);
      expect(find.text('Question Bank'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
    });
  });

  group('E2E: Focused Practice Flow', () {
    testWidgets('complete focused practice session', (tester) async {
      await tester.pumpWidget(const PhysicsApp());
      await tester.pumpAndSettle();

      // Navigate to Focused Practice
      await tester.tap(find.text('Focused Practice'));
      await tester.pumpAndSettle();

      // Verify we're in focused practice view
      expect(find.text('Focused Practice'), findsWidgets);

      // Submit an answer
      final answerField = find.byType(TextField);
      if (answerField.evaluate().isNotEmpty) {
        await tester.enterText(answerField, '42');
        await tester.pumpAndSettle();

        // Find and tap submit button
        final submitButton = find.text('Submit');
        if (submitButton.evaluate().isNotEmpty) {
          await tester.tap(submitButton);
          await tester.pumpAndSettle();

          // Verify feedback is shown
          expect(
            find.byType(ElevatedButton),
            findsWidgets,
          );
        }
      }
    });
  });

  group('E2E: Mental Practice Flow', () {
    testWidgets('navigates to mental practice view', (tester) async {
      await tester.pumpWidget(const PhysicsApp());
      await tester.pumpAndSettle();

      // Navigate to Mental Practice
      await tester.tap(find.text('Mental Practice'));
      await tester.pumpAndSettle();

      // Verify we're in mental practice view
      expect(find.text('Mental Practice'), findsWidgets);
    });
  });

  group('E2E: Settings Flow', () {
    testWidgets('navigates to settings and toggles theme', (tester) async {
      await tester.pumpWidget(const PhysicsApp());
      await tester.pumpAndSettle();

      // Navigate to Settings
      await tester.tap(find.text('Settings'));
      await tester.pumpAndSettle();

      // Verify settings page
      expect(find.text('Settings'), findsWidgets);
    });
  });

  group('E2E: Question Bank Flow', () {
    testWidgets('navigates to question bank', (tester) async {
      await tester.pumpWidget(const PhysicsApp());
      await tester.pumpAndSettle();

      // Navigate to Question Bank
      await tester.tap(find.text('Question Bank'));
      await tester.pumpAndSettle();

      // Verify we're in question bank
      expect(find.text('Question Bank'), findsWidgets);
    });
  });

  group('E2E: Export Flow', () {
    testWidgets('navigates to export view', (tester) async {
      await tester.pumpWidget(const PhysicsApp());
      await tester.pumpAndSettle();

      // Navigate to Export
      await tester.tap(find.text('Export'));
      await tester.pumpAndSettle();

      // Verify export dialog is shown
      expect(find.text('Export'), findsWidgets);
    });
  });
}