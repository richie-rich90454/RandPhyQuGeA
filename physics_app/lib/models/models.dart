class Unit {
  final String id;
  final String name;
  final String description;

  Unit({required this.id, required this.name, required this.description});

  factory Unit.fromJson(Map<String, dynamic> json) {
    return Unit(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'description': description};
}

class Topic {
  final String id;
  final String name;
  final String unitId;
  final String description;

  Topic({required this.id, required this.name, required this.unitId, required this.description});

  factory Topic.fromJson(Map<String, dynamic> json) {
    return Topic(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      unitId: json['unit_id'] ?? '',
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'unit_id': unitId, 'description': description};
}

class Skill {
  final String id;
  final String name;
  final String topicId;
  final String description;

  Skill({required this.id, required this.name, required this.topicId, required this.description});

  factory Skill.fromJson(Map<String, dynamic> json) {
    return Skill(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      topicId: json['topic_id'] ?? '',
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'topic_id': topicId, 'description': description};
}

class VariableDefinition {
  final String name;
  final String varType;
  final double? min;
  final double? max;
  final double? step;
  final List<String>? enumValues;

  VariableDefinition({
    required this.name,
    required this.varType,
    this.min,
    this.max,
    this.step,
    this.enumValues,
  });

  factory VariableDefinition.fromJson(Map<String, dynamic> json) {
    return VariableDefinition(
      name: json['name'] ?? '',
      varType: json['var_type'] ?? '',
      min: (json['min'] as num?)?.toDouble(),
      max: (json['max'] as num?)?.toDouble(),
      step: (json['step'] as num?)?.toDouble(),
      enumValues: (json['enum_values'] as List?)?.map((e) => e.toString()).toList(),
    );
  }
}

class QuestionTemplate {
  final String id;
  final String topicId;
  final String skillId;
  final String questionType;
  final int difficulty;
  final String textTemplate;
  final String answerExpression;
  final String solutionTemplate;
  final List<VariableDefinition> variableDefinitions;
  final List<String> distractorExpressions;

  QuestionTemplate({
    required this.id,
    required this.topicId,
    required this.skillId,
    required this.questionType,
    required this.difficulty,
    required this.textTemplate,
    required this.answerExpression,
    required this.solutionTemplate,
    required this.variableDefinitions,
    required this.distractorExpressions,
  });

  factory QuestionTemplate.fromJson(Map<String, dynamic> json) {
    return QuestionTemplate(
      id: json['id'] ?? '',
      topicId: json['topic_id'] ?? '',
      skillId: json['skill_id'] ?? '',
      questionType: json['question_type'] ?? '',
      difficulty: json['difficulty'] ?? 1,
      textTemplate: json['text_template'] ?? '',
      answerExpression: json['answer_expression'] ?? '',
      solutionTemplate: json['solution_template'] ?? '',
      variableDefinitions: (json['variable_definitions'] as List?)
              ?.map((e) => VariableDefinition.fromJson(e))
              .toList() ??
          [],
      distractorExpressions: (json['distractor_expressions'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

class GeneratedQuestion {
  final String id;
  final String topicId;
  final String skillId;
  final String questionType;
  final int difficulty;
  final String text;
  final String answer;
  final List<String>? choices;
  final String solutionText;
  final String solutionLatex;
  final Map<String, dynamic> variables;

  GeneratedQuestion({
    required this.id,
    required this.topicId,
    required this.skillId,
    required this.questionType,
    required this.difficulty,
    required this.text,
    required this.answer,
    this.choices,
    required this.solutionText,
    required this.solutionLatex,
    required this.variables,
  });

  factory GeneratedQuestion.fromJson(Map<String, dynamic> json) {
    return GeneratedQuestion(
      id: json['id'] ?? '',
      topicId: json['topic_id'] ?? '',
      skillId: json['skill_id'] ?? '',
      questionType: json['question_type'] ?? '',
      difficulty: json['difficulty'] ?? 1,
      text: json['text'] ?? '',
      answer: json['answer'] ?? '',
      choices: (json['choices'] as List?)?.map((e) => e.toString()).toList(),
      solutionText: json['solution_text'] ?? '',
      solutionLatex: json['solution_latex'] ?? '',
      variables: json['variables'] ?? {},
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'topic_id': topicId,
        'skill_id': skillId,
        'question_type': questionType,
        'difficulty': difficulty,
        'text': text,
        'answer': answer,
        'choices': choices,
        'solution_text': solutionText,
        'solution_latex': solutionLatex,
        'variables': variables,
      };
}

class Specification {
  final List<Unit> units;
  final List<Topic> topics;
  final List<Skill> skills;
  final List<QuestionTemplate> templates;

  Specification({
    required this.units,
    required this.topics,
    required this.skills,
    required this.templates,
  });

  factory Specification.fromJson(Map<String, dynamic> json) {
    return Specification(
      units: (json['units'] as List?)?.map((e) => Unit.fromJson(e)).toList() ?? [],
      topics: (json['topics'] as List?)?.map((e) => Topic.fromJson(e)).toList() ?? [],
      skills: (json['skills'] as List?)?.map((e) => Skill.fromJson(e)).toList() ?? [],
      templates: (json['templates'] as List?)
              ?.map((e) => QuestionTemplate.fromJson(e))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
        'units': units.map((e) => e.toJson()).toList(),
        'topics': topics.map((e) => e.toJson()).toList(),
        'skills': skills.map((e) => e.toJson()).toList(),
        'templates': templates.map((e) => e.toJson()).toList(),
      };
}

class PracticeResult {
  final String id;
  final String questionId;
  final String topicId;
  final String skillId;
  final bool isCorrect;
  final int timeTakenMs;
  final String userAnswer;
  final String timestamp;
  final String mode;
  final int difficulty;

  PracticeResult({
    required this.id,
    required this.questionId,
    required this.topicId,
    required this.skillId,
    required this.isCorrect,
    required this.timeTakenMs,
    required this.userAnswer,
    required this.timestamp,
    required this.mode,
    required this.difficulty,
  });

  factory PracticeResult.fromJson(Map<String, dynamic> json) {
    return PracticeResult(
      id: json['id'] ?? '',
      questionId: json['question_id'] ?? '',
      topicId: json['topic_id'] ?? '',
      skillId: json['skill_id'] ?? '',
      isCorrect: json['is_correct'] ?? false,
      timeTakenMs: json['time_taken_ms'] ?? 0,
      userAnswer: json['user_answer'] ?? '',
      timestamp: json['timestamp'] ?? '',
      mode: json['mode'] ?? 'Focused',
      difficulty: json['difficulty'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'question_id': questionId,
        'topic_id': topicId,
        'skill_id': skillId,
        'is_correct': isCorrect,
        'time_taken_ms': timeTakenMs,
        'user_answer': userAnswer,
        'timestamp': timestamp,
        'mode': mode,
        'difficulty': difficulty,
      };
}