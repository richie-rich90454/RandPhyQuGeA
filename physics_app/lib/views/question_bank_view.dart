import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/settings_provider.dart';
import '../services/physics_core.dart';
import '../models/models.dart';
import 'export_dialog.dart';

class QuestionBankView extends StatefulWidget {
  const QuestionBankView({super.key});

  @override
  State<QuestionBankView> createState() => _QuestionBankViewState();
}

class _QuestionBankViewState extends State<QuestionBankView> {
  Specification? _specification;

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
SolutionTemplate: Use a = (v - v0) / t.
Var.v0: Type=double;Min=0;Max=20;Step=1
Var.v: Type=double;Min=20;Max=40;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
Distractor: (v + v0) / t
Distractor: v / t
''';
  }

  @override
  Widget build(BuildContext context) {
    if (_specification == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Question Bank')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final spec = _specification!;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Question Bank'),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download),
            tooltip: 'Export All',
            onPressed: () => _showExportDialog(context, spec),
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: spec.units.length,
        itemBuilder: (context, index) {
          final unit = spec.units[index];
          final unitTopics = spec.topics.where((t) => t.unitId == unit.id).toList();
          return Card(
            child: ExpansionTile(
              leading: const Icon(Icons.science),
              title: Text(unit.name),
              subtitle: Text(unit.description),
              children: unitTopics.map((topic) {
                final topicSkills = spec.skills.where((s) => s.topicId == topic.id).toList();
                if (topicSkills.isEmpty) {
                  return ListTile(
                    title: Text(topic.name),
                    subtitle: Text(topic.description),
                  );
                }
                return ExpansionTile(
                  title: Text(topic.name),
                  subtitle: Text(topic.description),
                  children: topicSkills.map((skill) {
                    final skillTemplates = spec.templates.where((t) => t.skillId == skill.id).toList();
                    if (skillTemplates.isEmpty) {
                      return ListTile(
                        title: Text(skill.name),
                        subtitle: Text(skill.description),
                      );
                    }
                    return ExpansionTile(
                      title: Text(skill.name),
                      subtitle: Text('${skillTemplates.length} template(s)'),
                      children: skillTemplates.map((template) {
                        return ListTile(
                          leading: Icon(
                            template.questionType == 'MC' ? Icons.checklist : Icons.edit,
                            color: template.difficulty <= 3
                                ? Colors.green
                                : template.difficulty <= 6
                                    ? Colors.orange
                                    : Colors.red,
                          ),
                          title: Text('Template ${template.id}'),
                          subtitle: Text(
                            'Type: ${template.questionType} | Difficulty: ${template.difficulty}',
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.preview),
                            onPressed: () => _previewTemplate(context, template, spec),
                          ),
                        );
                      }).toList(),
                    );
                  }).toList(),
                );
              }).toList(),
            ),
          );
        },
      ),
    );
  }

  void _previewTemplate(BuildContext context, QuestionTemplate template, Specification spec) {
    // Create a temporary spec with just this template
    final tempSpec = Specification(
      units: spec.units,
      topics: spec.topics,
      skills: spec.skills,
      templates: [template],
    );

    final questions = DartPhysicsCore.generateBatch(tempSpec, 1);
    if (questions.isEmpty) return;
    final question = questions.first;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Template ${template.id} Preview'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Type: ${template.questionType}', style: const TextStyle(fontWeight: FontWeight.bold)),
              Text('Difficulty: ${template.difficulty}'),
              const SizedBox(height: 8),
              const Text('Question:', style: TextStyle(fontWeight: FontWeight.bold)),
              Text(question.text),
              const SizedBox(height: 8),
              Text('Answer: ${question.answer}', style: const TextStyle(fontWeight: FontWeight.bold)),
              if (question.choices != null) ...[
                const SizedBox(height: 8),
                const Text('Choices:', style: TextStyle(fontWeight: FontWeight.bold)),
                ...question.choices!.map((c) => Text('- $c')),
              ],
              const SizedBox(height: 8),
              const Text('Variables:', style: TextStyle(fontWeight: FontWeight.bold)),
              ...template.variableDefinitions.map((v) => Text(
                    '  ${v.name} (${v.varType})${v.min != null ? ": ${v.min} - ${v.max}" : ""}',
                    style: const TextStyle(fontSize: 12),
                  )),
              if (template.distractorExpressions.isNotEmpty) ...[
                const SizedBox(height: 8),
                const Text('Distractors:', style: TextStyle(fontWeight: FontWeight.bold)),
                ...template.distractorExpressions.map((d) => Text('  $d', style: const TextStyle(fontSize: 12))),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showExportDialog(BuildContext context, Specification spec) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ExportDialog(specification: spec),
      ),
    );
  }
}