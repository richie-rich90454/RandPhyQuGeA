import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OnboardingView extends StatefulWidget {
  final VoidCallback? onComplete;

  const OnboardingView({super.key, this.onComplete});

  static Future<bool> shouldShow() async {
    final prefs = await SharedPreferences.getInstance();
    final shown = prefs.getBool('onboarding_shown') ?? false;
    return !shown;
  }

  static Future<void> markShown() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_shown', true);
  }

  @override
  State<OnboardingView> createState() => _OnboardingViewState();
}

class _OnboardingViewState extends State<OnboardingView> {
  final _pageController = PageController();
  int _currentPage = 0;

  final _pages = [
    _OnboardingPage(
      icon: Icons.school,
      title: 'Physics Practice',
      description: 'Master physics concepts with randomly generated questions '
          'tailored to your skill level.',
      color: Colors.blue,
    ),
    _OnboardingPage(
      icon: Icons.timer,
      title: 'Timed Sessions',
      description: 'Challenge yourself with mental practice mode. '
          'Answer as many questions as you can within a time limit.',
      color: Colors.orange,
    ),
    _OnboardingPage(
      icon: Icons.trending_up,
      title: 'Track Progress',
      description: 'Monitor your accuracy, time, and streaks. '
          'See how you improve over time.',
      color: Colors.green,
    ),
    _OnboardingPage(
      icon: Icons.library_books,
      title: 'Browse & Export',
      description: 'Explore the question bank, preview templates, '
          'and export questions to study offline.',
      color: Colors.purple,
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _pages.length,
                onPageChanged: (i) => setState(() => _currentPage = i),
                itemBuilder: (context, i) => _pages[i],
              ),
            ),
            _buildIndicator(),
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildIndicator() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(_pages.length, (i) {
          return AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            margin: const EdgeInsets.symmetric(horizontal: 4),
            width: _currentPage == i ? 24 : 8,
            height: 8,
            decoration: BoxDecoration(
              color: _currentPage == i
                  ? Theme.of(context).colorScheme.primary
                  : Colors.grey.shade300,
              borderRadius: BorderRadius.circular(4),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton(
            onPressed: _finishOnboarding,
            child: const Text('Skip'),
          ),
          ElevatedButton(
            onPressed: () {
              if (_currentPage < _pages.length - 1) {
                _pageController.nextPage(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                );
              } else {
                _finishOnboarding();
              }
            },
            child: Text(
              _currentPage < _pages.length - 1 ? 'Next' : 'Get Started',
            ),
          ),
        ],
      ),
    );
  }

  void _finishOnboarding() {
    OnboardingView.markShown();
    widget.onComplete?.call();
  }
}

class _OnboardingPage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  const _OnboardingPage({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 100, color: color),
          const SizedBox(height: 40),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            description,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.grey.shade600,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}