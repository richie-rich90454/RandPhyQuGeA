import 'package:flutter/material.dart';

/// A bottom sheet that provides common actions for a question,
/// such as bookmarking, sharing, reporting, and rating.
class QuestionActionsSheet extends StatelessWidget {
  final bool isBookmarked;
  final VoidCallback? onBookmark;
  final VoidCallback? onShare;
  final VoidCallback? onReport;
  final VoidCallback? onRateEasy;
  final VoidCallback? onRateHard;

  const QuestionActionsSheet({
    super.key,
    this.isBookmarked = false,
    this.onBookmark,
    this.onShare,
    this.onReport,
    this.onRateEasy,
    this.onRateHard,
  });

  /// Show the actions sheet.
  static void show(
    BuildContext context, {
    bool isBookmarked = false,
    VoidCallback? onBookmark,
    VoidCallback? onShare,
    VoidCallback? onReport,
    VoidCallback? onRateEasy,
    VoidCallback? onRateHard,
  }) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => QuestionActionsSheet(
        isBookmarked: isBookmarked,
        onBookmark: onBookmark,
        onShare: onShare,
        onReport: onReport,
        onRateEasy: onRateEasy,
        onRateHard: onRateHard,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                'Question Actions',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),

            const Divider(height: 1),

            // Bookmark
            _buildAction(
              context,
              icon: isBookmarked ? Icons.bookmark : Icons.bookmark_border,
              label: isBookmarked ? 'Remove Bookmark' : 'Bookmark',
              color: isBookmarked ? Colors.amber : null,
              onTap: () {
                Navigator.pop(context);
                onBookmark?.call();
              },
            ),

            // Share
            _buildAction(
              context,
              icon: Icons.share,
              label: 'Share Question',
              onTap: () {
                Navigator.pop(context);
                onShare?.call();
              },
            ),

            const Divider(height: 1),

            // Rate difficulty
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.thumbs_up_down, size: 20, color: Colors.grey.shade600),
                  const SizedBox(width: 12),
                  Text(
                    'Rate Difficulty',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        onRateEasy?.call();
                      },
                      icon: const Icon(Icons.sentiment_satisfied, size: 18),
                      label: const Text('Too Easy'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        onRateHard?.call();
                      },
                      icon: const Icon(Icons.sentiment_dissatisfied, size: 18),
                      label: const Text('Too Hard'),
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Report
            _buildAction(
              context,
              icon: Icons.flag_outlined,
              label: 'Report Issue',
              onTap: () {
                Navigator.pop(context);
                onReport?.call();
              },
            ),

            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildAction(
    BuildContext context, {
    required IconData icon,
    required String label,
    Color? color,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, size: 22, color: color),
      title: Text(
        label,
        style: TextStyle(
          color: color,
        ),
      ),
      onTap: onTap,
    );
  }
}