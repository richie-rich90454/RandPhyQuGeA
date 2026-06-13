import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'themes/app_theme.dart';
import 'services/settings_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => SettingsProvider(),
      child: const PhysicsApp(),
    ),
  );
}