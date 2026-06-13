import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import '../services/settings_provider.dart';
import '../services/physics_core.dart';
import '../models/models.dart';
import 'session_summary_view.dart';

class FocusedPracticeView extends StatefulWidget {
  const FocusedPracticeView({super.key});

  @override
  State<FocusedPracticeView> createState() => _FocusedPracticeViewState();
}

class _FocusedPracticeViewState extends State<FocusedPracticeView> {
  Specification? _specification;
  List<Unit> _units = [];
  List<Topic> _topics = [];
  List<Skill> _skills = [];

  String? _selectedUnitId;
  String? _selectedTopicId;
  String? _selectedSkillId;
  int _questionCount = 10;

  // Session state
  bool _inSession = false;
  List<GeneratedQuestion> _questions = [];
  int _currentIndex = 0;
  final List<PracticeResult> _results = [];
  String? _userAnswer;
  bool _showFeedback = false;
  final _answerController = TextEditingController();
  DateTime? _questionStartTime;

  @override
  void initState() {
    super.initState();
    _loadSpecification();
  }

  void _loadSpecification() {
    final settings = context.read<SettingsProvider>();
    final content = settings.specificationContent.isNotEmpty
        ? settings.specificationContent
        : _defaultSpec();
    final spec = DartPhysicsCore.parseSpecification(content);
    setState(() {
      _specification = spec;
      _units = spec.units;
      _topics = spec.topics;
      _skills = spec.skills;
    });
  }

  String _defaultSpec() {
    return '''
[UNIT]
Id: U1
Name: Mechanics
Description: Classical mechanics unit

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1
Description: Motion in one dimension

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1
Description: Solve problems with constant acceleration

[SKILL]
Id: S2
Name: Free Fall
TopicId: T1
Description: Solve problems involving objects falling under gravity

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
TopicId: T1
SkillId: S2
QuestionType: ShortAnswer
Difficulty: 1
TextTemplate: A ball is dropped from rest. How far does it fall in {t} seconds? (Use g = 9.81 m/s^2)
AnswerExpression: 0.5 * 9.81 * t * t
SolutionTemplate: Use s = (1/2)gt^2 = 0.5 * 9.81 * {t}^2 = {answer} m.
Var.t: Type=double;Min=1;Max=5;Step=0.5
''';
  }

  List<Topic> get _filteredTopics =>
      _selectedUnitId != null
          ? _topics.where((t) => t.unitId == _selectedUnitId).toList()
          : _topics;

  List<Skill> get _filteredSkills =>
      _selectedTopicId != null
          ? _skills.where((s) => s.topicId == _selectedTopicId).toList()
          : _skills;

  void _startSession() {
    if (_specification == null) return;
    final questions = DartPhysicsCore.generateBatch(
      _specification!,
      _questionCount,
      topicId: _selectedTopicId,
      skillId: _selectedSkillId,
    );

    if (questions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No questions match the selected filters')),
      );
      return;
    }

    setState(() {
      _inSession = true;
      _questions = questions;
      _currentIndex = 0;
      _results.clear();
      _showFeedback = false;
      _userAnswer = null;
      _questionStartTime = DateTime.now();
    });
  }

  void _submitAnswer() {
    final question = _questions[_currentIndex];
    final userAnswer = _answerController.text.trim();
    final isCorrect = userAnswer == question.answer;

    final timeTaken = DateTime.now().difference(_questionStartTime!).inMilliseconds;

    _results.add(PracticeResult(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      questionId: question.id,
      topicId: question.topicId,
      skillId: question.skillId,
      isCorrect: isCorrect,
      timeTakenMs: timeTaken,
      userAnswer: userAnswer,
      timestamp: DateTime.now().toIso8601String(),
      mode: 'Focused',
      difficulty: question.difficulty,
    ));

    setState(() {
      _showFeedback = true;
    });
  }

  void _nextQuestion() {
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _showFeedback = false;
        _userAnswer = null;
        _answerController.clear();
        _questionStartTime = DateTime.now();
      });
    } else {
      _endSession();
    }
  }

  void _endSession() {
    final settings = context.read<SettingsProvider>();
    settings.loadPracticeResults().then((existing) {
      existing.addAll(_results);
      settings.savePracticeResults(existing);
    });

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SessionSummaryView(results: List.from(_results)),
      ),
    ).then((_) {
      setState(() {
        _inSession = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_inSession) {
      return _buildSessionView();
    }
    return _buildSelectionView();
  }

  Widget _buildSelectionView() {
    return Scaffold(
      appBar: AppBar(title: const Text('Focused Practice')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Unit', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedUnitId,
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      hint: const Text('All Units'),
                      isExpanded: true,
                      items: [
                        const DropdownMenuItem(value: null, child: Text('All Units')),
                        ..._units.map((u) => DropdownMenuItem(value: u.id, child: Text(u.name))),
                      ],
                      onChanged: (v) => setState(() {
                        _selectedUnitId = v;
                        _selectedTopicId = null;
                        _selectedSkillId = null;
                      }),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Topic', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedTopicId,
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      hint: const Text('All Topics'),
                      isExpanded: true,
                      items: [
                        const DropdownMenuItem(value: null, child: Text('All Topics')),
                        ..._filteredTopics.map((t) => DropdownMenuItem(value: t.id, child: Text(t.name))),
                      ],
                      onChanged: (v) => setState(() {
                        _selectedTopicId = v;
                        _selectedSkillId = null;
                      }),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Skill', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedSkillId,
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      hint: const Text('All Skills'),
                      isExpanded: true,
                      items: [
                        const DropdownMenuItem(value: null, child: Text('All Skills')),
                        ..._filteredSkills.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))),
                      ],
                      onChanged: (v) => setState(() => _selectedSkillId = v),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Number of Questions', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Slider(
                      value: _questionCount.toDouble(),
                      min: 1,
                      max: 50,
                      divisions: 49,
                      label: '$_questionCount',
                      onChanged: (v) => setState(() => _questionCount = v.round()),
                    ),
                    Center(child: Text('$_questionCount questions')),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _startSession,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start Practice'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                textStyle: const TextStyle(fontSize: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionView() {
    if (_questions.isEmpty) return const Center(child: Text('No questions'));

    final question = _questions[_currentIndex];
    final progress = (_currentIndex + (_showFeedback ? 1 : 0)) / _questions.length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Question ${_currentIndex + 1} of ${_questions.length}'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => _endSession(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(value: progress),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: question.difficulty <= 2
                  ? Colors.green.shade50
                  : question.difficulty <= 5
                      ? Colors.orange.shade50
                      : Colors.red.shade50,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Row(
                  children: [
                    Chip(label: Text('${question.questionType}')),
                    const SizedBox(width: 8),
                    Chip(label: Text('Difficulty: ${question.difficulty}')),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Math.tex(
                  question.text,
                  mathStyle: MathStyle.display,
                  textStyle: Theme.of(context).textTheme.bodyLarge,
                ),
              ),
            ),
            if (question.choices != null && !_showFeedback) ...[
              const SizedBox(height: 16),
              ...question.choices!.map((choice) => Card(
                    child: ListTile(
                      title: Text(choice),
                      onTap: () {
                        _answerController.text = choice;
                        _submitAnswer();
                      },
                    ),
                  )),
            ],
            if (question.questionType == 'SA' && !_showFeedback) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _answerController,
                decoration: const InputDecoration(
                  labelText: 'Your Answer',
                  border: OutlineInputBorder(),
                ),
                onSubmitted: (_) => _submitAnswer(),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _submitAnswer,
                child: const Text('Submit'),
              ),
            ],
            if (_showFeedback) ...[
              const SizedBox(height: 16),
              Card(
                color: _results.last.isCorrect
                    ? Colors.green.shade100
                    : Colors.red.shade100,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _results.last.isCorrect ? 'Correct!' : 'Incorrect',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: _results.last.isCorrect ? Colors.green : Colors.red,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text('Your answer: ${_results.last.userAnswer}'),
                      Text('Correct answer: ${question.answer}'),
                      const SizedBox(height: 12),
                      const Divider(),
                      const SizedBox(height: 8),
                      Text('Solution:', style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 4),
                      Math.tex(
                        question.solutionText,
                        mathStyle: MathStyle.display,
                        textStyle: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _nextQuestion,
                child: Text(
                  _currentIndex < _questions.length - 1
                      ? 'Next Question'
                      : 'View Summary',
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}