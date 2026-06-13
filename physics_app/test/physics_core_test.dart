import 'package:flutter_test/flutter_test.dart';
import 'package:physics_app/services/physics_core.dart';
import 'package:physics_app/models/models.dart';

void main() {
  group('SpecificationParser', () {
    test('parses a basic specification', () {
      final input = '''
[UNIT]
Id: U1
Name: Mechanics
Description: Classical mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1
Description: Motion

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1
Description: Solve problems

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 2
TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s.
AnswerExpression: (v - v0) / t
SolutionTemplate: Use a = (v - v0) / t.
Var.v0: Type=double;Min=0;Max=20;Step=1
Var.v: Type=double;Min=20;Max=40;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
Distractor: (v + v0) / t
Distractor: v / t
''';

      final spec = DartPhysicsCore.parseSpecification(input);
      expect(spec.units.length, 1);
      expect(spec.units[0].id, 'U1');
      expect(spec.topics.length, 1);
      expect(spec.skills.length, 1);
      expect(spec.templates.length, 1);
    });

    test('parses ShortAnswer question type correctly', () {
      final input = '''
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S2
Name: Free Fall
TopicId: T1

[TEMPLATE]
Id: Q2
TopicId: T1
SkillId: S2
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: Test {t}
AnswerExpression: 0.5 * 9.81 * t * t
SolutionTemplate: s = 0.5 * 9.81 * {t}^2
Var.t: Type=double;Min=1;Max=5;Step=0.5
''';

      final spec = DartPhysicsCore.parseSpecification(input);
      expect(spec.templates[0].questionType, 'SA');
    });

    test('skips comment lines and empty lines', () {
      final input = '''
// This is a comment
[UNIT]
Id: U1
Name: Mechanics

// Another comment

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: Test
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: test
AnswerExpression: 1
Var.x: Type=double;Min=1;Max=5
''';

      final spec = DartPhysicsCore.parseSpecification(input);
      expect(spec.units.length, 1);
      expect(spec.topics.length, 1);
    });
  });

  group('QuestionGenerator', () {
    test('generates a question from a specification', () {
      final input = '''
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: Test
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MC
Difficulty: 2
TextTemplate: Calculate {x} plus {y}
AnswerExpression: x + y
SolutionTemplate: x + y = {answer}
Var.x: Type=int;Min=1;Max=10
Var.y: Type=int;Min=1;Max=10
Distractor: x * y
Distractor: x - y
''';

      final spec = DartPhysicsCore.parseSpecification(input);
      final question = DartPhysicsCore.generateQuestion(spec);

      expect(question, isNotNull);
      expect(question!.questionType, 'MC');
      expect(question.choices, isNotNull);
      expect(question.choices!.length, greaterThanOrEqualTo(1));
      expect(question.text, isNot(contains('{')));
    });

    test('generates batch of questions', () {
      final input = '''
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: Test
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: SA
Difficulty: 1
TextTemplate: Value is {x}
AnswerExpression: x * 2
SolutionTemplate: Solution
Var.x: Type=double;Min=1;Max=10;Step=1
''';

      final spec = DartPhysicsCore.parseSpecification(input);
      final questions = DartPhysicsCore.generateBatch(spec, 5);

      expect(questions.length, 5);
      for (final q in questions) {
        expect(q.text, isNot(contains('{')));
      }
    });

    test('filters by topic', () {
      final input = '''
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[TOPIC]
Id: T2
Name: Forces
UnitId: U1

[SKILL]
Id: S1
Name: Test1
TopicId: T1

[SKILL]
Id: S2
Name: Test2
TopicId: T2

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: SA
Difficulty: 1
TextTemplate: A
AnswerExpression: 1
Var.x: Type=double;Min=1;Max=5

[TEMPLATE]
Id: Q2
TopicId: T2
SkillId: S2
QuestionType: SA
Difficulty: 1
TextTemplate: B
AnswerExpression: 2
Var.x: Type=double;Min=1;Max=5
''';

      final spec = DartPhysicsCore.parseSpecification(input);
      final questions = DartPhysicsCore.generateBatch(spec, 10, topicId: 'T1');

      for (final q in questions) {
        expect(q.topicId, 'T1');
      }
    });
  });

  group('Exporters', () {
    late List<GeneratedQuestion> questions;

    setUp(() {
      questions = [
        GeneratedQuestion(
          id: '1',
          topicId: 'T1',
          skillId: 'S1',
          questionType: 'MC',
          difficulty: 2,
          text: 'What is 2+2?',
          answer: '4',
          choices: ['3', '4', '5', '6'],
          solutionText: '2+2=4',
          solutionLatex: '2+2=4',
          variables: {},
        ),
      ];
    });

    test('HTML export contains required elements', () {
      final html = DartPhysicsCore.exportHtml(questions);
      expect(html, contains('<!DOCTYPE html>'));
      expect(html, contains('mathjax'));
      expect(html, contains('Question 1'));
      expect(html, contains('What is 2+2?'));
    });

    test('Markdown export contains required elements', () {
      final md = DartPhysicsCore.exportMarkdown(questions);
      expect(md, contains('# Physics Questions'));
      expect(md, contains('**Answer:** 4'));
      expect(md, contains('What is 2+2?'));
    });

    test('Text export contains required elements', () {
      final text = DartPhysicsCore.exportText(questions);
      expect(text, contains('PHYSICS QUESTIONS'));
      expect(text, contains('Question 1:'));
      expect(text, contains('Answer: 4'));
    });

    test('PDF HTML export contains A4 page setup', () {
      final pdf = DartPhysicsCore.exportPdfHtml(questions);
      expect(pdf, contains('A4'));
      expect(pdf, contains('page-break-inside'));
    });
  });
}