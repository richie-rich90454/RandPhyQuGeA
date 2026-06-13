class AppConstants {
  static const String appName = 'Physics Question Generator';
  static const String appVersion = '1.0.0';
  static const String specFileName = 'part_one.txt';
  static const int defaultQuestionCount = 10;
  static const int defaultTimeLimitSeconds = 300;
  static const int maxQuestionCount = 100;
  static const int minQuestionCount = 1;
  static const List<String> supportedExportFormats = ['html', 'markdown', 'text', 'pdf'];
  static const List<String> supportedQuestionTypes = ['MC', 'SA'];
}