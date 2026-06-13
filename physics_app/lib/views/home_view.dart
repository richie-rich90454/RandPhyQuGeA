import 'package:flutter/material.dart';

class HomeView extends StatelessWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Physics Question Generator'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.3,
          children: [
            _buildCard(
              context,
              icon: Icons.school,
              title: 'Focused Practice',
              subtitle: 'Select topics and practice',
              color: Colors.blue,
              onTap: () => Navigator.pushNamed(context, '/focused-practice'),
            ),
            _buildCard(
              context,
              icon: Icons.timer,
              title: 'Mental Practice',
              subtitle: 'Timed practice sessions',
              color: Colors.orange,
              onTap: () => Navigator.pushNamed(context, '/mental-practice'),
            ),
            _buildCard(
              context,
              icon: Icons.trending_up,
              title: 'Progress',
              subtitle: 'View your statistics',
              color: Colors.green,
              onTap: () => Navigator.pushNamed(context, '/progress'),
            ),
            _buildCard(
              context,
              icon: Icons.library_books,
              title: 'Question Bank',
              subtitle: 'Browse all templates',
              color: Colors.purple,
              onTap: () => Navigator.pushNamed(context, '/question-bank'),
            ),
            _buildCard(
              context,
              icon: Icons.settings,
              title: 'Settings',
              subtitle: 'App preferences',
              color: Colors.grey,
              onTap: () => Navigator.pushNamed(context, '/settings'),
            ),
            _buildCard(
              context,
              icon: Icons.help_outline,
              title: 'About',
              subtitle: 'Version info',
              color: Colors.teal,
              onTap: () => _showAbout(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 40, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAbout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About'),
        content: const Text(
          'Physics Question Generator\n\n'
          'Version 1.0.0\n\n'
          'A cross-platform physics practice question generator\n'
          'built with Flutter and Rust.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}