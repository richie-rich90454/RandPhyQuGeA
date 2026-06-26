# Contributing to RandPhyQuGeA

Thank you for your interest in contributing! This document describes the current stack, setup, workflow, and conventions for the project.

## Tech Stack

RandPhyQuGeA is a **pure-TypeScript** physics practice question generator. There is no WASM and no Rust domain logic — all question generation, evaluation, and export happens in TypeScript.

| Layer | Technology |
|-------|-----------|
| **UI** | React 19 + TypeScript 6 |
| **Build** | Vite 8 (web); optional Tauri shell for desktop |
| **State** | Zustand 5 |
| **Math** | KaTeX (fast LaTeX rendering) |
| **Physics core** | Pure TypeScript (OOP), `src/lib/physics/` |
| **Testing** | Vitest 4 |
| **Linting** | ESLint 10 (flat config, `eslint.config.mjs`) |
| **Formatting** | Prettier 3 |
| **Styles** | Reference CSS ported into `globals.css` (source of truth) + Tailwind for incidental utilities |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+ recommended (20+ preferred)
- [npm](https://npmjs.com) (comes with Node)

### Setup

```bash
git clone <repo-url>
cd RandPhyQuGeA
npm install
```

### Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc`) + production build (`vite build`) into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Vitest suite (118 tests across 9 files) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run typecheck` | `tsc --noEmit` type check |
| `npm run lint` | ESLint over `src/` (flat config) |
| `npm run format:check` | Prettier check over `src/**/*.{ts,tsx,css}` |
| `npm run format:write` | Prettier write over `src/**/*.{ts,tsx,css}` |

### Desktop (Optional, via Tauri)

The Tauri shell in `src-tauri/` wraps the same Vite bundle for desktop builds. It exposes **no domain logic** — all question generation happens in the TypeScript core. To build the desktop app, install the Tauri CLI separately and run `npx tauri build` (a Rust toolchain is required for the shell compilation only).

## Architecture Overview

The codebase follows the open-closed principle: adding a new question type, exporter, function, or variable type requires only registering a new class, not editing existing core logic.

### Physics Core (`src/lib/physics/`)

Idiomatically object-oriented, with classes of single responsibility and `interface`-defined contracts for every extension point. Registries (Strategy + Registry pattern) drive extensibility:

- **`PhysicsCore.ts`** — facade wiring parser, evaluator, RNG, generator, exporters, formula library
- **`SpecificationParser.ts`** — parses `part_one.txt` (Units, Topics, Skills, Templates, Variables)
- **`ExpressionEvaluator.ts`** — shunting-yard parser + RPN evaluator with a `FunctionRegistry`
- **`FormulaLibrary.ts`** — curated physics formula entries
- **`generator/`** — `QuestionGenerator` + `QuestionTypeRegistry` + handlers (MC, SA, TF, FB, NE)
- **`random/`** — `UniformRandomGenerator` / `SeededRandomGenerator`, `VariableGenerator` + `VariableTypeRegistry` + handlers (int, double, enum)
- **`exporters/`** — `ExporterRegistry` + HTML, PDF, Markdown, Text, JSON, CSV, LaTeX exporters

### Service Layer (`src/services/physicsCore.ts`)

A singleton `PhysicsCore.default()` instance is exposed through an async service facade (`parseSpecification`, `generateQuestion`, `generateBatch`, `exportQuestions`, `getFormulaLibrary`, `loadDefaultSpec`). The public extension point is **`configureCore(options)`**, which rebuilds the singleton from injected collaborators (custom `ExporterRegistry`, `FunctionRegistry`, `QuestionTypeRegistry`, `VariableTypeRegistry`, or `RandomGenerator`). Omitted options keep their defaults, so `configureCore({})` resets to the standard configuration.

### UI Layer (`src/`)

- **`components/layout/AppShell.tsx`** — app chrome (liquid background, header, footer, skip-link, landmarks)
- **`components/practice/`** — `ControlToolbarTop/Bottom`, `MainContent` (QuestionCard + AnswerSection), `MathToolbar`, `McqToggle`, `ResultsCard`, `TopicsSection`, `UtilityButtons`
- **`components/ui/`** — typed presentational primitives (`Button`, `Card`, `Modal`, `ConfirmDialog`, `Toast`/`ToastProvider`, `Spinner`, `ProgressBar`, etc.) re-exported from a barrel
- **`components/modals/`** — Onboarding, Settings, Print, Recommend, ManageData, Shortcuts
- **`components/MathRenderer.tsx` / `MathText.tsx`** — KaTeX rendering; `MathText` tokenizes `$...$`, `$$...$$`, `\(...\)`, `\[...\]`, and `\$` escapes

### Stores (`src/stores/`) — Zustand

- `practiceStore` — live session state (Single + Mental)
- `progressStore` (persisted) — `PracticeResult` history + `selectStats` selector
- `settingsStore` (persisted) — theme, font, default mode, mental config, performance toggles
- `specStore` — loaded specification state
- `uiStore` — modal open/close state

### Hooks (`src/hooks/`)

- `useSingleMode`, `useMentalMode` — per-mode session lifecycle
- `usePracticeActions` — shared `check()` submission + `Shift+Enter` handler
- `useCountdownTimer`, `useGlobalShortcuts`, `useTheme`, `useMediaQuery`

Stores and hooks each have a barrel `index.ts` re-exporting their public APIs.

## Code Style

All TypeScript/TSX source follows the rules in [`AGENTS.md`](./AGENTS.md):

- **Tabs** for indentation (one tab per nesting level)
- **No blank lines** anywhere in source files (enforced by ESLint `no-multiple-empty-lines`)
- **Same-line braces**: `function foo(){`, `if (x){`, `else if (y){`, `else{`
- **`if` / `else if` / `else`** clauses each on their own line
- **No spaces** around assignment/arithmetic/comparison operators (`let res=1;`, `a+b`, `n<0`)
- **Spaces after** commas and colons in type annotations (`a: number, b: number`)
- **`let`** for variable declarations, one per line
- **Semicolons** at the end of statements

Markdown files (`*.md`) are exempt from the no-blank-lines rule and use standard markdown conventions.

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) with **atomic, focused commits** and **imperative-mood, lowercase-first-word** messages:

- `fix:` — bug fix
- `feat:` — new feature
- `refactor:` — code refactoring (no behavior change)
- `chore:` — maintenance / tooling
- `docs:` — documentation
- `test:` — test additions/changes
- `ci:` — CI/CD changes

Example: `fix: grade MCQ answers against the correct choice index`

## Development Workflow

### Branching

- `main` — production-ready code
- Feature branches: `feat/description`
- Bug fixes: `fix/description`

### Pull Request Process

1. Fork the repository and create a focused branch
2. Make your changes, keeping commits atomic
3. Add or update tests for new functionality
4. Run the full quality gate locally:

   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm test
   npm run build
   ```

5. Update documentation (`README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`) if your change affects the public surface
6. Open a pull request with a brief description of the change and the validation results

## Filing Issues

- **Bugs**: include the reproduction steps, expected vs. actual behavior, and the relevant `npm run` output (typecheck/lint/test)
- **Features**: describe the use case and the proposed API surface; reference the relevant registry/facade where it would plug in

## Specification Format

Questions are defined in `.txt` specification files (see `src/assets/part_one.txt`). The format uses `[SECTION]` headers with inline key-value attributes:

```
[UNIT id:kinematics name:Kinematics]
[TOPIC id:proj-motion name:"Projectile Motion" unit:kinematics]
[SKILL id:calc-trajectory name:"Calculate Trajectory" topic:proj-motion]
[TEMPLATE id:t1 skill:calc-trajectory type:MC difficulty:3 ...]
```

The TypeScript parser preserves the same format the original Rust crate accepted, so existing specs continue to parse unchanged.

### Variable Types

- `int` — integer values with `Min`, `Max`
- `double` — floating point values with `Min`, `Max`, `Step`
- `enum` — enumeration with `Values: a, b, c`

### Expression Functions

Built-in math functions available in answer/distractor expressions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `pow`, `abs`, `exp`, `log`, `log10`, `ln`, `round`, `sign`, `min`, `max`, `floor`, `ceiling`, `truncate`, `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`, `cbrt`, `deg`, `rad`, and the constants `pi`, `e`.

## License

Licensed under Apache 2.0 — see [LICENSE](./LICENSE).
