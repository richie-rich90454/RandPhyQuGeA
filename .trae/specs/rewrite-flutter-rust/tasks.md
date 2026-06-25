# Tasks

- [x] Task 1: Set up Rust core library project structure
  - [x] Create `physics_core` Cargo project with library target
  - [x] Set up Cargo.toml with dependencies (wasm-bindgen, serde, rand, regex)
  - [x] Configure crate-type for cdylib (WASM) and staticlib (native FFI)
  - [x] Create the `src/lib.rs` module structure

- [x] Task 2: Implement Rust domain models
  - [x] Define `Unit`, `Topic`, `Skill` structs with serde serialization
  - [x] Define `VariableDefinition` struct with type discrimination (int, double, enum)
  - [x] Define `QuestionTemplate` struct
  - [x] Define `GeneratedQuestion` struct
  - [x] Define `PracticeResult` struct and `PracticeMode` enum
  - [x] Define `Specification` struct

- [x] Task 3: Implement specification parser in Rust
  - [x] Implement `SpecificationParser` that reads `part_one.txt` format
  - [x] Parse [UNIT], [TOPIC], [SKILL], [TEMPLATE] sections
  - [x] Parse key-value pairs within each section
  - [x] Parse variable definitions (Var.xxx entries)
  - [x] Validate cross-references between entities
  - [x] Return `ParseError` list on validation failures

- [x] Task 4: Implement expression evaluator in Rust
  - [x] Implement `ExpressionEvaluator` with math function support
  - [x] Support: sin, cos, tan, asin, acos, atan (degree-based), sqrt, pow, abs, exp, floor, ceiling, truncate, log, log10, ln, round, sign, max, min, pi, e
  - [x] Support variable substitution in expressions
  - [x] Handle edge cases (division by zero, invalid expressions)

- [x] Task 5: Implement random variable generation in Rust
  - [x] Implement `RandomGenerator` trait with seeded and uniform implementations
  - [x] Implement variable generation for int, double, and enum types
  - [x] Implement variable substitution in text templates (e.g., `{v0}` -> value)

- [x] Task 6: Implement question generator in Rust
  - [x] Implement `QuestionGenerator` struct
  - [x] Implement template selection with filters (topic, skill, difficulty, type)
  - [x] Implement single question generation from a template
  - [x] Implement batch question generation
  - [x] Implement distractor generation for MC questions
  - [x] Implement solution text and LaTeX building

- [x] Task 7: Implement exporters in Rust
  - [x] Implement HTML exporter with MathJax support
  - [x] Implement Markdown exporter with LaTeX math
  - [x] Implement plain text exporter
  - [x] Implement PDF exporter (print-oriented HTML generation)

- [x] Task 8: Implement WASM bindings for Rust core
  - [x] Add `wasm-bindgen` annotations to core types
  - [x] Create `wasm_bridge` module with JS-facing API
  - [x] Expose: `parse_specification`, `generate_question`, `generate_batch`, `export_questions`

- [x] Task 9: Implement Rust FFI layer for native platforms
  - [x] Create `ffi` module with C-compatible functions
  - [x] Expose: `parse_specification`, `generate_question`, `generate_batch`, `export_questions`
  - [x] Implement JSON-based data exchange across FFI boundary

- [x] Task 10: Set up Flutter project structure
  - [x] Create Flutter project structure manually (flutter CLI not available in sandbox)
  - [x] Configure `pubspec.yaml` with dependencies (flutter_math_fork, provider, file_picker, path_provider, shared_preferences)
  - [x] Set up project directory structure (models, services, views, widgets, themes)
  - [x] Configure platform directories (web, windows, android, ios, macos, linux)

- [x] Task 11: Implement Flutter models and Rust bridge
  - [x] Create Dart model classes mirroring Rust domain models
  - [x] Implement `DartPhysicsCore` service with pure-Dart fallback for all Rust logic
  - [x] Models: Specification, Unit, Topic, Skill, QuestionTemplate, VariableDefinition, GeneratedQuestion, PracticeResult

- [x] Task 12: Implement Flutter Home View
  - [x] Create `HomeView` with navigation grid
  - [x] Implement navigation to Focused Practice, Mental Practice, Progress, Question Bank, Settings
  - [x] Dark/light theme support via Provider

- [x] Task 13: Implement Flutter Focused Practice View
  - [x] Create topic/skill selection UI with dropdowns
  - [x] Create question display with answer input
  - [x] Implement correctness feedback (correct/incorrect with color)
  - [x] Implement session summary with score via SessionSummaryView

- [x] Task 14: Implement Flutter Mental Practice View
  - [x] Create timed question display with countdown timer
  - [x] Implement answer submission and tracking
  - [x] Implement session summary with per-question timing

- [x] Task 15: Implement Flutter Progress View
  - [x] Create PracticeResult persistence via SharedPreferences
  - [x] Implement statistics display (accuracy, time, mode breakdown)
  - [x] Implement history list with clear functionality

- [x] Task 16: Implement Flutter Question Bank View
  - [x] Create navigable tree of Units > Topics > Skills > Templates
  - [x] Implement template detail dialog with preview generation
  - [x] Display variable definitions and distractor expressions in preview

- [x] Task 17: Implement Flutter Export Dialog
  - [x] Create export dialog with format selection (HTML, PDF, Markdown, Text)
  - [x] Implement question count input
  - [x] Implement file save using path_provider
  - [x] Wire export to DartPhysicsCore

- [x] Task 18: Implement Flutter Settings View
  - [x] Create theme toggle (dark/light)
  - [x] Create specification file picker via file_picker
  - [x] Persist settings with SharedPreferences

- [x] Task 19: Implement Flutter LaTeX rendering
  - [x] Integrate `flutter_math_fork` package for LaTeX rendering
  - [x] Render math in question text and solutions
  - [x] Handle display math mode

- [x] Task 20: Implement Flutter theming system
  - [x] Define light theme (Material3, blue seed color)
  - [x] Define dark theme (Material3, lighter blue seed)
  - [x] Implement SettingsProvider with theme state
  - [x] Apply theme via Consumer in app root

- [x] Task 21: Bundle default specification file and assets
  - [x] Copy existing `part_one.txt` to Flutter assets
  - [x] Create web/index.html entry point
  - [x] Configure assets in pubspec.yaml

- [x] Task 22: Write Rust unit tests
  - [x] Test specification parser with sample data (3 tests)
  - [x] Test expression evaluator with various expressions (6 tests)
  - [x] Test question generator with sample templates (3 tests)
  - [x] Test exporters (3 tests)
  - [x] Test random generation (3 tests)
  - [x] All 18 tests passing

- [x] Task 23: Remove old .NET codebase
  - [x] Delete all .NET projects (Core, LaTeX, AvaloniaUI, Web, Console, Tests)
  - [x] Delete .sln file and all old config files
  - [x] Update .gitignore for Rust + Flutter
  - [x] Update README with new build and run instructions