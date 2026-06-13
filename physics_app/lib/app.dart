import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/settings_provider.dart';
import 'themes/app_theme.dart';
import 'views/home_view.dart';
import 'views/focused_practice_view.dart';
import 'views/mental_practice_view.dart';
import 'views/progress_view.dart';
import 'views/question_bank_view.dart';
import 'views/settings_view.dart';
import 'views/export_dialog.dart';

class PhysicsApp extends StatelessWidget {
  const PhysicsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settings, _) {
        return MaterialApp(
          title: 'Physics Question Generator',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: settings.isDarkMode ? ThemeMode.dark : ThemeMode.light,
          home: const HomeView(),
          routes: {
            '/focused-practice': (context) => const FocusedPracticeView(),
            '/mental-practice': (context) => const MentalPracticeView(),
            '/progress': (context) => const ProgressView(),
            '/question-bank': (context) => const QuestionBankView(),
            '/settings': (context) => const SettingsView(),
          },
          onGenerateRoute: (settings) {
            return PageRouteBuilder(
              pageBuilder: (context, animation, secondaryAnimation) {
                switch (settings.name) {
                  case '/focused-practice': return const FocusedPracticeView();
                  case '/mental-practice': return const MentalPracticeView();
                  case '/progress': return const ProgressView();
                  case '/question-bank': return const QuestionBankView();
                  case '/settings': return const SettingsView();
                  default: return const HomeView();
                }
              },
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.1, 0.0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutCubic,
                  )),
                  child: FadeTransition(
                    opacity: animation,
                    child: child,
                  ),
                );
              },
            );
          },
        );
      },
    );
  }
}