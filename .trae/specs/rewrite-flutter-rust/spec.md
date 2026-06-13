# Rewrite with Flutter + Rust Spec

## Why
Replace the existing .NET/Avalonia/Blazor stack with a modern Flutter (UI) + Rust (core logic via WASM) architecture. This provides true cross-platform support (mobile, desktop, web) from a single Flutter codebase, while Rust delivers fast, safe question generation that compiles to WASM for the web and native for other platforms.

## What Changes
- **BREAKING**: Remove all .NET projects (Core, LaTeX, AvaloniaUI, Web, Console, Tests)
- **BREAKING**: Replace UI layer with Flutter (Dart) targeting iOS, Android, Windows, macOS, Linux, and Web
- **BREAKING**: Replace question generation logic with Rust, compiled to WASM (for web) and native dynamic library (for desktop/mobile)
- Preserve the `part_one.txt` specification file format and all existing question templates
- Preserve all existing domain concepts: Units, Topics, Skills, Templates, VariableDefinitions, PracticeResults
- Preserve all existing export formats: HTML, PDF, Markdown, plain text
- Preserve existing UI features: home, focused practice, mental practice, progress, question bank, settings, export, session summary, dark/light themes, LaTeX rendering

## Impact
- Affected specs: All existing specs become obsolete (complete rewrite)
- Affected code: Entire repository replaced

## ADDED Requirements

### Requirement: Rust Core Library
The system SHALL provide a Rust library (`physics_core`) that handles specification parsing, question generation, expression evaluation, and export.

#### Scenario: Parse specification file
- **WHEN** a `part_one.txt` specification file is loaded
- **THEN** the Rust library parses all UNIT, TOPIC, SKILL, and TEMPLATE sections into structured data
- **AND** validates cross-references between entities

#### Scenario: Generate a single question
- **WHEN** question generation is requested with optional filters (topic, skill, difficulty, type)
- **THEN** a random template matching the filters is selected
- **AND** random variable values are generated within defined ranges
- **AND** the answer expression is evaluated with the generated variables
- **AND** text template variables are substituted
- **AND** distractor choices are generated for MC questions
- **AND** solution text and LaTeX are built

#### Scenario: Generate a batch of questions
- **WHEN** a batch of N questions is requested
- **THEN** N questions are generated (or fewer if templates are insufficient)

#### Scenario: Expression evaluation with math functions
- **WHEN** an expression contains math functions (sin, cos, tan, sqrt, pow, abs, exp, floor, ceiling, truncate, log, log10, ln, round, sign, max, min, pi, e)
- **THEN** all functions are evaluated correctly
- **AND** trigonometric functions use degree-based input

#### Scenario: Export to HTML
- **WHEN** questions are exported to HTML
- **THEN** a valid HTML document with MathJax support is produced

#### Scenario: Export to Markdown
- **WHEN** questions are exported to Markdown
- **THEN** a valid Markdown document with LaTeX math is produced

#### Scenario: Export to PDF
- **WHEN** questions are exported to PDF
- **THEN** a PDF document is produced with rendered questions, answers, and solutions

#### Scenario: Export to plain text
- **WHEN** questions are exported to plain text
- **THEN** a plain text document with questions, answers, and solutions is produced

### Requirement: Rust-to-WASM Bridge
The system SHALL compile the Rust core library to WASM with a JavaScript/TypeScript binding layer.

#### Scenario: WASM module loads in browser
- **WHEN** the Flutter web app initializes
- **THEN** the WASM module is loaded and available for question generation
- **AND** specification parsing and question generation work in the browser

### Requirement: Rust FFI for Native
The system SHALL provide a C-compatible FFI layer for the Rust core library for use on desktop and mobile platforms.

#### Scenario: FFI calls from Flutter
- **WHEN** the Flutter app runs on desktop or mobile
- **THEN** the Rust native library is loaded via FFI
- **AND** all question generation operations work correctly

### Requirement: Flutter UI - Home View
The system SHALL provide a home view with navigation to all features.

#### Scenario: Navigate from home
- **WHEN** the app launches
- **THEN** the home view displays navigation options for focused practice, mental practice, progress, question bank, and settings

### Requirement: Flutter UI - Focused Practice
The system SHALL provide a focused practice mode where users select topics/skills and answer questions.

#### Scenario: Focused practice session
- **WHEN** user selects a topic and skill and starts a session
- **THEN** questions are generated for the selected scope
- **AND** user can answer each question and see correctness feedback
- **AND** a session summary is shown at the end

### Requirement: Flutter UI - Mental Practice
The system SHALL provide a mental practice mode for timed practice.

#### Scenario: Mental practice session
- **WHEN** user starts a mental practice session
- **THEN** questions are generated with a timer
- **AND** user answers are tracked
- **AND** a session summary is shown at the end

### Requirement: Flutter UI - Progress Tracking
The system SHALL persist and display practice results.

#### Scenario: View progress
- **WHEN** user navigates to progress view
- **THEN** historical practice results are displayed with statistics (accuracy, time, topics)

### Requirement: Flutter UI - Question Bank
The system SHALL provide a browsable question bank.

#### Scenario: Browse questions
- **WHEN** user navigates to question bank
- **THEN** all specification entities (units, topics, skills, templates) are displayed in a navigable tree
- **AND** user can preview generated questions for each template

### Requirement: Flutter UI - Export
The system SHALL provide an export dialog for generated questions.

#### Scenario: Export questions
- **WHEN** user opens the export dialog
- **THEN** user can select export format (HTML, PDF, Markdown, Text)
- **AND** user can specify the number of questions to generate
- **AND** exported file is saved or shared

### Requirement: Flutter UI - Settings
The system SHALL provide a settings view.

#### Scenario: Configure settings
- **WHEN** user navigates to settings
- **THEN** settings for theme (dark/light), specification file path, and other preferences are available

### Requirement: Flutter UI - Dark/Light Theme
The system SHALL support dark and light themes.

#### Scenario: Toggle theme
- **WHEN** user switches between dark and light theme
- **THEN** the entire UI updates to the selected theme

### Requirement: Flutter UI - LaTeX Rendering
The system SHALL render LaTeX mathematical expressions in questions and solutions.

#### Scenario: Display LaTeX math
- **WHEN** a question or solution contains LaTeX math expressions
- **THEN** the math is rendered as formatted equations
- **AND** Flutter Math or similar widget is used for rendering

### Requirement: Specification File Management
The system SHALL allow users to load custom `part_one.txt` specification files.

#### Scenario: Load specification file
- **WHEN** user provides a `part_one.txt` file
- **THEN** the specification is parsed and used for question generation
- **AND** parse errors are reported to the user

### Requirement: Cross-Platform Build
The system SHALL build and run on all target platforms.

#### Scenario: Web build
- **WHEN** the Flutter project is built for web
- **THEN** a working web application is produced with WASM question generation

#### Scenario: Desktop build
- **WHEN** the Flutter project is built for Windows/macOS/Linux
- **THEN** a working desktop application is produced

#### Scenario: Mobile build
- **WHEN** the Flutter project is built for iOS/Android
- **THEN** a working mobile application is produced