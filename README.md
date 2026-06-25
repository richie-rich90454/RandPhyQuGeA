# Physics Question Generator

A cross-platform physics practice question generator built with **Flutter** (UI) and **Rust** (question generation logic), featuring WASM support for web deployment.

## Features

- Generate physics questions from specification files (`part_one.txt`)
- Multiple choice and short answer question types
- LaTeX math rendering (flutter_math)
- Export to PDF, HTML, Markdown, and plain text
- Cross-platform: Windows, macOS, Linux, iOS, Android, and Web
- Dark/light theme support
- Focused practice and timed mental practice modes
- Progress tracking with statistics

## Architecture

| Component | Technology | Description |
|-----------|-----------|-------------|
| **physics_core** | Rust | Domain models, specification parser, question generator, expression evaluator, exporters |
| **physics_app** | Flutter/Dart | Cross-platform UI with navigation, theming, and LaTeX rendering |

The Rust core compiles to:
- **WASM** for web deployment
- **Native dynamic library** via FFI for desktop and mobile platforms

## Quick Start

### Prerequisites

- [Flutter SDK](https://flutter.dev) (3.0+)
- [Rust](https://rust-lang.org) (1.70+)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/) (for web builds)

### Build Rust Core

```bash
# Build and test the Rust library
cd physics_core
cargo build
cargo test
```

### Run Flutter App

```bash
# Desktop (Windows/macOS/Linux)
cd physics_app
flutter run -d windows

# Web
flutter run -d chrome

# Mobile
flutter run -d android
```

## Specification File

Place your `part_one.txt` in `physics_app/assets/` or load via Settings. Format:

```
[UNIT id:kinematics name:Kinematics]
[TOPIC id:proj-motion name:"Projectile Motion" unit:kinematics]
[SKILL id:calc-trajectory name:"Calculate Trajectory" topic:proj-motion]
[TEMPLATE id:t1 skill:calc-trajectory type:MC difficulty:3 ...]
```

## Project Structure

```
physics_core/          # Rust core library
  src/
    domain.rs          # Data models
    parser.rs          # Specification file parser
    evaluator.rs       # Expression evaluator
    random.rs          # Random value generation
    generator.rs       # Question generation
    exporters.rs       # HTML/Markdown/Text/PDF export
    wasm_bridge.rs     # WASM bindings
    ffi.rs             # C-FFI for native platforms

physics_app/           # Flutter application
  lib/
    models/            # Dart data models
    services/          # Logic and providers
    views/             # UI screens
    widgets/           # Reusable widgets
    themes/            # Light/dark themes
  assets/              # Bundled assets
  web/                 # Web platform files
```

## License

Apache 2.0