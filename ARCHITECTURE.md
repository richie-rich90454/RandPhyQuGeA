# Architecture

## Overview

The Physics Question Generator (RandPhyQuGeA) is a cross-platform application that generates random physics questions from a specification file. It uses a **Rust core** for question generation logic and a **Flutter UI** for cross-platform rendering.

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                  Flutter App                     │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Views     │ │ Widgets  │ │   Services     │  │
│  │  - Home    │ │ - Cards  │ │ - PhysicsCore  │  │
│  │  - Practice│ │ - Badges │ │ - Settings     │  │
│  │  - Progress│ │ - Charts │ │ - Bookmarks    │  │
│  │  - Bank    │ │ - Sliders│ │ - Streaks      │  │
│  │  - Settings│ │ - Timer  │ │ - Analytics    │  │
│  └───────────┘ └──────────┘ └────────────────┘  │
│                      │                          │
│              ┌───────┴───────┐                  │
│              │  DartPhysics   │                  │
│              │     Core       │  (Pure Dart     │
│              │  (Fallback)    │   fallback)     │
│              └───────┬───────┘                  │
└──────────────────────┼──────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────┴────┐  ┌─────┴─────┐  ┌───┴────┐
    │  WASM   │  │ Native FFI│  │  Pure  │
    │ (Web)   │  │(Desktop)  │  │  Dart  │
    └────┬────┘  └─────┬─────┘  └───┬────┘
         │             │             │
         └─────────────┼─────────────┘
                       │
              ┌────────┴────────┐
              │   Rust Core     │
              │  (physics_core) │
              └─────────────────┘
```

## Rust Core (`physics_core/`)

### Domain Models (`domain.rs`)
Core data structures:
- `Unit` - Top-level organizational unit (e.g., Mechanics)
- `Topic` - Topic within a unit (e.g., Kinematics)
- `Skill` - Specific skill within a topic (e.g., Uniform Acceleration)
- `QuestionTemplate` - Template for generating questions with variables
- `VariableDefinition` - Variable with type, range, and step
- `GeneratedQuestion` - Complete generated question with answer and solution
- `Specification` - Container for all units, topics, skills, and templates

### Parser (`parser.rs`)
Parses `.txt` specification files with `[SECTION]` headers and key-value pairs.
Supports comments (`//`), variable definitions (`Var.xxx`), and distractor expressions.

### Expression Evaluator (`evaluator.rs`)
Evaluates mathematical expressions with:
- Basic arithmetic: `+`, `-`, `*`, `/`
- Trigonometric: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`
- Hyperbolic: `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`
- Logarithmic: `log`, `log10`, `ln`, `log2`
- Power/root: `pow`, `sqrt`, `cbrt`
- Rounding: `floor`, `ceiling`, `truncate`, `round`
- Others: `abs`, `exp`, `sign`, `min`, `max`
- Constants: `pi`, `e`
- Unit conversion: `deg`, `rad`

### Question Generator (`generator.rs`)
Generates questions from templates with:
- Random variable value generation within defined ranges
- Answer expression evaluation
- Distractor generation for MC questions
- Choice shuffling
- Batch generation with filtering
- Unique question generation (no duplicate templates)
- `QuestionFilter` builder API

### Exporters (`exporters.rs`)
Export formats:
- **HTML** - Full HTML document with MathJax for math rendering
- **PDF** - Print-oriented HTML with A4 page setup
- **Markdown** - Markdown with LaTeX math delimiters
- **Text** - Plain text with letter-labeled choices
- **JSON** - Structured JSON array
- **CSV** - Comma-separated with header row
- **LaTeX** - LaTeX document with exam class

### Additional Modules
- `difficulty.rs` - Difficulty calibration, weighted scoring, adaptive suggestions
- `cache.rs` - LRU cache with TTL eviction for generated questions
- `metadata.rs` - Specification metadata and statistics
- `formula_library.rs` - Curated physics formula collection
- `spec_merger.rs` - Merge multiple specifications with deduplication
- `template_analysis.rs` - Template validation and dependency analysis
- `unit_conversion.rs` - Physics unit conversions (length, mass, time, temperature)
- `weighted_selection.rs` - Difficulty-weighted template selection
- `config.rs` - Application configuration
- `validation.rs` - Specification validation
- `spec_builder.rs` / `template_builder.rs` - Builder pattern APIs

## Flutter App (`physics_app/`)

### Models (`models/`)
Dart model classes mirroring Rust domain models with JSON serialization.

### Services (`services/`)
- `physics_core.dart` - Pure Dart implementation of all core logic (fallback)
- `settings_provider.dart` - App settings with Provider state management
- `bookmark_service.dart` - Question bookmarking
- `streak_service.dart` - Daily streak tracking
- `analytics_service.dart` - User interaction analytics
- `achievements_service.dart` - Gamification achievements
- `daily_challenge_service.dart` - Daily question challenges
- `leaderboard_service.dart` - Competitive leaderboard
- `data_sync_service.dart` - Import/export app data
- `share_service.dart` - Share questions/sessions
- `notification_service.dart` - Push notifications
- `haptic_service.dart` - Haptic feedback
- `recent_questions_service.dart` - Track recently viewed questions
- `results_export_service.dart` - Export practice results

### Views (`views/`)
- `home_view.dart` - Main navigation grid
- `focused_practice_view.dart` - Structured practice with immediate feedback
- `mental_practice_view.dart` - Timed practice with countdown
- `progress_view.dart` - Statistics and history
- `question_bank_view.dart` - Browse all templates
- `settings_view.dart` - App configuration
- `export_dialog.dart` - Export questions to file
- `session_summary_view.dart` - End-of-session results
- `onboarding_view.dart` - First-time user guide
- `achievements_view.dart` - Achievement display
- `daily_challenge_view.dart` - Daily challenges
- `leaderboard_view.dart` - Leaderboard
- `formula_sheet_view.dart` - Physics formula reference
- `study_plan_view.dart` - Study planning
- `theme_customizer_view.dart` - Theme customization

### Widgets (`widgets/`)
Reusable UI components: `question_card.dart`, `answer_feedback.dart`, `difficulty_badge.dart`, `stat_card.dart`, `streak_display.dart`, `practice_timer.dart`, `practice_history_chart.dart`, `accuracy_chart.dart`, `difficulty_range_slider.dart`, `search_delegate.dart`, `app_drawer.dart`, `promo_banner.dart`, `tips_display.dart`, `empty_state.dart`, `error_view.dart`, `confirmation_dialog.dart`, `loading_overlay.dart`, `loading_skeleton.dart`, `error_boundary.dart`, `accessibility.dart`, `animations.dart`, `adaptive_layout.dart`, `network_status.dart`, `splash_screen.dart`, `question_actions_sheet.dart`, `share_action_sheet.dart`

### Themes (`themes/`)
- `app_theme.dart` - Light and dark Material 3 themes

## Data Flow

1. **Parse**: Specification file → `Specification` struct
2. **Generate**: `Specification` → `QuestionGenerator` → `GeneratedQuestion`
3. **Export**: `GeneratedQuestion[]` → HTML/Markdown/Text/JSON/CSV/LaTeX

## Cross-Platform Architecture

| Platform | Rust Integration | UI Framework |
|----------|-----------------|--------------|
| Web      | WASM (wasm-bindgen) | Flutter Web |
| Android  | Native FFI (staticlib) | Flutter |
| iOS      | Native FFI (staticlib) | Flutter |
| macOS    | Native FFI (dylib) | Flutter |
| Windows  | Native FFI (dll) | Flutter |
| Linux    | Native FFI (so) | Flutter |

## Build Pipeline

```
Rust Source → cargo build → .wasm (Web) / .so/.dll/.dylib (Native)
Flutter Source → flutter build → Web / Android / iOS / macOS / Windows / Linux
```

## CI/CD

GitHub Actions workflows:
- `rust-ci.yml` - Build, test, fmt, clippy, wasm, bench, audit
- `flutter-ci.yml` - Analyze, test, web build, Android build
- `code-quality.yml` - Code quality checks
- `security-audit.yml` - Weekly security audit
- `deploy-web.yml` - Deploy to GitHub Pages
- `android-build.yml` - Build Android APK/AAB
- `apple-build.yml` - Build iOS and macOS
- `desktop-build.yml` - Build Windows and Linux
- `release.yml` - Release workflow for tagged versions