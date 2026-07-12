# RandPhyQuGeA

A pure-TypeScript physics practice question generator with a SolidJS + CSS Modules liquid/glassmorphism UI. The app generates random physics questions from a specification file (`part_one.txt`), supports focused (Single) and timed (Mental) practice modes, renders math with KaTeX, tracks progress, exports worksheets, and ships as a web app built with Vite. An optional Tauri shell wraps the same web bundle for desktop builds but contains no domain logic and no offline-exclusive affordances.

## Features

- **Pure-TypeScript physics core** (no WASM, no Rust domain logic, zero JSX) under `src/lib/physics/`
- **MCQ/FRQ decoupling** — every question type can be rendered and graded as either multiple-choice or free-response at runtime via an orthogonal `ResponseMode` dimension
- **Specification parser** for the `part_one.txt` format (Units, Topics, Skills, Templates, Variables)
- **Expression evaluator** with arithmetic, trigonometric, logarithmic, power, rounding, and unit-conversion functions (shunting-yard + RPN)
- **Pluggable question-type handlers** (Multiple Choice, Short Answer, True/False, Fill-in-the-Blank, Numeric Entry, Matching, Ordering, Multiple Response) registered via Strategy + Registry patterns
- **Pluggable exporters** (HTML, PDF, Markdown, Text, JSON, CSV, LaTeX, Anki, Quizlet) registered the same way
- **Curated physics formula library** with KaTeX rendering
- **SolidJS UI** with liquid animated background, glassmorphism surfaces, control toolbar, math toolbar, and modals
- **Two practice modes**: Single (focused, immediate feedback) and Mental (timed, batched, auto-advancing)
- **Response-mode toggle** available for all question types; universal distractor generation with significant-figures awareness
- **Smart answer checking** — `ExpressionNormalizer` recognizes equivalence (commutative reordering, fraction↔decimal, `2x`↔`2*x`) without math.js; feedback shows the correct answer in KaTeX plus a plain-text alternate
- **Command palette** (Ctrl+K) with fuzzy search for quick actions and navigation
- **Theme toggle** (system/light/dark/dim), font-size control, reduced-data mode
- **Onboarding, keyboard shortcuts, settings, print worksheet, weak-topic recommendations, manage-data, and resume-session modals**
- **Progress tracking** with per-topic accuracy, streaks, and session history
- **Accessibility**: ARIA labels, focus management, focus-trapped modals, reduced-motion support, keyboard navigation, skip-link, landmarks
- **Responsive** down to mobile; touch targets ≥44px where space allows
- **DX routes**: component playground (`/playground`), live spec editor (`/spec-editor`), template-authoring wizard (`/wizard`), and coverage/perf dashboard (`/dx`)

## Tech Stack

| Layer            | Technology                              | Description                                                                                                                  |
| ---------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **UI**           | SolidJS + TypeScript                    | Signals, `createStore`, `Show`/`For`/`Portal`/`Dynamic`, CSS Modules per component                                           |
| **Styling**      | Vanilla CSS + CSS Modules               | Co-located `*.module.css`; design tokens as CSS custom properties in `globals.css` (light/dark/dim/system). No Tailwind.     |
| **State**        | Zustand (vanilla) + Solid bridge        | `practiceStore`, `progressStore`, `settingsStore`, `specStore`, `uiStore` consumed via a `createSolidStore` accessor bridge |
| **Math**         | KaTeX                                   | Fast LaTeX rendering; single engine on main + print                                                                          |
| **Motion**       | GSAP + CSS transitions                  | `prefers-reduced-motion` guarded                                                                                             |
| **Physics core** | Pure TypeScript (OOP)                   | `src/lib/physics/` — zero JSX, zero Solid imports                                                                            |
| **Build**        | Vite                                    | Web build and dev server; `vite-plugin-solid` for the Solid app                                                              |
| **Testing**      | Vitest + `@solidjs/testing-library`     | Unit tests for the core; smoke tests for Solid components                                                                    |
| **Linting**      | oxlint                                  | `oxlint src` with a `src/solid/**` override                                                                                  |
| **Formatting**   | oxfmt                                   | `oxfmt .`                                                                                                                    |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) (20+)
- [npm](https://npmjs.com) (comes with Node)

### Install and Run

```bash
npm install
npm run dev          # Start the Vite dev server (React root entry)
npm run dev:solid    # Start the Solid preview at /src/solid/index.html
```

### Build

```bash
npm run build        # Type-check (tsc) + production build (vite build) into dist/
npm run build:solid  # Build the Solid app into dist/
npm run preview      # Preview the production build locally
```

### Quality Checks

```bash
npm run typecheck        # tsc --noEmit (React tsconfig)
npm run typecheck:solid  # tsc --noEmit -p tsconfig.solid.json (Solid tsconfig)
npm run lint             # oxlint src
npm run lint:fix         # oxlint src --fix
npm run format:check     # oxfmt --check .
npm run format:write     # oxfmt --write .
npm test                 # vitest run
npm run test:coverage    # vitest run --coverage
npm run test:watch       # vitest (watch mode)
```

CI runs typecheck, lint, format check, and tests on every push and pull request (see `.github/workflows/code-quality.yml`).

## Architecture

The codebase is split into three layers:

1. **Core** (`src/lib/physics/`) — pure-TypeScript OOP classes. Specification parser, expression evaluator, variable generator, question generator, MCQ assembler, universal distractor generator, answer grader, expression normalizer, exporters, formula library. Zero JSX, zero Solid imports. Extensible via `interface`-defined contracts and registries (Strategy + Registry pattern). The `PhysicsCore` facade wires the collaborators.
2. **Services** (`src/services/`) — a singleton `PhysicsCore.default()` exposed through an async service facade (`parseSpecification`, `generateQuestion`, `generateBatch`, `exportQuestions`, `getFormulaLibrary`, `loadDefaultSpec`). The public extension point is `configureCore(options)`, which rebuilds the singleton from injected collaborators.
3. **Solid UI** (`src/solid/`) — SolidJS components + co-located CSS Modules. Stores (Zustand-vanilla bridged to Solid accessors), primitives (`createShortcut`, `createTheme`, `createPersistedSignal`, …), `ServiceProvider` context, presentational `ui/` primitives, `practice/` toolbars and content, `modals/`, and DX pages (`/playground`, `/spec-editor`, `/wizard`, `/dx`).

**Data flow:** Spec → `PhysicsCore` → `GeneratedQuestion` → Solid Component → User → `AnswerGrader` → Feedback.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system overview, data-flow diagram, and key design decisions.

## Specification File

Questions are defined in `.txt` specification files (see `src/assets/part_one.txt`). The format uses `[SECTION]` headers with inline key-value attributes:

```
[UNIT id:kinematics name:Kinematics]
[TOPIC id:proj-motion name:"Projectile Motion" unit:kinematics]
[SKILL id:calc-trajectory name:"Calculate Trajectory" topic:proj-motion]
[TEMPLATE id:t1 skill:calc-trajectory type:MC difficulty:3 ...]
```

The TypeScript parser preserves the same format the original Rust crate accepted, so existing specs continue to parse unchanged. The live spec editor at `/spec-editor` lets you edit a spec and preview generated questions in real time.

## Project Structure

```
src/
  lib/
    physics/                  # Pure-TypeScript physics core (OOP, zero JSX)
      PhysicsCore.ts          # Facade wiring parser, evaluator, RNG, generator, exporters
      SpecificationParser.ts  # part_one.txt parser
      ExpressionEvaluator.ts  # Math expression evaluator (shunting-yard + functions)
      FormulaLibrary.ts       # Curated physics formula entries
      contracts.ts            # Interface contracts (handlers/exporters/variables/strategies)
      types.ts                # Domain types (ResponseMode, GeneratedQuestion, etc.)
      generator/              # QuestionGenerator + McqAssembler + handlers + registry
      grader/                 # AnswerGrader (per mode/type dispatch)
      normalizer/             # ExpressionNormalizer (equivalence without math.js)
      random/                 # RNG + SeededRandom + variable-type handlers + registry
      exporters/              # HTML, PDF, Markdown, Text, JSON, CSV, LaTeX, Anki, Quizlet + registry
      __tests__/              # Vitest unit tests for every collaborator
  services/
    physicsCore.ts            # Singleton PhysicsCore instance + configureCore() extension point
  solid/
    App.tsx                   # Solid root: ErrorBoundary + ToastProvider + CommandPalette + router
    main.tsx                  # Solid entry (render into #root)
    styles/                   # globals.css (design tokens) + glass.css + motion.css
    components/
      layout/                 # AppShell, AppTopBar, Footer
      ui/                     # Presentational primitives (Button, Card, Modal, Input, …)
      practice/               # ControlToolbarTop/Bottom, MainContent, QuestionCard, AnswerCard, MathToolbar, …
      modals/                 # Onboarding, Settings, Print, Recommend, ManageData, Shortcuts, ResumeSession
      CommandPalette.tsx      # Ctrl+K command palette
    primitives/               # createShortcut, createTheme, createPersistedSignal, createSpecLoader, …
    providers/                # ServiceProvider (PhysicsCore/stores via context)
    stores/                   # practiceStore, progressStore, settingsStore, specStore, uiStore (Solid bridges)
    pages/                    # Playground, SpecEditor, Wizard, DxDashboard (DX routes)
  types/
    models.ts                 # Shared UI-facing types (PracticeResult, ResponseMode, etc.)

.vscode/                      # Recommended extensions + workspace settings (force-shared)
.github/workflows/            # CI: code-quality, security-audit, release, version-bump
```

## Keyboard Shortcuts

| Shortcut       | Action                         |
| -------------- | ------------------------------ |
| `Ctrl+K`       | Open command palette           |
| `Ctrl+G`       | Generate new question          |
| `Shift+Enter`  | Check answer                   |
| `Ctrl+1`       | Switch to Single mode          |
| `Ctrl+2`       | Switch to Mental mode          |
| `Ctrl+,`       | Open Settings                  |
| `Ctrl+Shift+T` | Toggle theme                   |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, code-style rules (AGENTS.md), how to add a new physics topic or UI component, testing requirements, and the pull-request process.

## License

Licensed under Apache 2.0 — see [LICENSE](LICENSE).
