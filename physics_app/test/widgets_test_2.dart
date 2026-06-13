import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physics_app/widgets/loading_skeleton.dart';
import 'package:physics_app/widgets/error_boundary.dart';

void main() {
  group('LoadingSkeleton', () {
    testWidgets('renders correct number of items', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingSkeleton(itemCount: 5, itemHeight: 60),
          ),
        ),
      );

      // Should have 5 containers
      final containers = tester.widgetList<Container>(find.byType(Container));
      expect(containers.length, greaterThanOrEqualTo(5));
    });

    testWidgets('uses custom padding', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingSkeleton(
              itemCount: 1,
              padding: EdgeInsets.all(32),
            ),
          ),
        ),
      );

      final padding = tester.widget<Padding>(find.byType(Padding));
      expect(padding.padding, const EdgeInsets.all(32));
    });
  });

  group('LoadingState', () {
    testWidgets('shows spinner by default', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: LoadingState()),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows message when provided', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: LoadingState(message: 'Loading questions...')),
        ),
      );

      expect(find.text('Loading questions...'), findsOneWidget);
    });
  });

  group('ErrorBoundary', () {
    testWidgets('shows error UI when child throws', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ErrorBoundary(
            child: Builder(
              builder: (context) {
                throw Exception('Test error');
              },
            ),
          ),
        ),
      );

      // Should show the error icon
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
      expect(find.text('Something went wrong'), findsOneWidget);
    });
  });
}