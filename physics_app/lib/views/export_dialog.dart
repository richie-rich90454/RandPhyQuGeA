import 'package:flutter/material.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../models/models.dart';
import '../services/physics_core.dart';

class ExportDialog extends StatefulWidget {
  final Specification specification;

  const ExportDialog({super.key, required this.specification});

  @override
  State<ExportDialog> createState() => _ExportDialogState();
}

class _ExportDialogState extends State<ExportDialog> {
  String _selectedFormat = 'html';
  int _questionCount = 10;
  String? _selectedTopicId;
  bool _isExporting = false;

  final _formats = {
    'html': 'HTML (Web)',
    'pdf': 'PDF (Print)',
    'markdown': 'Markdown',
    'text': 'Plain Text',
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Export Questions')),
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
                    Text('Export Format', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    ..._formats.entries.map((entry) => RadioListTile<String>(
                          title: Text(entry.value),
                          value: entry.key,
                          groupValue: _selectedFormat,
                          onChanged: (v) => setState(() => _selectedFormat = v!),
                          dense: true,
                        )),
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
                    Slider(
                      value: _questionCount.toDouble(),
                      min: 1,
                      max: 100,
                      divisions: 99,
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
                    Text('Filter by Topic', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedTopicId,
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      hint: const Text('All Topics'),
                      isExpanded: true,
                      items: [
                        const DropdownMenuItem(value: null, child: Text('All Topics')),
                        ...widget.specification.topics.map(
                          (t) => DropdownMenuItem(value: t.id, child: Text('${t.name} (${t.id})')),
                        ),
                      ],
                      onChanged: (v) => setState(() => _selectedTopicId = v),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _isExporting ? null : _export,
              icon: _isExporting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.file_download),
              label: Text(_isExporting ? 'Exporting...' : 'Export'),
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

  Future<void> _export() async {
    setState(() => _isExporting = true);

    try {
      final questions = DartPhysicsCore.generateBatch(
        widget.specification,
        _questionCount,
        topicId: _selectedTopicId,
      );

      String content;
      String extension;
      switch (_selectedFormat) {
        case 'html':
          content = DartPhysicsCore.exportHtml(questions);
          extension = 'html';
          break;
        case 'pdf':
          content = DartPhysicsCore.exportPdfHtml(questions);
          extension = 'html';
          break;
        case 'markdown':
          content = DartPhysicsCore.exportMarkdown(questions);
          extension = 'md';
          break;
        case 'text':
        default:
          content = DartPhysicsCore.exportText(questions);
          extension = 'txt';
          break;
      }

      final dir = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'physics_questions_$timestamp.$extension';
      final file = File('${dir.path}/$fileName');
      await file.writeAsString(content);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Exported to: $fileName'),
            action: SnackBarAction(
              label: 'OK',
              onPressed: () => Navigator.pop(context),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }
}