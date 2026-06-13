/// App version and build information.
class VersionInfo {
  static const String appName = 'Physics Question Generator';
  static const String version = '1.0.0';
  static const String buildNumber = '1';
  static const String environment = 'development';

  static String get fullVersion => '$version+$buildNumber';

  static String get shortInfo => '$appName v$version';

  static Map<String, String> get versionMap => {
    'appName': appName,
    'version': version,
    'buildNumber': buildNumber,
    'environment': environment,
    'platform': 'flutter',
    'core': 'rust',
  };
}