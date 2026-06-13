# Contributing to Physics Question Generator

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites
- **Rust** (latest stable) - for the core physics engine
- **Flutter** (3.24+) - for the cross-platform UI
- **wasm-pack** - for WASM compilation
- **Docker** (optional) - for containerized builds

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/rand-phy-qu-ge.git
cd rand-phy-qu-ge

# Build Rust core
cd physics_core
cargo build
cargo test

# Run Flutter app
cd ../physics_app
flutter pub get
flutter run
```

## Project Structure

```
rand-phy-qu-ge/
├── physics_core/           # Rust core library
│   ├── src/               # Source code
│   │   ├── lib.rs         # Module declarations
│   │   ├── domain.rs      # Domain models
│   │   ├── parser.rs      # Specification parser
│   │   ├── evaluator.rs   # Expression evaluator
│   │   ├── generator.rs   # Question generator
│   │   ├── exporters.rs   # Export formats
│   │   ├── random.rs      # Random generation
│   │   ├── error.rs       # Error types
│   │   ├── cache.rs       # Question cache
│   │   ├── difficulty.rs  # Difficulty calibration
│   │   ├── metadata.rs    # Specification metadata
│   │   ├── formula_library.rs  # Physics formulas
│   │   ├── spec_merger.rs # Specification merger
│   │   ├── template_analysis.rs # Template validation
│   │   ├── unit_conversion.rs   # Unit conversion
│   │   ├── weighted_selection.rs # Weighted template selection
│   │   ├── config.rs      # Configuration
│   │   ├── spec_builder.rs # Specification builder
│   │   ├── template_builder.rs # Template builder
│   │   ├── validation.rs  # Validation
│   │   ├── wasm_bridge.rs # WASM bindings
│   │   └── ffi.rs         # Native FFI
│   ├── tests/             # Integration tests
│   └── benches/           # Benchmarks
├── physics_app/           # Flutter application
│   ├── lib/
│   │   ├── main.dart      # App entry point
│   │   ├── app.dart       # App widget
│   │   ├── models/        # Dart models
│   │   ├── services/      # Business logic
│   │   ├── views/         # Screen views
│   │   ├── widgets/       # Reusable widgets
│   │   ├── themes/        # App themes
│   │   └── utils/         # Utilities
│   └── test/              # Widget and unit tests
├── .github/               # CI/CD workflows
└── Dockerfile             # Docker build
```

## Development Workflow

### Branching
- `main` - production-ready code
- Feature branches: `feat/description`
- Bug fixes: `fix/description`
- Tests: `test/description`

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - new feature
- `fix:` - bug fix
- `test:` - test additions/changes
- `docs:` - documentation
- `ci:` - CI/CD changes
- `refactor:` - code refactoring
- `chore:` - maintenance

### Code Style
- **Rust**: Follow standard Rust conventions (`cargo fmt`, `cargo clippy`)
- **Dart**: Follow Flutter style guide (`flutter analyze`)

### Testing
```bash
# Rust tests
cd physics_core
cargo test
cargo clippy
cargo fmt --check

# Flutter tests
cd physics_app
flutter test
flutter analyze
```

## Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation if needed
7. Submit a pull request

## Specification Format
Questions are defined in `.txt` files using the specification format:

```ini
[UNIT]
Id: U1
Name: Mechanics

[TOPIC]
Id: T1
Name: Kinematics
UnitId: U1

[SKILL]
Id: S1
Name: Uniform Acceleration
TopicId: T1

[TEMPLATE]
Id: Q1
TopicId: T1
SkillId: S1
QuestionType: MultipleChoice
Difficulty: 2
TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s.
AnswerExpression: (v - v0) / t
SolutionTemplate: Use a = (v - v0) / t
Var.v0: Type=double;Min=0;Max=20;Step=1
Var.v: Type=double;Min=20;Max=40;Step=1
Var.t: Type=double;Min=1;Max=10;Step=0.5
Distractor: (v + v0) / t
```

## Variable Types
- `int` - integer values with Min, Max
- `double` - floating point values with Min, Max, Step
- `enum` - enumeration with Values: a, b, c

## Expression Functions
Built-in math functions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `pow`, `abs`, `exp`, `log`, `log10`, `ln`, `round`, `sign`, `min`, `max`, `floor`, `ceiling`, `truncate`, `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`, `cbrt`, `sqrt`, `pi`, `e`, `deg`, `rad`

## License
This project is licensed under the MIT License.