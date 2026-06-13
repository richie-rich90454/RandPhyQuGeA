import 'package:flutter/material.dart';
import '../models/models.dart';

/// A search delegate for searching through question templates,
/// topics, skills, and units in the question bank.
class QuestionSearchDelegate extends SearchDelegate<String> {
  final Specification specification;

  QuestionSearchDelegate({required this.specification});

  @override
  String get searchFieldLabel => 'Search questions, topics, skills...';

  @override
  ThemeData appBarTheme(BuildContext context) {
    final theme = Theme.of(context);
    return theme.copyWith(
      inputDecorationTheme: searchFieldDecorationTheme ??
          InputDecorationTheme(
            hintStyle: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurface.withAlpha(128),
            ),
            border: InputBorder.none,
          ),
    );
  }

  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          tooltip: 'Clear',
          onPressed: () => query = '',
        ),
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      tooltip: 'Back',
      onPressed: () => close(context, ''),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchResults(context);
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty) {
      return _buildEmptySuggestions(context);
    }
    return _buildSearchResults(context);
  }

  Widget _buildEmptySuggestions(BuildContext context) {
    return ListView(
      children: [
        const Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Search Tips',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
        _buildTip(context, Icons.search, 'Search by topic name', 'e.g., "Kinematics"'),
        _buildTip(context, Icons.search, 'Search by skill name', 'e.g., "Newton\'s Law"'),
        _buildTip(context, Icons.search, 'Search by unit name', 'e.g., "Mechanics"'),
        _buildTip(context, Icons.search, 'Search by question type', 'e.g., "MultipleChoice"'),
        _buildTip(context, Icons.search, 'Search by difficulty', 'e.g., "3"'),
        const Divider(),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Quick Stats',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ),
        ListTile(
          leading: const Icon(Icons.science),
          title: const Text('Units'),
          trailing: Text('${specification.units.length}'),
        ),
        ListTile(
          leading: const Icon(Icons.topic),
          title: const Text('Topics'),
          trailing: Text('${specification.topics.length}'),
        ),
        ListTile(
          leading: const Icon(Icons.psychology),
          title: const Text('Skills'),
          trailing: Text('${specification.skills.length}'),
        ),
        ListTile(
          leading: const Icon(Icons.quiz),
          title: const Text('Templates'),
          trailing: Text('${specification.templates.length}'),
        ),
      ],
    );
  }

  Widget _buildTip(BuildContext context, IconData icon, String title, String subtitle) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey),
      title: Text(title),
      subtitle: Text(subtitle, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
    );
  }

  Widget _buildSearchResults(BuildContext context) {
    final results = _search(query);

    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No results for "$query"',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              'Try a different search term',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: results.length,
      itemBuilder: (context, index) {
        final item = results[index];
        return _buildResultItem(context, item);
      },
    );
  }

  Widget _buildResultItem(BuildContext context, SearchResult item) {
    IconData icon;
    Color color;
    String subtitle;

    switch (item.type) {
      case SearchResultType.unit:
        icon = Icons.science;
        color = Colors.blue;
        subtitle = 'Unit';
        break;
      case SearchResultType.topic:
        icon = Icons.topic;
        color = Colors.green;
        subtitle = item.parentName != null ? 'Topic in ${item.parentName}' : 'Topic';
        break;
      case SearchResultType.skill:
        icon = Icons.psychology;
        color = Colors.orange;
        subtitle = item.parentName != null ? 'Skill in ${item.parentName}' : 'Skill';
        break;
      case SearchResultType.template:
        icon = item.questionType == 'MC' ? Icons.checklist : Icons.edit;
        color = item.difficulty <= 3
            ? Colors.green
            : item.difficulty <= 6
                ? Colors.orange
                : Colors.red;
        subtitle = '${item.questionType} | Difficulty: ${item.difficulty}';
        break;
    }

    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(item.name),
      subtitle: Text(subtitle),
      onTap: () => close(context, item.id),
    );
  }

  List<SearchResult> _search(String query) {
    final results = <SearchResult>[];
    final lowerQuery = query.toLowerCase();

    // Search units
    for (final unit in specification.units) {
      if (unit.name.toLowerCase().contains(lowerQuery) ||
          unit.id.toLowerCase().contains(lowerQuery) ||
          unit.description.toLowerCase().contains(lowerQuery)) {
        results.add(SearchResult(
          type: SearchResultType.unit,
          id: unit.id,
          name: unit.name,
        ));
      }
    }

    // Search topics
    for (final topic in specification.topics) {
      if (topic.name.toLowerCase().contains(lowerQuery) ||
          topic.id.toLowerCase().contains(lowerQuery) ||
          topic.description.toLowerCase().contains(lowerQuery)) {
        final unit = specification.units.where((u) => u.id == topic.unitId).firstOrNull;
        results.add(SearchResult(
          type: SearchResultType.topic,
          id: topic.id,
          name: topic.name,
          parentName: unit?.name,
        ));
      }
    }

    // Search skills
    for (final skill in specification.skills) {
      if (skill.name.toLowerCase().contains(lowerQuery) ||
          skill.id.toLowerCase().contains(lowerQuery) ||
          skill.description.toLowerCase().contains(lowerQuery)) {
        final topic = specification.topics.where((t) => t.id == skill.topicId).firstOrNull;
        results.add(SearchResult(
          type: SearchResultType.skill,
          id: skill.id,
          name: skill.name,
          parentName: topic?.name,
        ));
      }
    }

    // Search templates
    for (final template in specification.templates) {
      if (template.id.toLowerCase().contains(lowerQuery) ||
          template.textTemplate.toLowerCase().contains(lowerQuery) ||
          template.questionType.toLowerCase().contains(lowerQuery) ||
          template.difficulty.toString() == query) {
        final topic = specification.topics.where((t) => t.id == template.topicId).firstOrNull;
        results.add(SearchResult(
          type: SearchResultType.template,
          id: template.id,
          name: 'Template ${template.id}',
          parentName: topic?.name,
          questionType: template.questionType,
          difficulty: template.difficulty,
        ));
      }
    }

    return results;
  }
}

enum SearchResultType {
  unit,
  topic,
  skill,
  template,
}

class SearchResult {
  final SearchResultType type;
  final String id;
  final String name;
  final String? parentName;
  final String? questionType;
  final int? difficulty;

  SearchResult({
    required this.type,
    required this.id,
    required this.name,
    this.parentName,
    this.questionType,
    this.difficulty,
  });
}