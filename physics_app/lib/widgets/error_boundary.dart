import 'package:flutter/material.dart';

/// A widget that catches errors in its subtree and displays a fallback UI.
class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(Object error, StackTrace? stackTrace)? onError;

  const ErrorBoundary({
    super.key,
    required this.child,
    this.onError,
  });

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  Object? _error;
  StackTrace? _stackTrace;

  @override
  void initState() {
    super.initState();
    FlutterError.onError = (details) {
      setState(() {
        _error = details.exception;
        _stackTrace = details.stack;
      });
    };
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      if (widget.onError != null) {
        return widget.onError!(_error!, _stackTrace);
      }
      return _defaultErrorWidget(context);
    }

    return widget.child;
  }

  Widget _defaultErrorWidget(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: theme.colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text(
                'Something went wrong',
                style: theme.textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                _error.toString(),
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => setState(() {
                  _error = null;
                  _stackTrace = null;
                }),
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}