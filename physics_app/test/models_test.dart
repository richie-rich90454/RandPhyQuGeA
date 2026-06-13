import 'package:flutter_test/flutter_test.dart';
import 'package:physics_app/models/models.dart';
import 'dart:convert';

void main() {
  group('Unit', () {
    test('fromJson creates Unit correctly', () {
      final json = {
        'id': 'U1',
        'name': 'Mechanics',
        'description': 'Classical mechanics',
      };
      final unit = Unit.fromJson(json);
      expect(unit.id, 'U1');
      expect(unit.name, 'Mechanics');
      expect(unit.description, 'Classical mechanics');
    });

    test('fromJson handles missing fields', () {
      final unit = Unit.fromJson({});
      expect(unit.id, '');
      expect(unit.name, '');
      expect(unit.description, '');
    });

    test('toJson produces correct map', () {
      final unit = Unit(id: 'U1', name: 'Mech', description: 'Desc');
      final json = unit.toJson();
      expect(json['id'], 'U1');
      expect(json['name'], 'Mech');
      expect(json['description'], 'Desc');
    });
  });

  group('Topic', () {
    test('fromJson creates Topic correctly', () {
      final json = {
        'id': 'T1',
        'name': 'Kinematics',
        'unit_id': 'U1',
        'description': 'Motion',
      };
      final topic = Topic.fromJson(json);
      expect(topic.id, 'T1');
      expect(topic.unitId, 'U1');
    });
  });

  group('Skill', () {
    test('fromJson creates Skill correctly', () {
      final json = {
        'id': 'S1',
        'name': 'UA',
        'topic_id': 'T1',
        'description': 'Uniform Acceleration',
      };
      final skill = Skill.fromJson(json);
      expect(skill.id, 'S1');
      expect(skill.topicId, 'T1');
    });
  });

  group('VariableDefinition', () {
    test('fromJson parses numeric fields', () {
      final json = {
        'name': 'v0',
        'var_type': 'double',
        'min': 0,
        'max': 20,
        'step': 1,
      };
      final vd = VariableDefinition.fromJson(json);
      expect(vd.min, 0.0);
      expect(vd.max, 20.0);
      expect(vd.step, 1.0);
    });

    test('fromJson parses enum values', () {
      final json = {
        'name': 'dir',
        'var_type': 'enum',
        'enum_values': ['North', 'South'],
      };
      final vd = VariableDefinition.fromJson(json);
      expect(vd.enumValues, ['North', 'South']);
    });
  });

  group('QuestionTemplate', () {
    test('fromJson creates template with all fields', () {
      final json = {
        'id': 'Q1',
        'topic_id': 'T1',
        'skill_id': 'S1',
        'question_type': 'MC',
        'difficulty': 3,
        'text_template': 'What is {x}?',
        'answer_expression': 'x * 2',
        'solution_template': 'Double {x}',
        'variable_definitions': [
          {'name': 'x', 'var_type': 'int', 'min': 1, 'max': 10},
        ],
        'distractor_expressions': ['x + 1', 'x - 1'],
      };
      final template = QuestionTemplate.fromJson(json);
      expect(template.id, 'Q1');
      expect(template.questionType, 'MC');
      expect(template.difficulty, 3);
      expect(template.variableDefinitions.length, 1);
      expect(template.distractorExpressions.length, 2);
    });

    test('fromJson handles missing lists', () {
      final json = {
        'id': 'Q1',
        'topic_id': 'T1',
        'skill_id': 'S1',
        'question_type': 'SA',
        'difficulty': 1,
        'text_template': '',
        'answer_expression': '',
        'solution_template': '',
      };
      final template = QuestionTemplate.fromJson(json);
      expect(template.variableDefinitions, isEmpty);
      expect(template.distractorExpressions, isEmpty);
    });
  });

  group('GeneratedQuestion', () {
    test('fromJson creates question with choices', () {
      final json = {
        'id': 'gen1',
        'topic_id': 'T1',
        'skill_id': 'S1',
        'question_type': 'MC',
        'difficulty': 2,
        'text': 'What is 2+2?',
        'answer': '4',
        'choices': ['3', '4', '5', '6'],
        'solution_text': '2+2=4',
        'solution_latex': '2+2=4',
        'variables': {'x': 2},
      };
      final question = GeneratedQuestion.fromJson(json);
      expect(question.id, 'gen1');
      expect(question.choices, ['3', '4', '5', '6']);
      expect(question.variables['x'], 2);
    });

    test('toJson roundtrip preserves data', () {
      final q = GeneratedQuestion(
        id: 'q1',
        topicId: 'T1',
        skillId: 'S1',
        questionType: 'SA',
        difficulty: 1,
        text: 'Test',
        answer: '5',
        solutionText: 'Sol',
        solutionLatex: 'Sol',
        variables: {'x': 10},
      );
      final json = q.toJson();
      expect(json['id'], 'q1');
      expect(json['answer'], '5');
      expect(json['variables']['x'], 10);
    });
  });

  group('Specification', () {
    test('fromJson creates full specification', () {
      final json = {
        'units': [
          {'id': 'U1', 'name': 'Mech', 'description': ''},
          {'id': 'U2', 'name': 'EM', 'description': ''},
        ],
        'topics': [
          {'id': 'T1', 'name': 'Kin', 'unit_id': 'U1', 'description': ''},
        ],
        'skills': [
          {'id': 'S1', 'name': 'UA', 'topic_id': 'T1', 'description': ''},
        ],
        'templates': [
          {
            'id': 'Q1',
            'topic_id': 'T1',
            'skill_id': 'S1',
            'question_type': 'SA',
            'difficulty': 1,
            'text_template': 'T',
            'answer_expression': 'x',
            'solution_template': '',
            'variable_definitions': [],
            'distractor_expressions': [],
          },
        ],
      };
      final spec = Specification.fromJson(json);
      expect(spec.units.length, 2);
      expect(spec.topics.length, 1);
      expect(spec.skills.length, 1);
      expect(spec.templates.length, 1);
    });

    test('fromJson handles empty lists gracefully', () {
      final spec = Specification.fromJson({});
      expect(spec.units, isEmpty);
      expect(spec.topics, isEmpty);
      expect(spec.skills, isEmpty);
      expect(spec.templates, isEmpty);
    });

    test('toJson produces correct structure', () {
      final spec = Specification(
        units: [],
        topics: [],
        skills: [],
        templates: [],
      );
      final json = spec.toJson();
      expect(json['units'], isEmpty);
      expect(json['topics'], isEmpty);
    });
  });

  group('PracticeResult', () {
    test('fromJson creates result', () {
      final json = {
        'id': 'r1',
        'question_id': 'q1',
        'topic_id': 'T1',
        'skill_id': 'S1',
        'is_correct': true,
        'time_taken_ms': 5000,
        'user_answer': '42',
        'timestamp': '2024-01-01',
        'mode': 'Focused',
        'difficulty': 3,
      };
      final result = PracticeResult.fromJson(json);
      expect(result.isCorrect, isTrue);
      expect(result.timeTakenMs, 5000);
      expect(result.mode, 'Focused');
      expect(result.difficulty, 3);
    });

    test('toJson roundtrip preserves data', () {
      final r = PracticeResult(
        id: 'r1',
        questionId: 'q1',
        topicId: 'T1',
        skillId: 'S1',
        isCorrect: false,
        timeTakenMs: 3000,
        userAnswer: 'wrong',
        timestamp: 'now',
        mode: 'Mental',
        difficulty: 2,
      );
      final json = r.toJson();
      expect(json['is_correct'], false);
      expect(json['mode'], 'Mental');
    });
  });
}