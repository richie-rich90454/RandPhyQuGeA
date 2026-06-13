import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import '../services/settings_provider.dart';

class SettingsView extends StatelessWidget {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: Consumer<SettingsProvider>(
        builder: (context, settings, _) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Column(
                  children: [
                    SwitchListTile(
                      title: const Text('Dark Mode'),
                      subtitle: const Text('Toggle dark theme'),
                      secondary: Icon(
                        settings.isDarkMode ? Icons.dark_mode : Icons.light_mode,
                      ),
                      value: settings.isDarkMode,
                      onChanged: (_) => settings.toggleDarkMode(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ListTile(
                      leading: const Icon(Icons.description),
                      title: const Text('Specification File'),
                      subtitle: Text(
                        settings.specFilePath.isEmpty
                            ? 'No file loaded (using defaults)'
                            : settings.specFilePath.split('/').last,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          ElevatedButton.icon(
                            onPressed: () => _loadSpecFile(context, settings),
                            icon: const Icon(Icons.file_open),
                            label: const Text('Load File'),
                          ),
                          const SizedBox(width: 8),
                          if (settings.specFilePath.isNotEmpty)
                            TextButton(
                              onPressed: () => settings.setSpecFilePath('', ''),
                              child: const Text('Reset to Default'),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('About', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      const Text('Physics Question Generator'),
                      const Text('Version 1.0.0'),
                      const SizedBox(height: 8),
                      const Text(
                        'Built with Flutter + Rust\nCross-platform physics practice question generator',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _loadSpecFile(BuildContext context, SettingsProvider settings) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['txt'],
      );

      if (result != null && result.files.single.path != null) {
        final file = File(result.files.single.path!);
        final content = await file.readAsString();
        await settings.setSpecFilePath(result.files.single.path!, content);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Specification file loaded successfully')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading file: $e')),
        );
      }
    }
  }
}