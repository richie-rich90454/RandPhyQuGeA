# Architecture

## Overview

RandPhyQuGeA is a single-page physics practice question generator. All domain logic — specification parsing, expression evaluation, random variable generation, question generation, and export — lives in a **pure-TypeScript OOP core** under `src/lib/physics/`. The UI is a React 19 + TypeScript app that reproduces the reference liquid/glassmorphism design. An optional Tauri shell (`src-tauri/`) wraps the same Vite bundle for desktop builds but contains no domain logic.

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

Shunting-yard parser + RPN evaluator backed by a `FunctionRegistry` (injectable via `configureCore({ functions })` for domain-specific math) with:
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
- `HtmlExporter` — full HTML document with KaTeX-rendered math
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

- `layout/AppShell.tsx` — app chrome: liquid animated background, header (`<header>`/`<nav>`), footer, skip-link, visually-hidden `<h1>`
- `ui/` — presentational primitives: `Button`, `Card`, `Modal`, `ConfirmDialog`, `Toast`/`ToastProvider`, `Badge`, `Pill`, `ProgressBar`, `Select`, `Slider`, `Spinner`, `Toolbar`, `Input`, `EmptyState` (barrel-re-exported from `index.ts`)
- `practice/` — practice view: `ControlToolbarTop`, `ControlToolbarBottom`, `MainContent`, `QuestionCard`, `AnswerSection`, `AnswerCard`, `MathToolbar`, `McqToggle`, `MentalControls`, `SingleControls`, `ModeSelector`, `ResultsCard`, `TopicsSection`, `UtilityButtons`
- `modals/` — `OnboardingModal`, `SettingsModal`, `PrintModal`, `RecommendModal`, `ManageDataModal`, `ShortcutsModal`
- `ErrorBoundary.tsx` — class-component error boundary with fallback UI
- `MathRenderer.tsx`, `MathText.tsx` — KaTeX rendering helpers; `MathText` tokenizes `$...$`, `$$...$$`, `\(...\)`, `\[...\]`, and `\$` escapes with a per-segment `display` flag

### Hooks (`src/hooks/`)

One custom hook per concern (barrel-re-exported from `src/hooks/index.ts`):
- `useSingleMode` — Single-mode session lifecycle (generate, check, next, results)
- `useMentalMode` — Mental-mode session lifecycle (batch, countdown, auto-advance, skip, pause/resume, finish)
- `usePracticeActions` — shared `check()` submission + `Shift+Enter` handler consumed by both modes
- `useCountdownTimer` — reusable countdown timer
- `useGlobalShortcuts` — Ctrl+G, Shift+Enter, Ctrl+1/2/,, Ctrl+Shift+T
- `useTheme` — applies theme, updates `meta[name="theme-color"]`
- `useMediaQuery` — reactive media query

### Stores (`src/stores/`)

Zustand stores, one per concern (barrel-re-exported from `src/stores/index.ts`):
- `practiceStore` — live session state only (current question, results, isActive, showFeedback)
- `progressStore` (persisted) — `PracticeResult` history, per-topic accuracy; exposes a `selectStats` selector for stable `PracticeStats` derivation
- `settingsStore` (persisted) — theme, font, default mode, scope, difficulty, timer, max questions, auto-continue, shuffle, MCQ choices, decimal tolerance, sound, vibration, performance toggles, **and mental-mode config** (`mentalDifficulty`, `mentalScope`, `mentalShuffle`, `mentalUnlimited`)
- `specStore` — loaded specification state (loading, error, specification)
- `uiStore` — modal open/close state, toasts

### Styling (`src/styles/globals.css`)

The reference `style.css` is ported unlayered into `globals.css` and is the source of truth for the look (liquid background, glassmorphism surfaces, control toolbar, modals, light/dark themes via CSS variables `--surface`, `--shadow-glass`, etc.). Tailwind remains available for incidental utilities but the reference CSS drives the visual design.

### LaTeX Pipeline

KaTeX is used for fast LaTeX math rendering. `MathRenderer` renders a single TeX string in inline or display mode. `MathText` is the tokenizer that splits question/answer/solution text into segments of plain text and math, recognizing:

- `$...$` — inline math
- `$$...$$` — display math
- `\(...\)` — inline math
- `\[...\]` — display math
- `\$` — literal dollar sign (escaped)

Each math segment carries a `display` flag so `MathRenderer` renders display math in display mode. Unbalanced/odd `$` is rendered literally rather than producing a bogus math segment. In the generator, `solution_latex` is the substituted LaTeX (variables applied, then `{answer}` replaced) rather than the raw template. Exporters (HTML/Markdown) and the print preview render math through the same KaTeX-based convention (no MathJax dependency).

### Resilience

- **`ToastProvider`** is mounted in `main.tsx` (wrapping `<App/>`) and exposes `useToast()`. Async failures — question generation, mental session lifecycle, and spec load — are routed through toasts instead of silent `console.error`. Toasts auto-dismiss with pause-on-hover/focus.
- **`ConfirmDialog`** (built on `Modal`) replaces every `window.confirm` call (manage-data delete, single-record delete, settings reset to defaults).
- **Async button states**: the Generate button shows a spinner and `aria-busy` during the async call and is non-clickable while in flight.
- **Skeleton loaders**: spec load and topics load render skeleton bars with `role="status"`/`aria-live="polite"`/`aria-busy` instead of bare "Loading…" text.

### Accessibility

- **Focus-visible rings** (3:1 contrast) on all primary controls (buttons, pills, choices, inputs, selects).
- **Skip-link + landmarks**: `AppShell` renders a skip-link as the first focusable element, an `<h1>` (visually-hidden), a `<header>`/`<nav aria-label="Primary">`, and `MainContent` wraps a `<main id="main-content">`.
- **`Modal` focus trap**: on open, focus moves into the dialog, Tab/Shift+Tab cycles within focusable elements, body scroll is locked, and on close focus returns to the trigger. All six modals inherit this.
- **Form/list/tab semantics**: MCQ choices use `role="radiogroup"`/`role="radio"` + `aria-checked`; the Settings basic/advanced switcher uses `role="tablist"`/`tab`/`tabpanel` with arrow-key navigation; onboarding uses `<ol>`, recommend uses `<ul>`, shortcuts uses `<thead>`/`<th scope="col">`.
- **Live regions**: timer/score/statistics announce via `aria-live="polite"`; the theme toggle uses `aria-pressed` and announces changes via toast; `ProgressBar` exposes `aria-label`/`aria-valuetext`.
- **Contrast/motion/font**: `@media (prefers-contrast-more)` and `@media (forced-colors)` provide solid fallbacks for glass surfaces; root font-size is `100%` so browser scaling works; touch targets are ≥24px (≥44px where space allows).

## Data Flow

1. **Parse** — `SpecificationParser` reads `part_one.txt` → `Specification` (stored in `specStore`)
2. **Generate** — `QuestionGenerator.generate(specification, filter, rng)` → `GeneratedQuestion` (stored in `practiceStore`)
3. **Practice** — `useSingleMode` / `useMentalMode` drive the session; results saved to `progressStore`
4. **Export** — `PhysicsCore.export(questions, format)` → string (HTML, PDF, Markdown, Text, JSON, CSV, LaTeX)

## Tauri Desktop Shell (`src-tauri/`)

The Tauri shell wraps the same Vite bundle for desktop builds. It exposes **no domain logic**:
- `lib.rs` — Tauri bootstrap, no commands registered
- `main.rs` — Tauri main entry
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
- `services/__tests__/physicsCore.test.ts` — service facade + `configureCore()` extension point

Run with `npm test` (or `npm run test:coverage` for coverage).

## License

Licensed under Apache 2.0 — see [LICENSE](./LICENSE).
