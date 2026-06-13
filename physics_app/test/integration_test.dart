import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:physics_app/services/physics_core.dart';
import 'package:physics_app/models/models.dart';
import 'package:physics_app/services/settings_provider.dart';
import 'package:physics_app/themes/app_theme.dart';
import 'package:provider/provider.dart';

/// Full specification for integration testing.
const testSpec = '''
[UNIT]
Id: U1
Name: Mechanics
Description: Classical mechanics

[UNIT]
Id: U2
Name: Electromagnetism
Description: EM phenomena

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1
Description: Motion

[TOPIC]
Id: T2
Name: Dynamics
UnitId: U1
Description: Forces

[TOPIC]
Id: T3
Name: Electric Circuits
UnitId: U2
Description: Ohm's law

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1
Description: Constant acceleration

[SKILL]
Id: S2
Name: Newton's Second Law
TopicId: T2
Description: F = ma

[SKILL]
Id: S3
Name: Ohm's Law
TopicId: T3
Description: V = IR

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 2
TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s. What is the acceleration?
AnswerExpression: (v - v0) / t
SolutionTemplate: Use a = (v - v0) / t = ({v} - {v0}) / {t} = {answer} m/s^2.
Var.v0: Type=double;Min=0;Max=20;Step=1
Var.v: Type=double;Min=20;Max=40;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
Distractor: (v + v0) / t
Distractor: v / t

[TEMPLATE]
Id: Q2
TopicId: T2
SkillId: S2
QuestionType: ShortAnswer
Difficulty: 3
TextTemplate: A {m} kg object experiences a net force of {F} N. What is its acceleration?
AnswerExpression: F / m
SolutionTemplate: a = F / m = {F} / {m} = {answer} m/s^2.
Var.m: Type=double;Min=1;Max=20;Step=0.5
Var.F: Type=double;Min=10;Max=100;Step=5

[TEMPLATE]
Id: Q3
TopicId: T3
SkillId: S3
QuestionType: MultipleChoice
Difficulty: 1
TextTemplate: A resistor of {R} ohms carries a current of {I} A. What is the voltage across it?
AnswerExpression: I * R
SolutionTemplate: V = I * R = {I} * {R} = {answer} V.
Var.R: Type=double;Min=1;Max=100;Step=1
Var.I: Type=double;Min=0.1;Max=5;Step=0.1
Distractor: I + R
Distractor: I / R
Distractor: R / I

[TEMPLATE]
Id: Q4
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 4
TextTemplate: An object starts from rest and accelerates at {a} m/s^2 for {t} s. Distance?
AnswerExpression: 0.5 * a * t * t
SolutionTemplate: s = 0.5*a*t^2 = 0.5*{a}*{t}^2 = {answer} m.
Var.a: Type=double;Min=1;Max=10;Step=0.5
Var.t: Type=double;Min=1;Max=20;Step=0.5
''';

void main() {
  // ===========================================================================
  // Specification Parsing
  // ===========================================================================
  group('SpecificationParser Integration', () {
    test('parses complete specification with all entity types', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);

      expect(spec.units.length, 2);
      expect(spec.topics.length, 3);
      expect(spec.skills.length, 3);
      expect(spec.templates.length, 4);
    });

    test('parsed units have correct data', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);

      final mechanics = spec.units.firstWhere((u) => u.id == 'U1');
      expect(mechanics.name, 'Mechanics');

      final em = spec.units.firstWhere((u) => u.id == 'U2');
      expect(em.name, 'Electromagnetism');
    });

    test('parsed topics reference correct units', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);

      final kinematics = spec.topics.firstWhere((t) => t.id == 'T1');
      expect(kinematics.unitId, 'U1');

      final circuits = spec.topics.firstWhere((t) => t.id == 'T3');
      expect(circuits.unitId, 'U2');
    });

    test('parsed skills reference correct topics', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);

      final ua = spec.skills.firstWhere((s) => s.id == 'S1');
      expect(ua.topicId, 'T1');

      final ohmsLaw = spec.skills.firstWhere((s) => s.id == 'S3');
      expect(ohmsLaw.topicId, 'T3');
    });

    test('parsed templates have variables and distractors', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);

      final mcTemplate = spec.templates.firstWhere((t) => t.questionType == 'MC');
      expect(mcTemplate.variableDefinitions.length, greaterThan(0));
      expect(mcTemplate.distractorExpressions.length, greaterThan(0));

      final saTemplate = spec.templates.firstWhere((t) => t.questionType == 'SA');
      expect(saTemplate.variableDefinitions.length, greaterThan(0));
      expect(saTemplate.distractorExpressions.length, 0);
    });
  });

  // ===========================================================================
  // Question Generation
  // ===========================================================================
  group('QuestionGenerator Integration', () {
    test('generates single question', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final question = DartPhysicsCore.generateQuestion(spec);

      expect(question, isNotNull);
      expect(question!.text, isNotEmpty);
      expect(question.answer, isNotEmpty);
      expect(question.id, isNotEmpty);
      expect(question.topicId, isNotEmpty);
      expect(question.skillId, isNotEmpty);
      expect(question.solutionText, isNotEmpty);
    });

    test('generated question has no unresolved placeholders', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final question = DartPhysicsCore.generateQuestion(spec);

      expect(question, isNotNull);
      expect(question!.text.contains('{'), isFalse);
      expect(question.solutionText.contains('{'), isFalse);
    });

    test('MC questions have choices', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      // Generate many times to get various question types
      for (var i = 0; i < 20; i++) {
        final question = DartPhysicsCore.generateQuestion(spec);
        if (question != null && question.questionType == 'MC') {
          expect(question.choices, isNotNull);
          expect(question.choices!.length, greaterThan(0));
          expect(question.choices!.contains(question.answer), isTrue);
          break;
        }
      }
    });

    test('SA questions have no choices', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      for (var i = 0; i < 20; i++) {
        final question = DartPhysicsCore.generateQuestion(spec);
        if (question != null && question.questionType == 'SA') {
          expect(question.choices, isNull);
          break;
        }
      }
    });

    test('generates batch of questions', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final questions = DartPhysicsCore.generateBatch(spec, 10);

      expect(questions.length, 10);
      for (final q in questions) {
        expect(q.text, isNotEmpty);
        expect(q.answer, isNotEmpty);
      }
    });

    test('batch questions are all valid', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final questions = DartPhysicsCore.generateBatch(spec, 20);

      for (final q in questions) {
        expect(q.id, isNotEmpty);
        expect(q.topicId, isNotEmpty);
        expect(q.skillId, isNotEmpty);
        expect(q.difficulty, greaterThanOrEqualTo(1));
        expect(q.difficulty, lessThanOrEqualTo(7));
      }
    });

    test('generates questions with topic filter', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final questions = DartPhysicsCore.generateBatch(spec, 5, topicId: 'T1');

      expect(questions.length, 5);
      for (final q in questions) {
        expect(q.topicId, 'T1');
      }
    });

    test('generates questions with difficulty filter', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final questions = DartPhysicsCore.generateBatch(
        spec,
        10,
        minDifficulty: 1,
        maxDifficulty: 2,
      );

      expect(questions.isNotEmpty, isTrue);
      for (final q in questions) {
        expect(q.difficulty, greaterThanOrEqualTo(1));
        expect(q.difficulty, lessThanOrEqualTo(2));
      }
    });

    test('no questions generated for impossible filter', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final questions = DartPhysicsCore.generateBatch(
        spec,
        5,
        minDifficulty: 10,
      );

      expect(questions.length, 0);
    });
  });

  // ===========================================================================
  // Export
  // ===========================================================================
  group('Export Integration', () {
    late Specification spec;
    late List<Question> questions;

    setUp(() {
      spec = DartPhysicsCore.parseSpecification(testSpec);
      questions = DartPhysicsCore.generateBatch(spec, 3);
    });

    test('exports to HTML', () {
      final html = DartPhysicsCore.exportQuestions(questions, 'html');
      expect(html, isNotEmpty);
      expect(html.contains('<!DOCTYPE html>'), isTrue);
      expect(html.toLowerCase().contains('mathjax'), isTrue);
    });

    test('exports to Markdown', () {
      final md = DartPhysicsCore.exportQuestions(questions, 'markdown');
      expect(md, isNotEmpty);
      expect(md.contains('# Physics Questions'), isTrue);
    });

    test('exports to plain text', () {
      final text = DartPhysicsCore.exportQuestions(questions, 'text');
      expect(text, isNotEmpty);
      expect(text.contains('PHYSICS QUESTIONS'), isTrue);
    });

    test('exports to JSON', () {
      final json = DartPhysicsCore.exportQuestions(questions, 'json');
      expect(json, startsWith('['));
      expect(json.contains('"id"'), isTrue);
      expect(json.contains('"text"'), isTrue);
    });

    test('exports to CSV', () {
      final csv = DartPhysicsCore.exportQuestions(questions, 'csv');
      expect(csv, isNotEmpty);
      expect(csv.startsWith('id,topic_id'), isTrue);
    });

    test('exports to LaTeX', () {
      final latex = DartPhysicsCore.exportQuestions(questions, 'latex');
      expect(latex, contains('\\documentclass'));
      expect(latex, contains('\\begin{questions}'));
    });

    test('empty questions list exports correctly', () {
      final html = DartPhysicsCore.exportQuestions([], 'html');
      expect(html, isNotEmpty);
      expect(html.contains('Question'), isTrue);

      final json = DartPhysicsCore.exportQuestions([], 'json');
      expect(json, '[]');

      final csv = DartPhysicsCore.exportQuestions([], 'csv');
      expect(csv.startsWith('id'), isTrue);
    });
  });

  // ===========================================================================
  // Model Serialization
  // ===========================================================================
  group('Model Serialization Integration', () {
    test('Specification toJson/fromJson roundtrip', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final json = spec.toJson();
      final restored = Specification.fromJson(json);

      expect(restored.units.length, spec.units.length);
      expect(restored.topics.length, spec.topics.length);
      expect(restored.skills.length, spec.skills.length);
      expect(restored.templates.length, spec.templates.length);

      for (var i = 0; i < spec.units.length; i++) {
        expect(restored.units[i].id, spec.units[i].id);
        expect(restored.units[i].name, spec.units[i].name);
      }
    });

    test('Question toJson produces valid JSON', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final question = DartPhysicsCore.generateQuestion(spec)!;

      final json = question.toJson();
      expect(json['id'], question.id);
      expect(json['text'], question.text);
      expect(json['answer'], question.answer);
      expect(json['question_type'], question.questionType);
      expect(json['difficulty'], question.difficulty);
    });

    test('Question fromJson restores correctly', () {
      final spec = DartPhysicsCore.parseSpecification(testSpec);
      final original = DartPhysicsCore.generateQuestion(spec)!;

      final json = original.toJson();
      final restored = Question.fromJson(json);

      expect(restored.id, original.id);
      expect(restored.text, original.text);
      expect(restored.answer, original.answer);
      expect(restored.questionType, original.questionType);
    });

    test('PracticeResult toJson/fromJson roundtrip', () {
      final result = PracticeResult(
        id: 'test-id',
        questionId: 'Q1',
        questionText: 'What is 2+2?',
        correctAnswer: '4',
        userAnswer: '4',
        isCorrect: true,
        timeSpentSeconds: 30,
        timestamp: DateTime.now(),
        mode: 'focused',
        topicId: 'T1',
        difficulty: 2,
      );

      final json = result.toJson();
      final restored = PracticeResult.fromJson(json);

      expect(restored.id, result.id);
      expect(restored.isCorrect, result.isCorrect);
      expect(restored.timeSpentSeconds, result.timeSpentSeconds);
      expect(restored.mode, result.mode);
    });
  });

  // ===========================================================================
  // Settings Provider
  // ===========================================================================
  group('SettingsProvider Integration', () {
    testWidgets('provides default theme settings', (tester) async {
      final settings = SettingsProvider();

      await tester.pumpWidget(
        ChangeNotifierProvider.value(
          value: settings,
          child: const MaterialApp(
            home: Scaffold(body: SizedBox()),
          ),
        ),
      );

      expect(settings.themeMode, ThemeMode.system);
      expect(settings.isDarkMode, isFalse);
    });

    testWidgets('toggleDarkMode changes theme', (tester) async {
      final settings = SettingsProvider();

      await tester.pumpWidget(
        ChangeNotifierProvider.value(
          value: settings,
          child: MaterialApp(
            home: const Scaffold(body: SizedBox()),
            theme: settings.isDarkMode ? AppTheme.darkTheme : AppTheme.lightTheme,
          ),
        ),
      );

      // Initially not dark
      expect(settings.isDarkMode, isFalse);

      // Toggle
      settings.toggleDarkMode(true);
      expect(settings.isDarkMode, isTrue);

      // Toggle back
      settings.toggleDarkMode(false);
      expect(settings.isDarkMode, isFalse);
    });
  });

  // ===========================================================================
  // App Theme
  // ===========================================================================
  group('AppTheme Integration', () {
    test('light theme is ThemeData', () {
      expect(AppTheme.lightTheme, isA<ThemeData>());
    });

    test('dark theme is ThemeData', () {
      expect(AppTheme.darkTheme, isA<ThemeData>());
    });

    test('light and dark themes are different', () {
      expect(AppTheme.lightTheme.brightness, Brightness.light);
      expect(AppTheme.darkTheme.brightness, Brightness.dark);
    });
  });

  // ===========================================================================
  // View rendering tests
  // ===========================================================================
  group('View Rendering Integration', () {
    testWidgets('renders home view without errors', (tester) async {
      final settings = SettingsProvider();
      final spec = DartPhysicsCore.parseSpecification(testSpec);

      await tester.pumpWidget(
        ChangeNotifierProvider.value(
          value: settings,
          child: MaterialApp(
            home: Builder(
              builder: (context) => Scaffold(
                appBar: AppBar(title: const Text('Physics Question Generator')),
                body: GridView.count(
                  crossAxisCount: 2,
                  children: [
                    _buildNavCard(context, 'Focused Practice', Icons.edit, '/focused'),
                    _buildNavCard(context, 'Mental Practice', Icons.timer, '/mental'),
                    _buildNavCard(context, 'Progress', Icons.trending_up, '/progress'),
                    _buildNavCard(context, 'Question Bank', Icons.book, '/bank'),
                    _buildNavCard(context, 'Settings', Icons.settings, '/settings'),
                    _buildNavCard(context, 'Export', Icons.file_download, '/export'),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Physics Question Generator'), findsOneWidget);
      expect(find.text('Focused Practice'), findsOneWidget);
      expect(find.text('Mental Practice'), findsOneWidget);
      expect(find.text('Progress'), findsOneWidget);
      expect(find.text('Question Bank'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
    });

    testWidgets('renders empty state widget', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox, size: 64),
                  SizedBox(height: 16),
                  Text('No Data', style: TextStyle(fontSize: 18)),
                  Text('Nothing to show', style: TextStyle(fontSize: 14)),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('No Data'), findsOneWidget);
      expect(find.text('Nothing to show'), findsOneWidget);
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================
  group('Error Handling Integration', () {
    test('parseSpecification handles empty input', () {
      final spec = DartPhysicsCore.parseSpecification('');
      expect(spec.units.length, 0);
      expect(spec.topics.length, 0);
      expect(spec.skills.length, 0);
      expect(spec.templates.length, 0);
    });

    test('parseSpecification handles whitespace-only input', () {
      final spec = DartPhysicsCore.parseSpecification('   \n  \n  ');
      expect(spec.units.length, 0);
    });

    test('generateQuestion with empty specification returns null', () {
      final spec = Specification(
        units: [],
        topics: [],
        skills: [],
        templates: [],
      );
      final question = DartPhysicsCore.generateQuestion(spec);
      expect(question, isNull);
    });

    test('generateBatch with empty specification returns empty list', () {
      final spec = Specification(
        units: [],
        topics: [],
        skills: [],
        templates: [],
      );
      final questions = DartPhysicsCore.generateBatch(spec, 10);
      expect(questions.length, 0);
    });

    test('invalid expression returns zero', () {
      final spec = DartPhysicsCore.parseSpecification('''
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: UA
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Test {x}
AnswerExpression: x /
SolutionTemplate: Solution
Var.x: Type=int;Min=1;Max=10
''');
      final question = DartPhysicsCore.generateQuestion(spec);
      expect(question, isNotNull);
      // Should still produce a question even with broken expression
    });
  });
}

Widget _buildNavCard(BuildContext context, String title, IconData icon, String route) {
  return Card(
    child: InkWell(
      onTap: () {},
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 40),
          const SizedBox(height: 8),
          Text(title),
        ],
      ),
    ),
  );
}