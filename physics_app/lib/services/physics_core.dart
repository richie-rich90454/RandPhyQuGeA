import 'dart:convert';
import '../models/models.dart';

/// Pure Dart implementation of the physics question generation logic.
/// This serves as a fallback when the Rust WASM/native bridge is not available.
/// In production, this would be replaced by the Rust bridge.

class DartPhysicsCore {
  // Specification parsing
  static Specification parseSpecification(String input) {
    final units = <Unit>[];
    final topics = <Topic>[];
    final skills = <Skill>[];
    final templates = <QuestionTemplate>[];

    String? currentSection;
    final currentBlock = <String, List<String>>{};

    final lines = input.split('\n');
    for (var i = 0; i < lines.length; i++) {
      final line = lines[i].trim();
      if (line.isEmpty || line.startsWith('//')) continue;

      if (line.startsWith('[') && line.endsWith(']')) {
        final sectionName = line.substring(1, line.length - 1);
        if (sectionName.isEmpty) continue;

        if (currentSection != null && currentBlock.isNotEmpty) {
          _processBlock(currentSection, currentBlock, units, topics, skills, templates);
        }

        currentSection = sectionName.toUpperCase();
        currentBlock.clear();
        continue;
      }

      if (currentSection == null) continue;

      final colonIdx = line.indexOf(':');
      if (colonIdx < 0) continue;

      final key = line.substring(0, colonIdx).trim();
      final value = line.substring(colonIdx + 1).trim();
      currentBlock.putIfAbsent(key, () => []).add(value);
    }

    if (currentSection != null && currentBlock.isNotEmpty) {
      _processBlock(currentSection, currentBlock, units, topics, skills, templates);
    }

    return Specification(
      units: units,
      topics: topics,
      skills: skills,
      templates: templates,
    );
  }

  static void _processBlock(
    String section,
    Map<String, List<String>> block,
    List<Unit> units,
    List<Topic> topics,
    List<Skill> skills,
    List<QuestionTemplate> templates,
  ) {
    switch (section) {
      case 'UNIT':
        final id = _getSingle(block, 'Id');
        final name = _getSingle(block, 'Name');
        if (id != null && name != null) {
          units.add(Unit(id: id, name: name, description: _getSingle(block, 'Description') ?? ''));
        }
        break;
      case 'TOPIC':
        final id = _getSingle(block, 'Id');
        final name = _getSingle(block, 'Name');
        final unitId = _getSingle(block, 'UnitId');
        if (id != null && name != null && unitId != null) {
          topics.add(Topic(id: id, name: name, unitId: unitId, description: _getSingle(block, 'Description') ?? ''));
        }
        break;
      case 'SKILL':
        final id = _getSingle(block, 'Id');
        final name = _getSingle(block, 'Name');
        final topicId = _getSingle(block, 'TopicId');
        if (id != null && name != null && topicId != null) {
          skills.add(Skill(id: id, name: name, topicId: topicId, description: _getSingle(block, 'Description') ?? ''));
        }
        break;
      case 'TEMPLATE':
        _parseTemplate(block, templates);
        break;
    }
  }

  static void _parseTemplate(Map<String, List<String>> block, List<QuestionTemplate> templates) {
    final id = _getSingle(block, 'Id');
    final topicId = _getSingle(block, 'TopicId');
    final skillId = _getSingle(block, 'SkillId');
    final questionTypeRaw = _getSingle(block, 'QuestionType');
    final difficultyStr = _getSingle(block, 'Difficulty');
    final textTemplate = _getSingle(block, 'TextTemplate');
    final answerExpression = _getSingle(block, 'AnswerExpression');
    final solutionTemplate = _getSingle(block, 'SolutionTemplate') ?? '';

    if (id == null || topicId == null || skillId == null || questionTypeRaw == null ||
        difficultyStr == null || textTemplate == null || answerExpression == null) return;

    final questionType = questionTypeRaw == 'MultipleChoice' ? 'MC' : questionTypeRaw == 'ShortAnswer' ? 'SA' : questionTypeRaw;
    final difficulty = int.tryParse(difficultyStr) ?? 1;

    final varDefs = <VariableDefinition>[];
    for (final key in block.keys) {
      if (key.toLowerCase().startsWith('var.')) {
        final name = key.substring(4);
        for (final value in block[key]!) {
          final vd = _parseVariableDef(name, value);
          if (vd != null) varDefs.add(vd);
        }
      }
    }

    final distractors = block['Distractor'] ?? [];

    templates.add(QuestionTemplate(
      id: id,
      topicId: topicId,
      skillId: skillId,
      questionType: questionType,
      difficulty: difficulty,
      textTemplate: textTemplate,
      answerExpression: answerExpression,
      solutionTemplate: solutionTemplate,
      variableDefinitions: varDefs,
      distractorExpressions: distractors,
    ));
  }

  static VariableDefinition? _parseVariableDef(String name, String value) {
    final dict = <String, String>{};
    for (final segment in value.split(';')) {
      final trimmed = segment.trim();
      if (trimmed.isEmpty) continue;
      final eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      dict[trimmed.substring(0, eq).trim()] = trimmed.substring(eq + 1).trim();
    }

    final type = dict['Type'];
    if (type == null) return null;

    return VariableDefinition(
      name: name,
      varType: type,
      min: double.tryParse(dict['Min'] ?? ''),
      max: double.tryParse(dict['Max'] ?? ''),
      step: double.tryParse(dict['Step'] ?? ''),
      enumValues: dict['Values']?.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(),
    );
  }

  static String? _getSingle(Map<String, List<String>> block, String key) {
    for (final k in block.keys) {
      if (k.toLowerCase() == key.toLowerCase()) {
        final values = block[k]!;
        return values.isNotEmpty ? values.first : null;
      }
    }
    return null;
  }

  // Question generation
  static GeneratedQuestion? generateQuestion(
    Specification spec, {
    String? topicId,
    String? skillId,
    int? minDifficulty,
    int? maxDifficulty,
    String? questionType,
  }) {
    final candidates = spec.templates.where((t) {
      if (topicId != null && t.topicId != topicId) return false;
      if (skillId != null && t.skillId != skillId) return false;
      if (minDifficulty != null && t.difficulty < minDifficulty) return false;
      if (maxDifficulty != null && t.difficulty > maxDifficulty) return false;
      if (questionType != null && t.questionType != questionType) return false;
      return true;
    }).toList();

    if (candidates.isEmpty) return null;

    candidates.shuffle();
    final template = candidates.first;

    return _generateFromTemplate(template);
  }

  static List<GeneratedQuestion> generateBatch(
    Specification spec,
    int count, {
    String? topicId,
    String? skillId,
    int? minDifficulty,
    int? maxDifficulty,
    String? questionType,
  }) {
    final results = <GeneratedQuestion>[];
    for (var i = 0; i < count; i++) {
      final q = generateQuestion(
        spec,
        topicId: topicId,
        skillId: skillId,
        minDifficulty: minDifficulty,
        maxDifficulty: maxDifficulty,
        questionType: questionType,
      );
      if (q != null) results.add(q);
    }
    return results;
  }

  static GeneratedQuestion _generateFromTemplate(QuestionTemplate template) {
    final variables = <String, double>{};
    final random = DateTime.now().microsecondsSinceEpoch;

    for (final def in template.variableDefinitions) {
      double value;
      switch (def.varType) {
        case 'int':
          final min = (def.min ?? 0).toInt();
          final max = (def.max ?? 100).toInt();
          value = (min + (random % (max - min + 1))).toDouble();
          break;
        case 'double':
          final min = def.min ?? 0;
          final max = def.max ?? 100;
          final step = def.step ?? 1;
          final steps = ((max - min) / step).floor();
          final stepIdx = random % (steps + 1);
          value = min + stepIdx * step;
          break;
        case 'enum':
          if (def.enumValues != null && def.enumValues!.isNotEmpty) {
            value = double.tryParse(def.enumValues![random % def.enumValues!.length]) ?? 0;
          } else {
            value = 0;
          }
          break;
        default:
          value = 0;
      }
      variables[def.name] = value;
    }

    var text = template.textTemplate;
    for (final entry in variables.entries) {
      final formatted = entry.value == entry.value.truncateToDouble()
          ? entry.value.toInt().toString()
          : entry.value.toStringAsFixed(4).replaceAll(RegExp(r'0+$'), '').replaceAll(RegExp(r'\.$'), '');
      text = text.replaceAll('{${entry.key}}', formatted);
    }

    final answerValue = _evaluateExpression(template.answerExpression, variables);
    final answer = _formatAnswer(answerValue);

    List<String>? choices;
    if (template.questionType == 'MC') {
      choices = [];
      for (final expr in template.distractorExpressions) {
        final distractor = _formatAnswer(_evaluateExpression(expr, variables));
        if (distractor != answer) {
          choices.add(distractor);
        }
      }
      choices.add(answer);
      choices.shuffle();
    }

    var solutionText = template.solutionTemplate;
    for (final entry in variables.entries) {
      final formatted = entry.value == entry.value.truncateToDouble()
          ? entry.value.toInt().toString()
          : entry.value.toStringAsFixed(4).replaceAll(RegExp(r'0+$'), '').replaceAll(RegExp(r'\.$'), '');
      solutionText = solutionText.replaceAll('{${entry.key}}', formatted);
    }
    solutionText = solutionText.replaceAll('{answer}', answer);

    return GeneratedQuestion(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      topicId: template.topicId,
      skillId: template.skillId,
      questionType: template.questionType,
      difficulty: template.difficulty,
      text: text,
      answer: answer,
      choices: choices,
      solutionText: solutionText,
      solutionLatex: template.solutionTemplate,
      variables: variables.map((k, v) => MapEntry(k, v)),
    );
  }

  static double _evaluateExpression(String expr, Map<String, double> variables) {
    try {
      var e = expr.trim();
      // Replace variables
      for (final entry in variables.entries) {
        e = e.replaceAll(RegExp('\\b${entry.key}\\b'), entry.value.toString());
      }
      // Replace constants
      e = e.replaceAll(RegExp(r'\bpi\b'), '3.141592653589793');
      e = e.replaceAll(RegExp(r'\be\b'), '2.718281828459045');

      // Handle functions
      e = _replaceFunctions(e);

      // Evaluate
      return _evalSimple(e);
    } catch (ex) {
      return 0;
    }
  }

  static String _replaceFunctions(String expr) {
    // Replace sin(deg) -> sin(rad)
    expr = expr.replaceAllMapped(
      RegExp(r'sin\(([^)]+)\)'),
      (m) => '${_toRadians(_evalSimple(m.group(1)!))}.sin',
    );
    expr = expr.replaceAllMapped(
      RegExp(r'cos\(([^)]+)\)'),
      (m) => '${_toRadians(_evalSimple(m.group(1)!))}.cos',
    );
    expr = expr.replaceAllMapped(
      RegExp(r'tan\(([^)]+)\)'),
      (m) => '${_toRadians(_evalSimple(m.group(1)!))}.tan',
    );
    expr = expr.replaceAllMapped(
      RegExp(r'sqrt\(([^)]+)\)'),
      (m) => '${_evalSimple(m.group(1)!)}.sqrt',
    );
    expr = expr.replaceAllMapped(
      RegExp(r'abs\(([^)]+)\)'),
      (m) => '${_evalSimple(m.group(1)!)}.abs',
    );
    expr = expr.replaceAllMapped(
      RegExp(r'floor\(([^)]+)\)'),
      (m) => '${_evalSimple(m.group(1)!)}.floor',
    );
    expr = expr.replaceAllMapped(
      RegExp(r'ceiling\(([^)]+)\)'),
      (m) => '${_evalSimple(m.group(1)!)}.ceil',
    );
    return expr;
  }

  static double _toRadians(double deg) => deg * 3.141592653589793 / 180.0;

  static double _evalSimple(String expr) {
    expr = expr.trim();
    // Handle basic arithmetic
    try {
      // Very simple evaluator
      if (double.tryParse(expr) != null) {
        return double.parse(expr);
      }
      // Fallback
      return _parseAndEval(expr);
    } catch (_) {
      return 0;
    }
  }

  static double _parseAndEval(String expr) {
    // Simple recursive descent parser
    final tokens = _tokenize(expr);
    var pos = 0;

    double parseExpression() {
      var left = parseTerm();
      while (pos < tokens.length) {
        if (tokens[pos] == '+') {
          pos++;
          left += parseTerm();
        } else if (tokens[pos] == '-') {
          pos++;
          left -= parseTerm();
        } else {
          break;
        }
      }
      return left;
    }

    double parseTerm() {
      var left = parseFactor();
      while (pos < tokens.length) {
        if (tokens[pos] == '*') {
          pos++;
          left *= parseFactor();
        } else if (tokens[pos] == '/') {
          pos++;
          final right = parseFactor();
          left = right != 0 ? left / right : 0;
        } else {
          break;
        }
      }
      return left;
    }

    double parseFactor() {
      if (pos >= tokens.length) return 0;
      if (tokens[pos] == '-') {
        pos++;
        return -parseFactor();
      }
      if (tokens[pos] == '(') {
        pos++;
        final result = parseExpression();
        if (pos < tokens.length && tokens[pos] == ')') pos++;
        return result;
      }
      final token = tokens[pos];
      pos++;
      return double.tryParse(token) ?? 0;
    }

    return parseExpression();
  }

  static List<String> _tokenize(String expr) {
    final tokens = <String>[];
    final chars = expr.replaceAll(' ', '').split('');
    var i = 0;
    while (i < chars.length) {
      final c = chars[i];
      if ('+-*/()'.contains(c)) {
        tokens.add(c);
        i++;
      } else if (RegExp(r'[0-9.]').hasMatch(c)) {
        var num = '';
        while (i < chars.length && RegExp(r'[0-9.]').hasMatch(chars[i])) {
          num += chars[i];
          i++;
        }
        tokens.add(num);
      } else {
        // Skip function names, variables, etc.
        i++;
      }
    }
    return tokens;
  }

  static String _formatAnswer(double value) {
    if (value == value.truncateToDouble()) {
      return value.toInt().toString();
    }
    var formatted = value.toStringAsFixed(4);
    formatted = formatted.replaceAll(RegExp(r'0+$'), '');
    if (formatted.endsWith('.')) formatted = formatted.substring(0, formatted.length - 1);
    return formatted;
  }

  // Exporters
  static String exportHtml(List<GeneratedQuestion> questions) {
    final buf = StringBuffer();
    buf.writeln('<!DOCTYPE html>');
    buf.writeln('<html><head><meta charset="utf-8"><title>Physics Questions</title>');
    buf.writeln('<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>');
    buf.writeln('<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}');
    buf.writeln('.question{margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:5px}');
    buf.writeln('.answer{color:green;font-weight:bold}.solution{margin-top:10px;color:#555}</style>');
    buf.writeln('</head><body><h1>Physics Questions</h1>');

    for (var i = 0; i < questions.length; i++) {
      final q = questions[i];
      buf.writeln('<div class="question">');
      buf.writeln('<p><strong>Question ${i + 1}:</strong> ${_escapeHtml(q.text)}</p>');
      buf.writeln('<div class="answer">Answer: ${_escapeHtml(q.answer)}</div>');
      if (q.choices != null) {
        buf.writeln('<div class="choices">');
        for (final c in q.choices!) {
          buf.writeln('<div>- ${_escapeHtml(c)}</div>');
        }
        buf.writeln('</div>');
      }
      buf.writeln('<div class="solution">Solution: \\\\( ${_escapeHtml(q.solutionText)} \\\\)</div>');
      buf.writeln('</div>');
    }
    buf.writeln('</body></html>');
    return buf.toString();
  }

  static String exportMarkdown(List<GeneratedQuestion> questions) {
    final buf = StringBuffer();
    buf.writeln('# Physics Questions\n');
    for (var i = 0; i < questions.length; i++) {
      final q = questions[i];
      buf.writeln('## Question ${i + 1}\n');
      buf.writeln('${q.text}\n');
      if (q.choices != null) {
        for (final c in q.choices!) {
          buf.writeln('- $c');
        }
        buf.writeln('');
      }
      buf.writeln('**Answer:** ${q.answer}\n');
      buf.writeln('**Solution:** \\\\( ${q.solutionText} \\\\)\n');
    }
    return buf.toString();
  }

  static String exportText(List<GeneratedQuestion> questions) {
    final buf = StringBuffer();
    buf.writeln('PHYSICS QUESTIONS');
    buf.writeln('=================\n');
    for (var i = 0; i < questions.length; i++) {
      final q = questions[i];
      buf.writeln('Question ${i + 1}:');
      buf.writeln('${q.text}');
      if (q.choices != null) {
        for (var j = 0; j < q.choices!.length; j++) {
          final letter = String.fromCharCode(65 + j);
          buf.writeln('  $letter) ${q.choices![j]}');
        }
      }
      buf.writeln('Answer: ${q.answer}');
      buf.writeln('Solution: ${q.solutionText}\n');
    }
    return buf.toString();
  }

  static String exportPdfHtml(List<GeneratedQuestion> questions) {
    final buf = StringBuffer();
    buf.writeln('<!DOCTYPE html>');
    buf.writeln('<html><head><meta charset="utf-8"><title>Physics Questions</title>');
    buf.writeln('<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>');
    buf.writeln('<style>');
    buf.writeln('@page { margin: 2cm; size: A4; }');
    buf.writeln('body{font-family:sans-serif;font-size:12pt;line-height:1.6}');
    buf.writeln('.question{margin:20px 0;padding:15px;border:1px solid #ccc;page-break-inside:avoid}');
    buf.writeln('.answer{color:green;font-weight:bold}');
    buf.writeln('.solution{margin-top:10px;color:#555;font-style:italic}');
    buf.writeln('</style>');
    buf.writeln('</head><body><h1>Physics Questions</h1>');
    for (var i = 0; i < questions.length; i++) {
      final q = questions[i];
      buf.writeln('<div class="question">');
      buf.writeln('<p><strong>Question ${i + 1}:</strong> ${_escapeHtml(q.text)}</p>');
      buf.writeln('<div class="answer">Answer: ${_escapeHtml(q.answer)}</div>');
      if (q.choices != null) {
        buf.writeln('<div class="choices">');
        for (final c in q.choices!) {
          buf.writeln('<div>- ${_escapeHtml(c)}</div>');
        }
        buf.writeln('</div>');
      }
      buf.writeln('<div class="solution">Solution: ${_escapeHtml(q.solutionText)}</div>');
      buf.writeln('</div>');
    }
    buf.writeln('</body></html>');
    return buf.toString();
  }

  static String _escapeHtml(String text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
  }
}