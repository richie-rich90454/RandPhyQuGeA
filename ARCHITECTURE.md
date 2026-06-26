# Architecture

## Overview

RandPhyQuGeA is a single-page physics practice question generator. All domain logic — specification parsing, expression evaluation, random variable generation, question generation, and export — lives in a **pure-TypeScript OOP core** under `src/lib/physics/`. The UI is a React 18 + TypeScript app that reproduces the reference liquid/glassmorphism design. An optional Tauri shell (`src-tauri/`) wraps the same Vite bundle for desktop builds but contains no domain logic.

No WASM, no Rust domain logic, no FFI. The web build and the Tauri build share the exact same TypeScript core.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         React UI (src/)                          │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────────────────┐  │
│  │ Components │ │   Hooks      │ │         Stores (Zustand)    │  │
│  │  - layout  │ │  - useSingle │ │  - practiceStore           │  │
│  │  - ui      │ │  - useMental │ │  - progressStore           │  │
│  │  - practice│ │  - useTheme  │ │  - settingsStore (persist) │  │
│  │  - modals  │ │  - useGlobal │ │  - specStore               │  │
│  │            │ │    Shortcuts │ │  - uiStore                 │  │
│  └────────────┘ └──────────────┘ └────────────────────────────┘  │
│                          │                                       │
│                  ┌───────┴────────┐                              │
│                  │ services/       │                             │
│                  │ physicsCore.ts  │  (singleton facade)         │
│                  └───────┬────────┘                              │
└──────────────────────────┼───────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴─────┐  ┌────────┴────────┐  ┌─────┴──────┐
    │ Vite web │  │ Tauri desktop   │  │ Vitest     │
    │ (browser)│  │ (same bundle,   │  │ (unit      │
    │          │  │  no domain cmd) │  │  tests)    │
    └──────────┘  └─────────────────┘  └────────────┘
                           │
                  ┌────────┴────────┐
                  │  PhysicsCore     │  (facade)
                  │  (TS, OOP)       │
                  └────────┬────────┘
                           │
   ┌───────────┬───────────┼───────────┬───────────────┐
   │           │           │           │               │
┌──┴──────┐ ┌──┴──────┐ ┌──┴──────┐ ┌──┴───────┐ ┌─────┴─────┐
│ Parser  │ │Evaluator│ │  RNG +  │ │Generator │ │ Exporters │
│         │ │         │ │ handlers│ │ + handlrs│ │ + registry│
└─────────┘ └─────────┘ └─────────┘ └──────────┘ └───────────┘
```

## Pure-TypeScript Physics Core (`src/lib/physics/`)

The core is **idiomatically object-oriented**: classes with single responsibilities, `interface`-defined contracts for extension points, the Registry and Strategy patterns for question types/exporters/variable handlers, dependency injection of the RNG into the generator for testability, and a facade class that wires the collaborators. The design follows the open-closed principle — adding a new question type, exporter, function, or variable type requires only registering a new class, not editing existing core logic.

### Facade — `PhysicsCore.ts`

Wires the collaborators (parser, evaluator, RNG, generator, exporters, formula library) and exposes the public API: `loadSpecification`, `generate`, `generateBatch`, `export`, `getFormulaLibrary`, etc. The singleton instance lives in `src/services/physicsCore.ts`.

### Domain Types — `types.ts`

Core data structures (unchanged from the Rust crate's domain):
- `Unit` — top-level organizational unit (e.g. Mechanics)
- `Topic` — topic within a unit (e.g. Kinematics)
- `Skill` — specific skill within a topic
- `QuestionTemplate` — template for generating questions with variables
- `VariableDefinition` — variable with type, range, and step
- `GeneratedQuestion` — complete generated question with answer, choices, solution
- `Specification` — container for all units, topics, skills, and templates
- `FormulaEntry` — curated physics formula entry

### Contracts — `contracts.ts`

`interface` definitions for every extension point:
- `RandomGenerator` — RNG contract (seeded, uniform)
- `VariableHandler` — variable-type handler contract (int, double, enum, …)
- `QuestionHandler` — question-type handler contract (MC, SA, TF, FB, NE)
- `Exporter` — exporter contract (HTML, PDF, Markdown, Text, JSON, CSV, LaTeX)

### Parser — `SpecificationParser.ts`

Parses `.txt` specification files with `[SECTION]` headers and key-value pairs. Supports comments (`//`), variable definitions (`Var.xxx`), and distractor expressions. The format is identical to what the Rust crate accepted, so existing `part_one.txt` files continue to parse unchanged.

### Expression Evaluator — `ExpressionEvaluator.ts`

Shunting-yard parser + RPN evaluator with:
- Basic arithmetic: `+`, `-`, `*`, `/`, `%`, unary minus
- Trigonometric: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`
- Hyperbolic: `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`
- Logarithmic: `log`, `log10`, `ln`, `log2`
- Power/root: `pow`, `sqrt`, `cbrt`
- Rounding: `floor`, `ceiling`, `truncate`, `round`
- Others: `abs`, `exp`, `sign`, `min`, `max`
- Constants: `pi`, `e`
- Unit conversion: `deg`, `rad`

### Random — `random/`

- `UniformRandomGenerator` / `SeededRandomGenerator` — RNG implementations
- `VariableGenerator` — dispatches to registered `VariableHandler`s
- `IntVariableHandler`, `DoubleVariableHandler`, `EnumVariableHandler` — built-in handlers
- `VariableTypeRegistry` — Strategy + Registry for variable types
- `TemplateSubstituter` — applies generated values to template strings

### Generator — `generator/`

- `QuestionGenerator` — orchestrates variable generation, answer evaluation, distractor generation, and choice shuffling; supports batch generation, filtering, and uniqueness
- `BaseQuestionHandler` — shared logic for question-type handlers
- `MultipleChoiceHandler`, `ShortAnswerHandler`, `TrueFalseHandler`, `FillInBlankHandler`, `NumericEntryHandler` — built-in handlers
- `QuestionTypeRegistry` — Strategy + Registry for question types

### Exporters — `exporters/`

- `ExporterRegistry` — Strategy + Registry for export formats
- `HtmlExporter` — full HTML document with MathJax
- `PdfExporter` — print-oriented HTML with A4 page setup
- `MarkdownExporter` — Markdown with LaTeX math delimiters
- `TextExporter` — plain text with letter-labeled choices
- `JsonExporter` — structured JSON array
- `CsvExporter` — comma-separated with header row
- `LatexExporter` — LaTeX document with exam class

### Formula Library — `FormulaLibrary.ts`

Curated physics formula entries (name, LaTeX form, description, category) rendered with KaTeX in the UI.

## React UI (`src/`)

### Components (`src/components/`)

Small presentational components with typed props, composable into store-backed containers.

- `layout/AppShell.tsx` — app chrome: liquid animated background, header, footer
- `ui/` — presentational primitives: `Button`, `Card`, `Modal`, `Badge`, `Pill`, `ProgressBar`, `Select`, `Slider`, `Spinner`, `Toast`, `Toolbar`, `Input`, `EmptyState`
- `practice/` — practice view: `ControlToolbarTop`, `ControlToolbarBottom`, `MainContent`, `QuestionCard`, `AnswerSection`, `AnswerCard`, `MathToolbar`, `McqToggle`, `MentalControls`, `SingleControls`, `ModeSelector`, `ResultsCard`, `TopicsSection`, `UtilityButtons`
- `modals/` — `OnboardingModal`, `SettingsModal`, `PrintModal`, `RecommendModal`, `ManageDataModal`, `ShortcutsModal`
- `ErrorBoundary.tsx` — class-component error boundary with fallback UI
- `MathRenderer.tsx`, `MathText.tsx` — KaTeX rendering helpers

### Hooks (`src/hooks/`)

One custom hook per concern:
- `useSingleMode` — Single-mode session lifecycle (generate, check, next, results)
- `useMentalMode` — Mental-mode session lifecycle (batch, countdown, auto-advance, skip, pause/resume, finish)
- `useCountdownTimer` — reusable countdown timer
- `useGlobalShortcuts` — Ctrl+G, Shift+Enter, Ctrl+1/2/,, Ctrl+Shift+T
- `useTheme` — applies theme, updates `meta[name="theme-color"]`
- `useMediaQuery` — reactive media query

### Stores (`src/stores/`)

Zustand stores, one per concern:
- `practiceStore` — active practice session state (mode, current question, score, mental batch)
- `progressStore` (persisted) — practice results history, per-topic accuracy
- `settingsStore` (persisted) — theme, font, default mode, scope, difficulty, timer, max questions, auto-continue, shuffle, MCQ choices, decimal tolerance, sound, vibration, performance toggles
- `specStore` — loaded specification state (loading, error, specification)
- `uiStore` — modal open/close state, toasts

### Styling (`src/styles/globals.css`)

The reference `style.css` is ported unlayered into `globals.css` and is the source of truth for the look (liquid background, glassmorphism surfaces, control toolbar, modals, light/dark themes via CSS variables `--surface`, `--shadow-glass`, etc.). Tailwind remains available for incidental utilities but the reference CSS drives the visual design.

### Math Rendering

KaTeX is used for fast LaTeX math rendering. `MathRenderer` renders block math; `MathText` parses inline `$...$` and block `$$...$$` delimiters in question/answer text.

## Data Flow

1. **Parse** — `SpecificationParser` reads `part_one.txt` → `Specification` (stored in `specStore`)
2. **Generate** — `QuestionGenerator.generate(specification, filter, rng)` → `GeneratedQuestion` (stored in `practiceStore`)
3. **Practice** — `useSingleMode` / `useMentalMode` drive the session; results saved to `progressStore`
4. **Export** — `PhysicsCore.export(questions, format)` → string (HTML, PDF, Markdown, Text, JSON, CSV, LaTeX)

## Tauri Desktop Shell (`src-tauri/`)

The Tauri shell wraps the same Vite bundle for desktop builds. It exposes **no domain logic**:
- `lib.rs` — Tauri bootstrap, no commands registered
- `main.rs` — Tauri main entry
- `commands.rs` — no-op module (question-gen commands removed)
- `Cargo.toml` — Tauri-only deps (no `physics_core` dependency)

The web build (plain Vite) and the Tauri build share the exact same TypeScript core.

## Build Pipeline

```
TypeScript core + React UI
        │
        ├─→ vite build → dist/  (web bundle, served by any static host)
        │
        └─→ tauri build → native desktop app (wraps the same dist/ bundle)
```

## CI/CD

GitHub Actions workflows (`.github/workflows/`):
- `code-quality.yml` — typecheck, lint, format check, test on every push/PR to main
- `security-audit.yml` — weekly npm audit + CodeQL analysis
- `release.yml` — on tagged versions: build web bundle and attach to GitHub Release
- `version-bump.yml` — manual dispatch: bump `package.json` version and open PR

Obsolete workflows (Rust CI, Flutter CI, Apple/Android builds, Flutter web deploy) have been removed since the Rust crate and Flutter app are no longer part of the architecture.

## Testing

Vitest unit tests cover every core collaborator:
- `evaluator.test.ts` — expression evaluator
- `parser.test.ts` — specification parser
- `random.test.ts` — RNG + variable handlers
- `generator.test.ts` — question generator + handlers
- `exporters.test.ts` — all exporters
- `formulaLibrary.test.ts` — formula library
- `facade.test.ts` — PhysicsCore facade
- `ocp.test.ts` — open-closed principle (registering new handlers/exporters without editing core)

Run with `npm test` (or `npm run test:coverage` for coverage).
