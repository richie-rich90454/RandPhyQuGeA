# Contributing to RandPhyQuGeA

Thank you for your interest in contributing. This document covers the current stack, setup, workflow, and conventions for the project. Read [`AGENTS.md`](./AGENTS.md) for the authoritative code-style rules and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the system overview.

## Tech Stack

RandPhyQuGeA is a **pure-TypeScript** physics practice question generator. There is no WASM and no Rust domain logic — all question generation, evaluation, grading, and export happens in TypeScript. The UI is SolidJS.

| Layer            | Technology                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| **UI**           | SolidJS + TypeScript                                                                                |
| **Styling**      | Vanilla CSS + CSS Modules (co-located `*.module.css`); design tokens in `globals.css`. No Tailwind. |
| **State**        | Zustand (vanilla) + Solid bridge (`createSolidStore`)                                               |
| **Math**         | KaTeX (fast LaTeX rendering)                                                                        |
| **Motion**       | GSAP + CSS transitions (`prefers-reduced-motion` guarded)                                           |
| **Physics core** | Pure TypeScript (OOP), `src/lib/physics/` (zero JSX, zero Solid imports)                            |
| **Build**        | Vite (`vite-plugin-solid` for the Solid app); optional Tauri shell for desktop                      |
| **Testing**      | Vitest + `@solidjs/testing-library`                                                                 |
| **Linting**      | oxlint (`oxlint src`)                                                                               |
| **Formatting**   | oxfmt (`oxfmt .`)                                                                                   |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [npm](https://npmjs.com) (comes with Node)

### Setup

```bash
git clone <repo-url>
cd RandPhyQuGeA
npm install
```

### Common Commands

| Command                   | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `npm run dev:solid`       | Start the Solid Vite dev server                        |
| `npm run build:solid`     | Build the Solid app into `dist/`                       |
| `npm run preview`         | Preview the production build locally                   |
| `npm test`                | Run the full Vitest suite                              |
| `npm run test:coverage`   | Run tests with coverage                                |
| `npm run test:watch`      | Run Vitest in watch mode                               |
| `npm run typecheck:solid` | `tsc --noEmit -p tsconfig.solid.json` (Solid tsconfig) |
| `npm run typecheck`       | `tsc --noEmit` (root tsconfig)                         |
| `npm run lint`            | oxlint over `src/`                                     |
| `npm run lint:fix`        | oxlint over `src/` with `--fix`                        |
| `npm run format:check`    | oxfmt check over the repository                        |
| `npm run format:write`    | oxfmt write over the repository                        |

The Solid tsconfig (`tsconfig.solid.json`) sets `jsx: "preserve"` and `jsxImportSource: "solid-js"` and includes `src/solid`. Keep both tsconfigs green.

### Desktop (Optional, via Tauri)

The Tauri shell in `src-tauri/` wraps the same Vite bundle for desktop builds. It exposes **no domain logic** and no offline-exclusive affordances — all question generation happens in the TypeScript core. To build the desktop app, install the Tauri CLI separately and run `npx tauri build` (a Rust toolchain is required for the shell compilation only).

## Architecture Overview

The codebase follows the open-closed principle: adding a new question type, exporter, function, or variable type requires only registering a new class, not editing existing core logic. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full diagram and data flow.

### Physics Core (`src/lib/physics/`)

Idiomatically object-oriented, with classes of single responsibility and `interface`-defined contracts for every extension point. Registries (Strategy + Registry pattern) drive extensibility. The core imports **zero JSX and zero Solid** symbols.

- **`PhysicsCore.ts`** — facade wiring parser, evaluator, RNG, generator, grader, exporters, formula library
- **`SpecificationParser.ts`** — parses `part_one.txt` (Units, Topics, Skills, Templates, Variables)
- **`ExpressionEvaluator.ts`** — shunting-yard parser + RPN evaluator with a `FunctionRegistry`
- **`FormulaLibrary.ts`** — curated physics formula entries
- **`generator/`** — `QuestionGenerator` + `QuestionTypeRegistry` + handlers (MC, SA, TF, FB, NE, Matching, Ordering, Multiple Response) + `McqAssembler` + `UniversalDistractorGenerator`
- **`grader/`** — `AnswerGrader` + `ExpressionNormalizer` (equivalence without math.js)
- **`random/`** — `UniformRandomGenerator` / `SeededRandomGenerator`, `VariableGenerator` + `VariableTypeRegistry` + handlers (int, double, enum, bool, set)
- **`exporters/`** — `ExporterRegistry` + HTML, PDF, Markdown, Text, JSON, CSV, LaTeX, Anki, Quizlet exporters

### Service Layer (`src/services/physicsCore.ts`)

A singleton `PhysicsCore.default()` instance is exposed through an async service facade (`parseSpecification`, `generateQuestion`, `generateBatch`, `exportQuestions`, `getFormulaLibrary`, `loadDefaultSpec`). The public extension point is **`configureCore(options)`**, which rebuilds the singleton from injected collaborators (custom `ExporterRegistry`, `FunctionRegistry`, `QuestionTypeRegistry`, `VariableTypeRegistry`, or `RandomGenerator`). Omitted options keep their defaults, so `configureCore({})` resets to the standard configuration.

### Solid UI (`src/solid/`)

- **`App.tsx`** — Solid root: `ErrorBoundaryRetry` → `ToastProvider` → `CommandPalette` → `ServiceProvider` → `AppShell` → practice content + hash-based DX routes
- **`components/layout/`** — `AppShell`, `AppTopBar`, `Footer` (skip-link, landmarks, version/copyright)
- **`components/ui/`** — typed presentational primitives (`Button`, `Card`, `Modal`, `ConfirmDialog`, `Toast`/`ToastProvider`, `Spinner`, `ProgressBar`, `Switch`, `Tabs`, `Tooltip`, `Accordion`, `EmptyState`, `Input`, `Toolbar`, …) barrel-re-exported from `index.ts`
- **`components/practice/`** — `ControlToolbarTop/Bottom`, `MainContent`, `QuestionCard`, `AnswerSection`, `AnswerCard`, `MathToolbar`, `McqToggle`, `MentalControls`, `SingleControls`, `ModeSelector`, `ResultsCard`, `TopicsSection`, `UtilityButtons`
- **`components/modals/`** — Onboarding, Settings, Print, Recommend, ManageData, Shortcuts, ResumeSession
- **`components/CommandPalette.tsx`** — Ctrl+K palette with fuzzy search
- **`primitives/`** — `createShortcut`, `createTheme`, `createSpecLoader`, `createPracticeActions`, `createMcqHotReconfig`, `createSessionSnapshot`, `createCountdownTimer`, `createCountUp`, `createMediaQuery`, `createReducedMotion`, `createPersistedSignal`, `createPersistedStore`, `createGsapContext`, `createGlobalShortcuts`
- **`providers/ServiceProvider.tsx`** — Solid context exposing `PhysicsCore` + stores
- **`stores/`** — Zustand vanilla stores bridged to Solid via `createSolidStore`

### Stores (`src/solid/stores/`)

- `practiceStore` — live session state (Single + Mental)
- `progressStore` (persisted) — `PracticeResult` history + `selectStats` selector
- `settingsStore` (persisted) — theme, font, default mode, mental config, performance toggles
- `specStore` — loaded specification state
- `uiStore` — modal open/close state

Stores and primitives do not use a barrel `index.ts` for primitives; import each primitive directly from its file. The stores barrel is `src/solid/stores/index.ts`.

## Code Style

All TypeScript/TSX source follows the rules in [`AGENTS.md`](./AGENTS.md). The highlights:

- **Tabs** for indentation (one tab per nesting level)
- **No blank lines** anywhere in source files
- **Same-line braces**: `function foo(){`, `if (x){`, `else if (y){`, `else{`
- **`if` / `else if` / `else`** clauses each on their own line
- **No spaces** around assignment/arithmetic/comparison operators (`let res=1;`, `a+b`, `n<0`)
- **Spaces after** commas and colons in type annotations (`a: number, b: number`)
- **`let`** for variable declarations, one per line
- **Semicolons** at the end of statements
- **No `any`**, **no `@ts-ignore`** — strict TypeScript only
- **No dependency arrays** on Solid primitives — Solid's fine-grained reactivity tracks dependencies automatically

Markdown files (`*.md`) are exempt from the no-blank-lines rule and use standard markdown conventions.

## How to Add a Physics Topic

Topics live in the specification file `src/assets/part_one.txt`. The format uses `[SECTION]` headers with inline key-value attributes:

```
[UNIT id:kinematics name:Kinematics]
[TOPIC id:proj-motion name:"Projectile Motion" unit:kinematics]
[SKILL id:calc-trajectory name:"Calculate Trajectory" topic:proj-motion]
[TEMPLATE id:t1 skill:calc-trajectory type:MC difficulty:3 ...]
```

1. **Add a `[UNIT]`** (optional, if the unit does not exist) with a unique `id` and a human-readable `name`.
2. **Add a `[TOPIC]`** referencing the unit via `unit:<unit-id>`.
3. **Add one or more `[SKILL]`** entries referencing the topic via `topic:<topic-id>`.
4. **Add `[TEMPLATE]`** entries referencing a skill via `skill:<skill-id>`. Each template declares a `type` (MC, SA, TF, FB, NE, Matching, Ordering, MR), a `difficulty` (1–5), a `question` string with `{variable}` placeholders, an `answer` expression, and optional `Var.*` definitions.

### Variable Types

- `int` — integer values with `Min`, `Max`
- `double` — floating point values with `Min`, `Max`, `Step`
- `enum` — enumeration with `Values: a, b, c`
- `bool` — boolean
- `set` — pick from a set

### Expression Functions

Built-in math functions available in answer/distractor expressions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `pow`, `abs`, `exp`, `log`, `log10`, `ln`, `log2`, `round`, `sign`, `min`, `max`, `floor`, `ceiling`, `truncate`, `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`, `cbrt`, `deg`, `rad`, and the constants `pi`, `e`.

The TypeScript parser preserves the same format the original Rust crate accepted, so existing specs continue to parse unchanged. Use the live spec editor at `/spec-editor` (Ctrl+K → "Go to Spec Editor") to preview generated questions while you edit.

## How to Add a UI Component

Solid components live under `src/solid/components/`. Each component co-locates a `*.module.css` file. To add a new presentational primitive:

1. **Create the component** in `src/solid/components/ui/` (or the appropriate subfolder). Use a `JSX.Element` return type, typed props via an `interface`, and `splitProps` to separate local props from the rest.
2. **Co-locate the styles** in a sibling `*.module.css` file. Reference design tokens from `globals.css` (`--surface-glass-strong`, `--glass-blur`, `--radius-lg`, …). Do not introduce Tailwind utilities.
3. **Export from the barrel** in `src/solid/components/ui/index.ts` so it is reachable via `import { MyComponent } from "../ui"`.
4. **Add a test** in `src/solid/components/ui/__tests__/MyComponent.test.tsx` using `@solidjs/testing-library` + `vitest`. Cover the default render, key prop variants, and any interaction.
5. **Run the gates**: `npm run typecheck:solid`, `npm run lint`, `npm test`.

Example skeleton (AGENTS.md formatting):

```tsx
import type {JSX} from "solid-js";
import {splitProps} from "solid-js";
import styles from "./MyComponent.module.css";
export interface MyComponentProps {
    label: string;
    disabled?: boolean;
}
export function MyComponent(props: MyComponentProps): JSX.Element {
    let [local, rest] = splitProps(props, ["label", "disabled"]);
    return (
        <button class={styles.root} disabled={local.disabled} {...rest}>
            {local.label}
        </button>
    );
}
```

### Solid Patterns to Follow

- Use `createSignal`, `createMemo`, `createEffect` from `solid-js`. Never use React hooks.
- Primitives (functions returning accessors/disposers, no JSX) own their `onMount`/`onCleanup` lifecycle.
- Read store state through the Solid accessor returned by `createSolidStore`, not through `store.getState()` in render.
- Use `Show`/`For`/`Portal`/`Dynamic` for conditional rendering, lists, portals, and dynamic components.
- Do not pass dependency arrays to Solid primitives — reactivity is automatic.

## Testing Requirements

Vitest is the sole test runner. Two tiers of coverage:

1. **Core unit tests** (`src/lib/physics/__tests__/`) — pure TypeScript, no DOM, no Solid. Every new core collaborator needs a focused test file. The open-closed principle is enforced by `ocp.test.ts`, which registers a new handler/exporter/variable type without editing core logic.
2. **Solid smoke/component tests** (`src/solid/`) — jsdom + `@solidjs/testing-library`. Every new component or primitive needs a test covering default render, key prop variants, and interactions.

Run the full suite before opening a PR:

```bash
npm run typecheck:solid
npm run typecheck
npm run lint
npm run format:check
npm test
```

Coverage target is 100% for the core. Do not let coverage drop on changed lines.

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) with **atomic, focused commits** and **imperative-mood, lowercase-first-word** messages:

- `fix:` — bug fix
- `feat:` — new feature
- `refactor:` — code refactoring (no behavior change)
- `chore:` — maintenance / tooling
- `docs:` — documentation
- `test:` — test additions/changes
- `ci:` — CI/CD changes
- `style:` — formatting-only changes

Example: `feat(dx): add command palette with Ctrl+K shortcut and fuzzy search (task 4.24)`

Prefer many small commits over large ones. One commit per logical change keeps the history reviewable and revertable.

## Development Workflow

### Pre-commit Quality Gates

Every commit must pass the local quality gate with zero errors before it is created. Run:

```bash
npm run typecheck:solid && npm run lint && npm test
```

Do not commit while any gate is failing. Run `npm run build:solid` as well before opening a pull request.

### Branching

- `main` — production-ready code
- Feature branches: `feat/description`
- Bug fixes: `fix/description`

### Pull Request Process

1. Fork the repository and create a focused branch.
2. Make your changes, keeping commits atomic (one logical change per commit).
3. Add or update tests for new functionality.
4. Run the full quality gate locally:

    ```bash
    npm run typecheck:solid
    npm run typecheck
    npm run lint
    npm run format:check
    npm test
    npm run build:solid
    ```

5. Update documentation (`README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`) if your change affects the public surface.
6. Open a pull request with a brief description of the change and the validation results.

## Filing Issues

- **Bugs**: include the reproduction steps, expected vs. actual behavior, and the relevant `npm run` output (typecheck/lint/test).
- **Features**: describe the use case and the proposed API surface; reference the relevant registry/facade where it would plug in.

## Keyboard Shortcuts (DX)

| Shortcut       | Action                |
| -------------- | --------------------- |
| `Ctrl+K`       | Open command palette  |
| `Ctrl+G`       | Generate new question |
| `Shift+Enter`  | Check answer          |
| `Ctrl+1`       | Switch to Single mode |
| `Ctrl+2`       | Switch to Mental mode |
| `Ctrl+,`       | Open Settings         |
| `Ctrl+Shift+T` | Toggle theme          |

## License

Licensed under Apache 2.0 — see [LICENSE](./LICENSE).
