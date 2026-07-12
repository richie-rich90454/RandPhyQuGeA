# Architecture

## Overview

RandPhyQuGeA is a single-page physics practice question generator. All domain logic — specification parsing, expression evaluation, random variable generation, question generation, grading, and export — lives in a **pure-TypeScript OOP core** under `src/lib/physics/`. The UI is a SolidJS + TypeScript app with co-located CSS Modules that reproduces the reference liquid/glassmorphism design. An optional Tauri shell (`src-tauri/`) wraps the same Vite bundle for desktop builds but contains no domain logic and no offline-exclusive affordances.

No WASM, no Rust domain logic, no FFI. The web build and the Tauri build share the exact same TypeScript core. The React 19 surface that preceded SolidJS has been removed; the SolidJS app under `src/solid/` is the sole UI.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Solid UI (src/solid/)                          │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────────────────┐   │
│  │  Components  │ │  Primitives   │ │   Stores (Zustand vanilla  │   │
│  │   - layout   │ │  createX(...) │ │   bridged to Solid)        │   │
│  │   - ui       │ │   - shortcut  │ │   - practiceStore          │   │
│  │   - practice │ │   - theme     │ │   - progressStore (persist)│   │
│  │   - modals   │ │   - specLoader│ │   - settingsStore (persist)│   │
│  │   - CommandP │ │   - countdown │ │   - specStore              │   │
│  │   - DX pages │ │   - gsap ...  │ │   - uiStore                │   │
│  └──────────────┘ └───────────────┘ └────────────────────────────┘   │
│                          │                                           │
│                  ┌───────┴────────┐                                  │
│                  │ providers/      │                                 │
│                  │ ServiceProvider │  (context: PhysicsCore + stores)│
│                  └───────┬────────┘                                  │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴─────┐  ┌────────┴────────┐  ┌─────┴──────┐
    │ Vite web │  │ Tauri desktop   │  │ Vitest     │
    │ (browser)│  │ (same bundle,   │  │ (unit +    │
    │          │  │  no domain cmd) │  │  smoke)    │
    └──────────┘  └─────────────────┘  └────────────┘
                           │
                  ┌────────┴────────┐
                  │  PhysicsCore     │  (facade, OOP)
                  │  (TS, zero JSX)  │
                  └────────┬────────┘
                           │
   ┌───────────┬───────────┼───────────┬───────────────┐
   │           │           │           │               │
┌──┴──────┐ ┌──┴──────┐ ┌──┴──────┐ ┌──┴───────┐ ┌─────┴─────┐
│ Parser  │ │Evaluator│ │  RNG +  │ │Generator │ │ Exporters │
│         │ │ + funcs │ │ handlers│ │ + handlrs│ │ + registry│
└─────────┘ └─────────┘ └─────────┘ └──────────┘ └───────────┘
```

## Layer 1 — Pure-TypeScript Physics Core (`src/lib/physics/`)

The core is **idiomatically object-oriented**: classes with single responsibilities, `interface`-defined contracts for extension points, the Registry and Strategy patterns for question types, exporters, and variable handlers, dependency injection of the RNG into the generator for testability, and a facade class that wires the collaborators. The design follows the open-closed principle — adding a new question type, exporter, function, or variable type requires only registering a new class, not editing existing core logic. The core imports **zero JSX and zero Solid** symbols, so it can be unit-tested in isolation and reused by any host (web, Tauri, CLI, future targets).

### Facade — `PhysicsCore.ts`

Wires the collaborators (parser, evaluator, RNG, generator, grader, exporters, formula library, distractor generator, normalizer) and exposes the public API: `loadSpecification`, `generate`, `generateBatch`, `export`, `getFormulaLibrary`, etc. The singleton instance lives in `src/services/physicsCore.ts`.

### Domain Types — `types.ts`

Core data structures:

- `Unit` — top-level organizational unit (e.g. Mechanics)
- `Topic` — topic within a unit (e.g. Kinematics)
- `Skill` — specific skill within a topic
- `QuestionTemplate` — template for generating questions with variables
- `VariableDefinition` — variable with type, range, and step
- `GeneratedQuestion` — complete generated question with answer, choices, solution
- `ResponseMode` — orthogonal dimension (`"MCQ" | "FRQ"`) decoupled from question type
- `Specification` — container for all units, topics, skills, and templates
- `FormulaEntry` — curated physics formula entry

### Contracts — `contracts.ts`

`interface` definitions for every extension point:

- `RandomGenerator` — RNG contract (seeded, uniform)
- `VariableHandler` — variable-type handler contract (int, double, enum, bool, set, …)
- `QuestionHandler` — question-type handler contract (MC, SA, TF, FB, NE, Matching, Ordering, Multiple Response)
- `Exporter` — exporter contract (HTML, PDF, Markdown, Text, JSON, CSV, LaTeX, Anki, Quizlet)

### Parser — `SpecificationParser.ts`

Parses `.txt` specification files with `[SECTION]` headers and key-value pairs. Supports comments (`//`), variable definitions (`Var.xxx`), and distractor expressions. The format is identical to what the original Rust crate accepted, so existing `part_one.txt` files continue to parse unchanged.

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
- `IntVariableHandler`, `DoubleVariableHandler`, `EnumVariableHandler`, `BoolVariableHandler`, `SetVariableHandler` — built-in handlers
- `VariableTypeRegistry` — Strategy + Registry for variable types
- `TemplateSubstituter` — applies generated values to template strings

### Generator — `generator/`

- `QuestionGenerator` — orchestrates variable generation, answer evaluation, distractor generation, and choice shuffling; supports batch generation, filtering, and uniqueness
- `BaseQuestionHandler` — shared logic for question-type handlers
- `MultipleChoiceHandler`, `ShortAnswerHandler`, `TrueFalseHandler`, `FillInBlankHandler`, `NumericEntryHandler`, `MatchingHandler`, `OrderingHandler`, `MultipleResponseHandler` — built-in handlers
- `McqAssembler` / `MultipleResponseAssembler` — choice assembly with significant-figures awareness
- `UniversalDistractorGenerator` — type-aware distractor strategies (numeric, boolean, matching, ordering, short-answer neighbor, blank-token)
- `QuestionTypeRegistry` — Strategy + Registry for question types

### Grader — `grader/`

- `AnswerGrader` — per-mode/per-type dispatch for grading user responses
- `ExpressionNormalizer` — recognizes equivalence (commutative reordering, fraction↔decimal, `2x`↔`2*x`) **without** math.js

### Exporters — `exporters/`

- `ExporterRegistry` — Strategy + Registry for export formats
- `HtmlExporter`, `PdfExporter`, `MarkdownExporter`, `TextExporter`, `JsonExporter`, `CsvExporter`, `LatexExporter`, `AnkiExporter`, `QuizletExporter`

### Cross-Cutting Modules

The core also ships self-contained modules that the UI consumes on demand: `adaptive/` (AdaptiveDifficulty), `annotation/`, `format/` (ScientificNotation, SigFigFormatter), `gamification/` (Achievements, DailyGoals, LocalLeaderboard), `hints/`, `history/` (Bookmarks, QuestionHistory), `questionset/` (QuestionSet + IO), `reference/` (ConstantsReference, Glossary), `session/` (SessionTags, TimedChallenge), `share/` (ShareLinkCodec), `solution/` (WorkedSolution), `spaced/` (SpacedRepetitionQueue), and `units/` (DimensionalAnalysisChecker, UnitComparator, UnitConverter, UnitRegistry).

## Layer 2 — Services (`src/services/`)

A thin service facade exposes the singleton `PhysicsCore.default()` through an async API consumed by Solid primitives and stores:

- `parseSpecification(text)` → `Specification`
- `generateQuestion(spec, filter?)` → `GeneratedQuestion`
- `generateBatch(spec, count, filter?)` → `GeneratedQuestion[]`
- `exportQuestions(questions, format)` → `string`
- `loadDefaultSpec()` → `string` (reads the bundled `part_one.txt`)
- `getFormulaLibrary()` → `FormulaEntry[]`
- `configureCore(options)` — rebuilds the singleton from injected collaborators (the public extension point for tests and plugins)

Contracts (`src/services/contracts.ts`) define `ISessionService` and related interfaces so the Solid layer depends on abstractions, not concretions.

## Layer 3 — Solid UI (`src/solid/`)

### App Shell — `App.tsx`

The Solid root composes `ErrorBoundaryRetry` → `ToastProvider` → `CommandPalette` (always mounted for Ctrl+K) → `ServiceProvider` → `AppShell` (layout chrome) → practice content. A hash-based router renders DX pages (`/playground`, `/spec-editor`, `/wizard`, `/dx`) when the `window.location.hash` matches; otherwise the main practice surface is shown. `@solidjs/router` is intentionally not a dependency.

### Components (`src/solid/components/`)

- `layout/` — `AppShell`, `AppTopBar`, `Footer` (skip-link, landmarks, version/copyright)
- `ui/` — presentational primitives barrel-re-exported from `index.ts`: `Button`, `Card`, `Modal`, `ConfirmDialog`, `Toast`/`ToastProvider`, `Badge`, `Pill`, `ProgressBar`, `Select`, `Slider`, `Spinner`, `Switch`, `Tabs`, `Tooltip`, `Accordion`, `EmptyState`, `Input`, `Toolbar`
- `practice/` — `ControlToolbarTop`, `ControlToolbarBottom`, `MainContent`, `QuestionCard`, `AnswerSection`, `AnswerCard`, `MathToolbar`, `McqToggle`, `MentalControls`, `SingleControls`, `ModeSelector`, `ResultsCard`, `TopicsSection`, `UtilityButtons`
- `modals/` — `OnboardingModal`, `SettingsModal`, `PrintModal`, `RecommendModal`, `ManageDataModal`, `ShortcutsModal`, `ResumeSessionModal`
- `CommandPalette.tsx` — Ctrl+K palette with fuzzy search, section grouping, keyboard nav, 13 default commands
- `ErrorBoundary.tsx` — Solid error boundary with retry fallback
- `MathRenderer.tsx` / `MathText.tsx` — KaTeX rendering; `MathText` tokenizes `$...$`, `$$...$$`, `\(...\)`, `\[...\]`, and `\$` escapes
- `LiquidBackground.tsx` — decorative animated blobs (`aria-hidden`)
- `A11yLiveRegion.tsx`, `Motion.tsx`, `ProgressPanel.tsx`

### Primitives (`src/solid/primitives/`)

Solid primitives (functions returning accessors/disposers, no JSX) replace React hooks. Each is independently testable and owns its `onMount`/`onCleanup` lifecycle:

- `createShortcut` — scoped keyboard shortcut with strict modifier matching
- `createGlobalShortcuts` — app-level shortcuts (Ctrl+1/2/,/Shift+T/G)
- `createTheme` — applies `data-theme` and updates `meta[name="theme-color"]`
- `createSpecLoader` — async spec load with loading/error accessors
- `createSessionSnapshot` — resume/discard a saved session
- `createPracticeActions` — shared `check()` submission
- `createMcqHotReconfig` — hot-swap MCQ config without regenerating
- `createCountdownTimer`, `createCountUp` — timers
- `createMediaQuery`, `createReducedMotion` — reactive media queries
- `createPersistedSignal`, `createPersistedStore` — localStorage-backed reactive state
- `createGsapContext` — GSAP context for scoped animations

### Providers (`src/solid/providers/`)

`ServiceProvider` exposes the `PhysicsCore` instance and stores via Solid context, so descendants access services through `useContext` rather than imports. This keeps components testable with injected fakes.

### Stores (`src/solid/stores/`)

Zustand **vanilla** stores (not the React binding) bridged to Solid via `createSolidStore`, which returns a Solid accessor that re-runs when the store emits. One store per concern:

- `practiceStore` — live session state only (current question, results, isActive, showFeedback)
- `progressStore` (persisted) — `PracticeResult` history, per-topic accuracy; exposes a `selectStats` selector
- `settingsStore` (persisted) — theme, font, default mode, scope, difficulty, timer, max questions, auto-continue, shuffle, MCQ choices, decimal tolerance, sound, vibration, performance toggles, and mental-mode config
- `specStore` — loaded specification state (loading, error, specification)
- `uiStore` — modal open/close state, toasts

### Styling (`src/solid/styles/`)

- `globals.css` — design tokens as CSS custom properties (`--surface-glass-strong`, `--glass-blur`, `--glass-shadow`, spacing/radius/shadow/motion/z-index scales) plus base reset. Light is the default; `:root[data-theme="dark|dim"]` and `@media (prefers-color-scheme: dark)` for `data-theme="system"` provide the dark/dim/system variants. **No Tailwind.**
- `glass.css` — glassmorphism utility surfaces
- `motion.css` — keyframe animations with `prefers-reduced-motion` guards

Each component co-locates a `*.module.css` file consumed via Vite's CSS Modules pipeline.

### LaTeX Pipeline

KaTeX renders math. `MathRenderer` renders a single TeX string in inline or display mode. `MathText` tokenizes question/answer/solution text into segments of plain text and math, recognizing:

- `$...$` — inline math
- `$$...$$` — display math
- `\(...\)` — inline math
- `\[...\]` — display math
- `\$` — literal dollar sign (escaped)

Each math segment carries a `display` flag so `MathRenderer` renders display math in display mode. Unbalanced/odd `$` renders literally. In the generator, `solution_latex` is the substituted LaTeX (variables applied, then `{answer}` replaced). Exporters and the print preview render math through the same KaTeX convention (no MathJax dependency).

### Resilience

- **`ToastProvider`** is mounted in `App.tsx` and exposes `useToast()`. Async failures — question generation, mental session lifecycle, spec load — route through toasts instead of silent `console.error`. Toasts auto-dismiss with pause-on-hover/focus.
- **`ConfirmDialog`** (built on `Modal`) replaces every `window.confirm` call.
- **Async button states**: the Generate button shows a spinner and `aria-busy` during the async call and is non-clickable while in flight.
- **Skeleton loaders**: spec load and topics load render skeleton bars with `role="status"`/`aria-live="polite"`/`aria-busy`.

### Accessibility

- **Focus-visible rings** (3:1 contrast) on all primary controls.
- **Skip-link + landmarks**: `AppShell` renders a skip-link as the first focusable element, a visually-hidden `<h1>`, a `<header>`/`<nav aria-label="Primary">`, and `MainContent` wraps `<main id="main-content">`.
- **`Modal` focus trap**: on open, focus moves into the dialog, Tab/Shift+Tab cycles within focusable elements, body scroll is locked, and on close focus returns to the trigger.
- **Form/list/tab semantics**: MCQ choices use `role="radiogroup"`/`role="radio"` + `aria-checked`; the Settings basic/advanced switcher uses `role="tablist"`/`tab`/`tabpanel` with arrow-key navigation.
- **Live regions**: timer/score/statistics announce via `aria-live="polite"`; `ProgressBar` exposes `aria-label`/`aria-valuetext`.
- **Contrast/motion/font**: `@media (prefers-contrast-more)` and `@media (forced-colors)` provide solid fallbacks for glass surfaces; root font-size is `100%`; touch targets are ≥24px (≥44px where space allows).

## Data Flow

1. **Parse** — `SpecificationParser` reads `part_one.txt` → `Specification` (stored in `specStore`)
2. **Generate** — `QuestionGenerator.generate(specification, filter, rng)` → `GeneratedQuestion` (stored in `practiceStore`)
3. **Practice** — Solid primitives (`createPracticeActions`, `createMcqHotReconfig`, `createSessionSnapshot`) drive the session; results saved to `progressStore`
4. **Grade** — `AnswerGrader` compares the user response against the generated answer using the `ExpressionNormalizer` for equivalence
5. **Export** — `PhysicsCore.export(questions, format)` → string (HTML, PDF, Markdown, Text, JSON, CSV, LaTeX, Anki, Quizlet)

```
part_one.txt
     │
     ▼
SpecificationParser ──► Specification ──► specStore
                                            │
                                            ▼
                                   QuestionGenerator
                                            │
                                            ▼
                                   GeneratedQuestion
                                            │
                            ┌───────────────┴───────────────┐
                            ▼                               ▼
                      practiceStore                  AnswerGrader
                            │                               ▲
                            ▼                               │
                       Solid UI ────────── user response ───┘
                                            │
                                            ▼
                                      progressStore
                                            │
                                            ▼
                                 Exporters (on demand)
```

## Key Design Decisions

1. **OOP core, zero JSX** — `src/lib/physics/` contains zero Solid/JSX imports. This keeps the domain testable in pure Vitest and reusable across hosts. The React→Solid migration touched only `src/solid/`; the core was untouched.
2. **MCQ/FRQ decoupling** — `ResponseMode` is an orthogonal dimension on `GeneratedQuestion`. Every question type can be rendered and graded as either multiple-choice or free-response at runtime. The `McqToggle` component and `createMcqHotReconfig` primitive let users swap modes without regenerating the question.
3. **Solid signals, no React hooks** — Primitives are plain functions returning accessors/disposers; they own `onMount`/`onCleanup`. There are no dependency arrays (Solid's fine-grained reactivity tracks dependencies automatically).
4. **Zustand vanilla + Solid bridge** — Stores are framework-agnostic Zustand vanilla stores; `createSolidStore` subscribes Solid to them. This avoids a hard Zustand-React dependency and keeps stores reusable.
5. **CSS Modules, no Tailwind** — Co-located `*.module.css` per component; design tokens in `globals.css`. Scoped class names prevent leakage; tokens enable theming without utility-class churn.
6. **Hash-based routing** — `@solidjs/router` is intentionally not a dependency. DX routes (`/playground`, `/spec-editor`, `/wizard`, `/dx`) render conditionally on `window.location.hash`. The command palette navigates by setting the hash.
7. **Strategy + Registry everywhere** — Question types, exporters, variable handlers, and distractor strategies are all `interface`-based with a registry. Adding a new one is additive, not invasive (see `ocp.test.ts`).
8. **Service facade + `configureCore`** — The singleton `PhysicsCore.default()` is the only concrete dependency the UI holds. Tests and plugins swap collaborators through `configureCore(options)` without touching the facade.

## Directory Structure

```
src/
  lib/
    physics/                  # Pure-TypeScript physics core (OOP, zero JSX)
      PhysicsCore.ts          # Facade wiring all collaborators
      SpecificationParser.ts  # part_one.txt parser
      ExpressionEvaluator.ts  # Shunting-yard + RPN evaluator
      FormulaLibrary.ts       # Curated physics formula entries
      contracts.ts            # Interface contracts
      types.ts                # Domain types (ResponseMode, GeneratedQuestion, …)
      generator/              # QuestionGenerator + handlers + McqAssembler + strategies
      grader/                 # AnswerGrader + ExpressionNormalizer
      random/                 # RNG + variable handlers + registry + TemplateSubstituter
      exporters/              # HTML/PDF/Markdown/Text/JSON/CSV/LaTeX/Anki/Quizlet + registry
      adaptive/ annotation/ format/ gamification/ hints/ history/
      questionset/ reference/ session/ share/ solution/ spaced/ units/
      __tests__/              # Vitest unit tests for every collaborator
  services/
    physicsCore.ts            # Singleton PhysicsCore + configureCore() extension point
    contracts.ts              # ISessionService and related service interfaces
  solid/
    App.tsx                   # Solid root: ErrorBoundary + ToastProvider + CommandPalette + router
    main.tsx                  # Solid entry (render into #root)
    index.html                # Solid Vite entry HTML
    solid-env.d.ts            # Solid env type declarations
    styles/                   # globals.css (tokens) + glass.css + motion.css
    components/
      layout/                 # AppShell, AppTopBar, Footer
      ui/                     # Presentational primitives (Button, Card, Modal, …) + index.ts barrel
      practice/               # ControlToolbar*, MainContent, QuestionCard, AnswerCard, MathToolbar, …
      modals/                 # Onboarding, Settings, Print, Recommend, ManageData, Shortcuts, ResumeSession
      CommandPalette.tsx      # Ctrl+K command palette
      ErrorBoundary.tsx, MathRenderer.tsx, MathText.tsx, LiquidBackground.tsx,
      A11yLiveRegion.tsx, Motion.tsx, ProgressPanel.tsx
    primitives/               # createShortcut, createTheme, createSpecLoader, createCountdownTimer, …
    providers/                # ServiceProvider (PhysicsCore + stores via context)
    stores/                   # practiceStore, progressStore, settingsStore, specStore, uiStore + createSolidStore
    __tests__/                # smoke tests + setup + ErrorBoundary/a11y tests
  types/
    models.ts                 # Shared UI-facing types (PracticeResult, ResponseMode, etc.)

.vscode/                      # Recommended extensions + workspace settings (force-shared)
.github/workflows/            # CI: code-quality, security-audit, release, version-bump
src-tauri/                    # Optional desktop shell (no domain logic, no offline-exclusive affordances)
```

## Tauri Desktop Shell (`src-tauri/`)

The Tauri shell wraps the same Vite bundle for desktop builds. It exposes **no domain logic**:

- `lib.rs` — Tauri bootstrap, no commands registered
- `main.rs` — Tauri main entry
- `Cargo.toml` — Tauri-only deps (no `physics_core` dependency)

The web build (plain Vite) and the Tauri build share the exact same TypeScript core.

## Build Pipeline

```
TypeScript core + Solid UI
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

## Testing Strategy

Vitest is the sole test runner. Two tiers of coverage:

### Core unit tests (`src/lib/physics/__tests__/`)

Pure-TypeScript, no DOM, no Solid. Cover every collaborator:

- `evaluator.test.ts`, `evaluatorFunctions.test.ts` — expression evaluator + function registry
- `parser.test.ts`, `parserSections.test.ts` — specification parser
- `random.test.ts`, `seededRandom.test.ts`, `setVariableHandler.test.ts` — RNG + variable handlers
- `generator.test.ts`, `matchingHandler.test.ts`, `multipleResponseHandler.test.ts`, `orderingHandler.test.ts` — question generator + handlers
- `mcqAssembler.test.ts`, `universalDistractorGenerator.test.ts`, `numericDistractorStrategy.test.ts` — MCQ assembly + distractors
- `exporters.test.ts`, `ankiExporter.test.ts`, `quizletExporter.test.ts` — all exporters
- `answerGrader.test.ts`, `expressionNormalizer.test.ts` — grading + equivalence
- `responseModeMatrix.test.ts` — MCQ/FRQ decoupling matrix
- `facade.test.ts`, `physicsCoreHardening.test.ts`, `ocp.test.ts` — facade + open-closed principle
- Plus focused tests for adaptive, annotation, format, gamification, hints, history, questionset, reference, session, share, solution, spaced, and units modules

### Solid smoke/component tests (`src/solid/`)

jsdom + `@solidjs/testing-library`. Cover component rendering, interaction, and primitive behavior:

- `__tests__/smoke/` — layout, controls, main-content, math, modals, primitives, progress, results, toolbars, ui-primitives
- `components/__tests__/` — per-component tests (Button, Card, Modal, CommandPalette, …)
- `components/layout/__tests__/`, `components/ui/__tests__/`, `components/practice/__tests__/`, `components/modals/__tests__/` — nested component tests
- `primitives/__tests__/` — per-primitive tests
- `stores/__tests__/` — per-store tests
- `providers/__tests__/` — ServiceProvider context tests
- `__tests__/setup.ts` — jest-dom matchers + jsdom polyfills

Run with `npm test` (or `npm run test:coverage` for coverage). The Solid tsconfig (`tsconfig.solid.json`) is type-checked separately with `npm run typecheck:solid`.

## License

Licensed under Apache 2.0 — see [LICENSE](./LICENSE).
