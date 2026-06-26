# RandPhyQuGeA

A pure-TypeScript physics practice question generator with a liquid/glassmorphism reference UI. The app generates random physics questions from a specification file (`part_one.txt`), supports focused (Single) and timed (Mental) practice modes, exports worksheets, tracks progress, and ships as both a web app (Vite) and an optional Tauri desktop shell.

## Features

- Pure-TypeScript physics core (no WASM, no Rust domain logic)
- Specification parser for the `part_one.txt` format (Units, Topics, Skills, Templates, Variables)
- Expression evaluator with arithmetic, trigonometric, logarithmic, power, rounding, and unit-conversion functions
- Pluggable question-type handlers (Multiple Choice, Short Answer, True/False, Fill-in-the-Blank, Numeric Entry) registered via Strategy + Registry patterns
- Pluggable exporters (HTML, PDF, Markdown, Text, JSON, CSV, LaTeX) registered the same way
- Curated physics formula library with KaTeX rendering
- Reference-matched UI: liquid animated background, glassmorphism surfaces, control toolbar, math toolbar, modals
- Two practice modes: Single (focused, immediate feedback) and Mental (timed, batched, auto-advancing)
- Theme toggle (system/light/dark), font selection, performance toggles
- Onboarding, keyboard shortcuts, settings, print worksheet, weak topics, manage data modals
- Progress tracking with per-topic accuracy, streaks, and session history
- Accessibility: ARIA labels, focus management, reduced-motion support, keyboard navigation
- Responsive down to mobile

## Architecture

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Physics Core** | TypeScript (OOP) | Specification parser, expression evaluator, random variable generation, question generator, exporters, formula library |
| **State** | Zustand | `practiceStore`, `progressStore`, `settingsStore` (persisted), `specStore`, `uiStore` |
| **UI** | React 18 + TypeScript | Composable presentational components, store-backed containers, custom hooks per concern |
| **Styling** | Reference CSS + Tailwind | Reference `style.css` ported into `globals.css` is the source of truth; Tailwind for incidental utilities |
| **Math** | KaTeX | Fast LaTeX math rendering |
| **Build** | Vite | Web build; Tauri shell wraps the same bundle for desktop |

The TypeScript core is **idiomatically object-oriented**: classes with single responsibilities, `interface`-defined contracts for extension points, the Registry and Strategy patterns for question types/exporters/variable handlers, dependency injection of the RNG into the generator for testability, and a facade class (`PhysicsCore`) that wires the collaborators and exposes the public API. The design follows the open-closed principle — adding a new question type, exporter, function, or variable type requires only registering a new class, not editing existing core logic.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture diagram and module responsibilities.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) (20+)
- [npm](https://npmjs.com) (comes with Node)

### Install and Run (Web)

```bash
npm install
npm run dev      # Start Vite dev server at http://localhost:1420
```

### Build

```bash
npm run build    # Type-check (tsc) + production build (vite build) into dist/
npm run preview  # Preview the production build locally
```

### Desktop (Optional, via Tauri)

The Tauri shell in `src-tauri/` wraps the same Vite bundle for desktop builds. It exposes no domain logic — all question generation happens in the TypeScript core.

```bash
# Requires Rust toolchain and Tauri CLI installed separately
cd src-tauri
cargo build
```

## Quality Checks

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint src --ext .ts,.tsx
npm run format:check   # prettier --check
npm run format:write   # prettier --write
npm test               # vitest run
npm run test:coverage  # vitest run --coverage
npm run test:watch     # vitest (watch mode)
```

CI runs typecheck, lint, format check, and tests on every push and pull request (see `.github/workflows/code-quality.yml`).

## Specification File

Place your `part_one.txt` in `src/assets/`. Format:

```
[UNIT id:kinematics name:Kinematics]
[TOPIC id:proj-motion name:"Projectile Motion" unit:kinematics]
[SKILL id:calc-trajectory name:"Calculate Trajectory" topic:proj-motion]
[TEMPLATE id:t1 skill:calc-trajectory type:MC difficulty:3 ...]
```

See `src/assets/part_one.txt` for the full example. The TypeScript parser preserves the same format the Rust crate used, so existing specs continue to parse unchanged.

## Project Structure

```
src/
  lib/
    physics/                  # Pure-TypeScript physics core (OOP)
      ExpressionEvaluator.ts  # Math expression evaluator (shunting-yard + functions)
      FormulaLibrary.ts       # Curated physics formula entries
      PhysicsCore.ts          # Facade wiring parser, evaluator, RNG, generator, exporters
      SpecificationParser.ts  # part_one.txt parser
      contracts.ts            # Interface contracts for handlers/exporters/variables
      types.ts                # Domain types (Unit, Topic, Skill, Template, etc.)
      exporters/              # HTML, PDF, Markdown, Text, JSON, CSV, LaTeX exporters + registry
      generator/              # QuestionGenerator + question-type handlers + registry
      random/                 # RNG implementations + variable-type handlers + registry
      __tests__/              # Vitest unit tests for every collaborator
  services/
    physicsCore.ts            # Singleton PhysicsCore instance and helpers
    streakService.ts          # Daily streak tracking
  stores/
    practiceStore.ts          # Active practice session state (Single + Mental)
    progressStore.ts          # Persisted practice results history
    settingsStore.ts          # Persisted user settings (theme, font, mode, etc.)
    specStore.ts              # Loaded specification state
    uiStore.ts                # Modal open/close state, toasts
  hooks/
    useCountdownTimer.ts      # Reusable countdown timer
    useGlobalShortcuts.ts     # Ctrl+G, Shift+Enter, Ctrl+1/2/,, Ctrl+Shift+T
    useMentalMode.ts          # Mental-mode session lifecycle
    useSingleMode.ts          # Single-mode session lifecycle
    useTheme.ts               # Theme application + meta theme-color updates
    useMediaQuery.ts          # Reactive media query hook
  components/
    layout/AppShell.tsx       # App chrome (liquid bg, header, footer)
    ui/                       # Presentational primitives (Button, Card, Modal, etc.)
    practice/                 # Practice view components (toolbar, question card, answer, math toolbar)
    modals/                   # Onboarding, Settings, Print, Recommend, ManageData, Shortcuts
    ErrorBoundary.tsx         # Class-component error boundary
    MathRenderer.tsx          # KaTeX renderer
    MathText.tsx              # Inline/block math text helpers
  styles/
    globals.css               # Reference CSS ported unlayered + app-specific styles
  types/
    models.ts                 # Shared UI-facing types (PracticeResult, etc.)
  App.tsx                     # App root: spec load, onboarding, modals, error states
  main.tsx                    # React entry, ErrorBoundary wrap

src-tauri/                    # Optional Tauri desktop shell (no domain logic)
  src/
    lib.rs                    # Tauri bootstrap (no commands registered)
    main.rs                   # Tauri main entry
    commands.rs               # No-op module (question-gen commands removed)
  Cargo.toml                  # Tauri-only deps (no physics_core)
  tauri.conf.json             # Tauri window config

reference/                    # Reference design (index.html + style.css) — not shipped
.github/workflows/            # CI: code-quality, security-audit, release, version-bump
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+G` | Generate new question |
| `Shift+Enter` | Check answer |
| `Ctrl+1` | Switch to Single mode |
| `Ctrl+2` | Switch to Mental mode |
| `Ctrl+,` | Open Settings |
| `Ctrl+Shift+T` | Toggle theme |

## License

Apache 2.0
