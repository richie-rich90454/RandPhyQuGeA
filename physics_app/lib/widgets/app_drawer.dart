import 'package:flutter/material.dart';

/// A reusable navigation drawer for the physics app.
///
/// Provides consistent navigation to all main views with
/// icons, labels, and optional user info header.
class AppDrawer extends StatelessWidget {
  /// Currently selected route name.
  final String? currentRoute;

  /// Callback when a navigation item is selected.
  final ValueChanged<String>? onNavigate;

  const AppDrawer({
    super.key,
    this.currentRoute,
    this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            // Header
            DrawerHeader(
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Icon(
                    Icons.science,
                    size: 48,
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Physics Question Generator',
                    style: theme.textTheme.titleLarge?.copyWith(
                      color: theme.colorScheme.onPrimaryContainer,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Practice makes perfect',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onPrimaryContainer.withAlpha(179),
                    ),
                  ),
                ],
              ),
            ),

            // Navigation items
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildNavItem(
                    context,
                    icon: Icons.home,
                    label: 'Home',
                    route: '/',
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.center_focus_strong,
                    label: 'Focused Practice',
                    route: '/focused',
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.timer,
                    label: 'Mental Practice',
                    route: '/mental',
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.library_books,
                    label: 'Question Bank',
                    route: '/bank',
                  ),
                  const Divider(),
                  _buildNavItem(
                    context,
                    icon: Icons.trending_up,
                    label: 'Progress',
                    route: '/progress',
                  ),
                  _buildNavItem(
                    context,
                    icon: Icons.settings,
                    label: 'Settings',
                    route: '/settings',
                  ),
                ],
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Divider(),
                  const SizedBox(height: 8),
                  Text(
                    'RandPhyQuGeA v1.0.0',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String route,
  }) {
    final isSelected = currentRoute == route;
    final theme = Theme.of(context);

    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? theme.colorScheme.primary : null,
      ),
      title: Text(
        label,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? theme.colorScheme.primary : null,
        ),
      ),
      selected: isSelected,
      selectedTileColor: theme.colorScheme.primary.withAlpha(25),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      onTap: () {
        Navigator.pop(context); // Close drawer
        onNavigate?.call(route);
      },
    );
  }
}