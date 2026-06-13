import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import '../services/settings_provider.dart';
import '../services/physics_core.dart';
import '../models/models.dart';
import 'session_summary_view.dart';

class MentalPracticeView extends StatefulWidget {
  const MentalPracticeView({super.key});

  @override
  State<MentalPracticeView> createState() => _MentalPracticeViewState();
}

class _MentalPracticeViewState extends State<MentalPracticeView> {
  Specification? _specification;
  int _questionCount = 10;
  int _timeLimitSeconds = 300;

  bool _inSession = false;
  List<GeneratedQuestion> _questions = [];
  int _currentIndex = 0;
  final List<PracticeResult> _results = [];
  bool _showFeedback = false;
  final _answerController = TextEditingController();
  DateTime? _questionStartTime;
  DateTime? _sessionStartTime;
  int _elapsedSeconds = 0;

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
SkillId: S1
QuestionType: ShortAnswer
Difficulty: 7
TextTemplate: A train traveling at {v0} m/s decelerates uniformly at {a} m/s^2. How far does it travel before stopping?
AnswerExpression: v0 * v0 / (2 * a)
SolutionTemplate: Use v^2 = v0^2 - 2as, with v = 0: s = v0^2/(2a) = {v0}^2/(2*{a}) = {answer} m.
Var.v0: Type=double;Min=10;Max=30;Step=2
Var.a: Type=double;Min=0.5;Max=3;Step=0.5
''';
  }

  void _startSession() {
    if (_specification == null) return;
    final questions = DartPhysicsCore.generateBatch(
      _specification!,
      _questionCount,
    );

    if (questions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No questions available')),
      );
      return;
    }

    setState(() {
      _inSession = true;
      _questions = questions;
      _currentIndex = 0;
      _results.clear();
      _showFeedback = false;
      _elapsedSeconds = 0;
      _sessionStartTime = DateTime.now();
      _questionStartTime = DateTime.now();
    });

    _startTimer();
  }

  void _startTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (!_inSession) return;
      setState(() {
        _elapsedSeconds++;
      });
      if (_elapsedSeconds >= _timeLimitSeconds) {
        _endSession();
      } else {
        _startTimer();
      }
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
      mode: 'Mental',
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

  String get _formattedTime {
    final minutes = _elapsedSeconds ~/ 60;
    final seconds = _elapsedSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  String get _remainingTime {
    final remaining = _timeLimitSeconds - _elapsedSeconds;
    final minutes = remaining ~/ 60;
    final seconds = remaining % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_inSession) {
      return _buildSessionView();
    }
    return _buildSetupView();
  }

  Widget _buildSetupView() {
    return Scaffold(
      appBar: AppBar(title: const Text('Mental Practice')),
      body: Padding(
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
                    Text('Number of Questions', style: Theme.of(context).textTheme.titleSmall),
                    Slider(
                      value: _questionCount.toDouble(),
                      min: 5,
                      max: 50,
                      divisions: 45,
                      label: '$_questionCount',
                      onChanged: (v) => setState(() => _questionCount = v.round()),
                    ),
                    Center(child: Text('$_questionCount questions')),
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
                    Text('Time Limit', style: Theme.of(context).textTheme.titleSmall),
                    Slider(
                      value: _timeLimitSeconds.toDouble(),
                      min: 60,
                      max: 1800,
                      divisions: 29,
                      label: '${_timeLimitSeconds ~/ 60} min',
                      onChanged: (v) => setState(() => _timeLimitSeconds = v.round()),
                    ),
                    Center(child: Text('${_timeLimitSeconds ~/ 60} minutes')),
                  ],
                ),
              ),
            ),
            const Spacer(),
            const Icon(Icons.timer, size: 80, color: Colors.orange),
            const SizedBox(height: 8),
            Text(
              'Answer as many questions as possible\nwithin the time limit!',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _startSession,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start Timed Practice'),
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

    return Scaffold(
      appBar: AppBar(
        title: Text('${_currentIndex + 1}/${_questions.length}'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => _endSession(),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              children: [
                const Icon(Icons.timer, size: 20),
                const SizedBox(width: 4),
                Text(
                  _remainingTime,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
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
                      Text('Answer: ${question.answer}'),
                      if (question.solutionText.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Math.tex(
                          question.solutionText,
                          mathStyle: MathStyle.display,
                        ),
                      ],
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