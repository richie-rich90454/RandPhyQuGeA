import 'package:flutter/services.dart' show rootBundle;
import 'dart:io';
import '../services/physics_core.dart';
import '../models/models.dart';

class SpecificationLoader {
  static const _defaultAssetPath = 'assets/part_one.txt';

  static Future<Specification> loadDefault() async {
    final content = await rootBundle.loadString(_defaultAssetPath);
    return DartPhysicsCore.parseSpecification(content);
  }

  static Specification loadFromContent(String content) {
    return DartPhysicsCore.parseSpecification(content);
  }

  static Future<Specification> loadFromFile(String path) async {
    final file = File(path);
    final content = await file.readAsString();
    return DartPhysicsCore.parseSpecification(content);
  }
}