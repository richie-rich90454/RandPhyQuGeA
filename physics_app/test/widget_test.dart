import 'package:flutter_test/flutter_test.dart';
import 'package:physics_app/app.dart';

void main() {
  testWidgets('app renders without errors', (WidgetTester tester) async {
    await tester.pumpWidget(const PhysicsApp());
    await tester.pumpAndSettle();
    expect(find.text('Physics Question Generator'), findsWidgets);
  });
}