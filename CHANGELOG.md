# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Megatask — SolidJS Migration, MCQ/FRQ Decoupling & Mega UI/UX/DX Overhaul

This Unreleased entry tracks the `solidjs-mcq-decouple-mega-rewrite` megatask, delivered as ~400 atomic Conventional Commits grouped by phase. The prior SaaS-quality polish pass content is preserved below under "Prior polish pass". Each phase lands its own summary here as it completes.

- **Phase 0 — Scaffolding, Tooling & SolidJS Dependency Swap (~30 commits)**: Adds SolidJS tooling alongside the existing React app so both coexist during migration. Solid entry point lives in `src/solid/**`; the React app at `src/main.tsx` + `src/App.tsx` keeps building and testing green at every commit. A separate `tsconfig.solid.json`, a Solid Vitest environment, `vite-plugin-solid` (scoped to `src/solid/**`), and a `@solidjs/testing-library` setup are introduced. Design tokens (light/dark/dim) for the RandMatQuGeA liquid/glass aesthetic are ported to a new `src/styles/globals.css` token skeleton, and a minimal Solid shell + UI primitives (ErrorBoundary, theme/media-query/localStorage primitives, GlassCard, Button, Logo, Icon, KaTeX renderer, GSAP wrapper) are added. Phase 0 completion summary and per-task SHAs are recorded at the end of Phase 0 (see "Phase 0 completion" below).
- **Phase 1 — Core: MCQ/FRQ Decoupling (~35 commits)**: COMPLETE. `ResponseMode` is now orthogonal to `QuestionType`; every type renders/grades as both MCQ and FRQ via `UniversalDistractorGenerator` + `McqAssembler` + `AnswerGrader` + `ExpressionNormalizer`. Pure-TS, zero JSX, fully unit-tested.
- **Phase 2 — Core: New Domain Features (~35 commits)**: Pure-TS new features (sig-figs, units, glossary, spaced repetition, history, bookmarks, achievements, daily goals, leaderboards, new question types, etc.).
- **Phase 3 — SolidJS UI Foundation (~60 commits)**: Each React component is ported to SolidJS + a co-located CSS Module in its own commit; the React original is deleted in the same commit. Final React dependency removal happens at the END of Phase 3.
- **Phase 4 — RandMatQuGeA UI/UX/DX Mimicry (~55 commits)**: Liquid background, glassmorphism, control/math toolbars, modals, smart equivalence checking, responsive rules — excluding RandMatQuGeA's offline-exclusive affordances (system tray, OS shortcuts, SQLite UI, window effects, PWA SW).
- **Phase 5 — Bug Fixes Batch (~80 commits, 200 bugs)**.
- **Phase 6 — New Features Batch (~50 commits, 100 features)**.
- **Phase 7 — Polish, Verification & Release (~20 commits)**.

#### Deferred to end of Phase 3

The original spec listed React/Tailwind dep removal as Phase 0 work (tasks 0.3 and 0.4). Removing them now would break the existing React app and its 797 tests, violating the "every commit green" rule. They are therefore deferred:

- **Task 0.3 (deferred to end of Phase 3)**: Remove React deps (`react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `@testing-library/react`, `framer-motion`, `@gsap/react`, `@phosphor-icons/react`) from `package.json`. Removal lands alongside the final React-file deletion at the end of Phase 3 (Task 3.20). The removal is gated on a CI grep verifying zero `from "react"` / `from "react-dom"` / `@vitejs/plugin-react` imports under `src/` (excluding `src/solid/**`) and zero React-idiom hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`) remaining. The React plugin stays in `vite.config.ts` and `vitest.config.ts` until Phase 3 completes so the React app keeps building/testing green during the gradual port.
- **Task 0.4 (deferred to end of Phase 3)**: Remove Tailwind/PostCSS deps (`tailwindcss`, `postcss`, `autoprefixer`) and delete `tailwind.config.js` + `postcss.config.js`. The React app still consumes Tailwind directives (`@tailwind base/components/utilities` and `@apply`) in `src/styles/globals.css`; the Solid shell added in Phase 0 consumes a SEPARATE token sheet at `src/solid/styles/globals.css` (added in Task 0.14) that contains no Tailwind directives. Once Phase 3 finishes porting every React component to Solid and deletes the React `src/styles/globals.css`, these deps and configs are removed. The removal is gated on a CI grep verifying zero `@tailwind` / `@apply` directives and zero `tailwindcss` imports remain anywhere under `src/`. `postcss.config.js` and `tailwind.config.js` stay on disk until that gate passes.

#### Phase 3 Migration Plan

The following anchors enumerate every React component/hook/store file scheduled for porting to SolidJS during Phase 3. Each anchor maps a Phase 0 tracking task (0.17–0.30) to its Phase 3 destination task. The React originals are NOT touched in Phase 0; each is deleted in the same commit that lands its Solid replacement during Phase 3. Anchors are added incrementally as Phase 0 tasks 0.17–0.30 land.

- **Task 0.17 → Phase 3 Task 3.1** — `src/stores/**`: `practiceStore.ts`, `progressStore.ts`, `settingsStore.ts`, `specStore.ts`, `uiStore.ts`, `index.ts`. Porting target: re-implement as Solid `createSignal`/`createStore` stores (or Zustand-vanilla + a Solid `useStore` primitive); persistence via `createPersistedSignal`/`createPersistedStore` (Phase 3 Task 3.15). 5 commits in Phase 3 Task 3.1.
- **Task 0.18 → Phase 3 Task 3.2** — `src/components/providers/ServiceProvider.tsx` + `src/hooks/useServices.ts`. Porting target: Solid context-based provider exposing `PhysicsCore`, `AnswerGrader`, and the Solid stores via `createContext`/`useContext`; replaces the React context + hook wrapper.
- **Task 0.19 → Phase 3 Task 3.3** — `src/hooks/**` Solid primitives: `useTheme`, `useGlobalShortcuts`, `useSpecLoader`, `useSessionSnapshot`, `usePracticeActions`, `useMcqHotReconfig`, `useReducedMotion`, `useMediaQuery`, `useCountUp`, `useCountdownTimer`, `useGsapContext`, `useAnswerActions`, `useMentalMode`, `useSingleMode`, `index.ts`. Porting target: Solid primitives built on `createSignal`/`createEffect`/`onCleanup`/`onMount`; `useGlobalShortcuts` becomes `createShortcut` (Phase 3 Task 3.14). 10 commits in Phase 3 Task 3.3.
- **Task 0.20 → Phase 3 Task 3.4 (part 1)** — `src/components/ui/**` primitives part 1: `Button`, `Card`, `Modal` (focus trap via `Portal` + `onCleanup`), `Input`, `Select`, `Slider`, `Switch`, `Tabs` (`role="tablist"` + arrow-key nav), `Toast` (`Portal` + live region). Each gets a co-located `*.module.css`. 9 of 18 commits in Phase 3 Task 3.4.
- **Task 0.21 → Phase 3 Task 3.4 (part 2)** — `src/components/ui/**` primitives part 2: `Tooltip`, `Badge`, `Pill`, `ProgressBar` (`aria-label`/`aria-valuetext`), `Spinner`, `Accordion`, `EmptyState`, `ConfirmDialog` (built on `Modal`), `Toolbar`, `index.ts`. Each gets a co-located `*.module.css`. Remaining 9 commits in Phase 3 Task 3.4.
- **Task 0.22 → Phase 3 Task 3.5** — `src/components/MathText.tsx` + `src/components/MathRenderer.tsx` (KaTeX). Porting target: Solid `MathText` tokenizes `$...$`/`$$...$$`/`\(...\)`/`\[...\]`/`\$` and `MathRenderer` uses `createEffect` to re-render KaTeX on text change; single KaTeX engine shared with print popup.
- **Task 0.23 → Phase 3 Task 3.6** — `src/components/layout/AppShell.tsx` + `AppTopBar.tsx` + `src/components/ErrorBoundary.tsx` (React). Porting target: Solid `AppShell` with skip-link + landmarks (`<header>`/`<nav>`/`<main>`/`<h1>`), `AppTopBar`, and the React `ErrorBoundary` deleted in favor of the Solid `ErrorBoundaryRetry` added in Phase 0 Task 0.16.
- **Task 0.24 → Phase 3 Task 3.7** — `src/components/practice/**` toolbar rows: `ControlToolbarTop`, `ControlToolbarBottom`, `ModeSelector`, `TopicsSection`, `McqToggle` (now the Response Mode toggle, enabled for all types per Phase 1), `UtilityButtons`, `MentalControls`, `SingleControls`, `MathToolbar`. 9 commits in Phase 3 Task 3.7.
- **Task 0.25 → Phase 3 Task 3.8** — `src/components/practice/**` main content: `MainContent`, `QuestionCard`, `AnswerSection`, `AnswerCard` (live KaTeX preview), `ResultsCard` (solution rendering in display mode). 6 commits in Phase 3 Task 3.8.

#### Prior polish pass

The application is now a pure-TypeScript physics practice question generator. There is no WASM and no Rust domain logic — all question generation, evaluation, and export happens in TypeScript. The React 19 + Vite 8 + KaTeX + Zustand 5 + Tauri shell stack is in place, and this entry documents the SaaS-quality polish pass (Waves 1–6 complete, Wave 7 in progress).

### Added

- **LaTeX pipeline**: `MathText` now tokenizes `$...$` (inline), `$$...$$` (display), `\(...\)` (inline), `\[...\]` (display), and `\$` literal-dollar escapes, passing a per-segment `display` flag to `MathRenderer`. `solution_latex` is now the substituted LaTeX (variables applied, then `{answer}` replaced) rather than the raw template. Exporters (HTML/Markdown) and the print preview render math through KaTeX instead of MathJax. The `MathToolbar` is visible on answer focus and its "more symbols" dropdown is functional (`.show` toggle, Escape-to-close, non-focusable while hidden, `data-symbol` widening hooks).
- **Accessibility**: `:focus-visible` rings (3:1 contrast) on all primary controls; skip-link and landmark structure (`<header>`, `<nav>`, `<main>`, `<h1>`) in `AppShell`; `Modal` focus trap with return-focus, scroll lock, and initial focus; `radiogroup`/`radio` semantics on MCQ choices; `tablist`/`tab`/`tabpanel` with arrow-key navigation on the Settings basic/advanced switcher; `<ol>`/`<ul>`/`<thead>` list semantics in onboarding/recommend/shortcuts; `aria-live` regions for timer/score, `aria-pressed` on the theme toggle, `aria-label`/`aria-valuetext` on `ProgressBar`; `@media (prefers-contrast-more)` and `@media (forced-colors)` fallbacks for glass surfaces; touch targets raised to ≥24px (≥44px where space allows); root font-size set to `100%` for browser scaling.
- **Extensibility**: `QuestionTypeRegistry` and `VariableGenerator` are now injectable through the `PhysicsCore` constructor (defaults preserved via `createDefault()`). A `configureCore(options)` factory is exported from the service layer (`src/services/physicsCore.ts`) as the public extension point — it rebuilds the singleton from injected collaborators (custom `ExporterRegistry`, `FunctionRegistry`, `QuestionTypeRegistry`, `VariableTypeRegistry`, or `RandomGenerator`); omitted options keep their defaults, so `configureCore({})` resets to the standard configuration.
- **Resilience**: `ToastProvider` is mounted in `main.tsx` and async failures (generation, session, spec load) are routed through `useToast()` toasts with pause-on-hover/focus. A `ConfirmDialog` component (built on `Modal`) replaces every `window.confirm` call (manage-data delete, single-record delete, settings reset). Async buttons show `isLoading`/`aria-busy` states, and the bare "Loading…" placeholders are replaced with skeleton loaders (spec load, topics).
- **Stores/hooks**: `src/stores/index.ts` and `src/hooks/index.ts` barrels re-export the public store/hook APIs. `progressStore` exposes a `selectStats` selector for stable `PracticeStats` derivation. `usePracticeActions` extracts the shared `check()` submission and `Shift+Enter` handler out of `useSingleMode`/`useMentalMode`, and `resolveTopicId()` consolidates the duplicated topic-resolution logic into `src/lib/utils.ts`.
- **Public API**: `configureCore(options)` is part of the documented public API for advanced consumers that need custom question/variable types, exporters, evaluator functions, or a deterministic random source.

### Changed

- **Mental config consolidation**: `mentalDifficulty`, `mentalScope`, `mentalShuffle`, and `mentalUnlimited` moved from `practiceStore` into the persisted `settingsStore`; `practiceStore` now holds only live session state. The duplicated `mentalDifficulty` was consolidated to a single source.
- **`QUESTION_TYPES` SSOT**: a canonical `QUESTION_TYPES` const object (`MC`, `SA`, `TF`, `FB`, `NE`) and corrected `QuestionType` union in `src/types/models.ts` replace the stale 2-value union; every `'MultipleChoice'` literal now references `QUESTION_TYPES.MC`.
- **ESLint**: migrated from the legacy `.eslintrc.cjs` to the flat `eslint.config.mjs`, preserving `eslint:recommended` + `@typescript-eslint/recommended` + `react-hooks/recommended` + Prettier compatibility and enforcing `no-multiple-empty-lines` (AGENTS.md "no blank lines" rule).
- **Documentation**: `README.md`, `CONTRIBUTING.md`, and `ARCHITECTURE.md` rewritten to describe the pure-TypeScript stack (React 19, Vite 8, KaTeX, Zustand 5, Tauri shell) and the actual setup/test commands.

### Fixed

- **MCQ grading bug**: answers are now graded against the correct choice index via the `QUESTION_TYPES` single source of truth, resolving the dead `submitAnswer` branch and incorrect comparison.
- **`AnswerCard` preview**: the live answer preview renders through `<MathText>` so plain-text and `$...$` answers both render without error spans.
- **`ResultsCard` solution**: `solution_latex` renders in display mode when non-empty and valid, falling back to `<MathText>` on the plain-text solution.
- **`solution_latex` substitution**: the substituted LaTeX no longer contains `{...}` placeholders.
- **`spec-loading` placeholders**: replaced with skeleton loaders and `aria-busy` regions.

### Removed

- **Dead files**: `reference/` (design reference), `Dockerfile`, `.dockerignore`, `scripts/make-icon.ps1`, `src-tauri/icons/.gitkeep`, and the empty `src-tauri/src/commands.rs` (with its `mod commands;` declaration) — the Tauri shell now contains only the minimal `lib.rs`/`main.rs` bootstrap.
- **Unused dependencies**: `@tailwindcss/postcss` and `eslint-plugin-react-refresh` pruned from `devDependencies`.
- **MathJax artifacts**: the MathJax `<script>` and `window.MathJax` config removed from `index.html`; the stale `.mjx-chtml`/`.MathJax_Display`/`.mjx-container` CSS removed from `globals.css`.
- **Broken font artifacts**: the conflicting `@font-face` rules (`/NotoSans-VariableFont_wdth_wght.ttf`, `/LibertinusMath-Regular.ttf`) and `<link rel="preload">` entries removed in favor of `@fontsource/noto-sans`.
- **Dead eslint-disable comments**: the two `// eslint-disable-next-line brace-style` comments in `BaseQuestionHandler.ts` and `MultipleChoiceHandler.ts` removed.
- **Stale documentation references**: React upgraded to 19; Flutter/Rust/WASM/Docker as the active stack removed (these were retired by the earlier TypeScript rewrite).
- **`.gitignore` overhaul**: added `*.tsbuildinfo`, `.eslintcache`, `*.log`, `npm-debug.log*`, `.vite/`, `.cache/`, `*.local`; removed the blanket `Cargo.lock` ignore and committed `src-tauri/Cargo.lock`.
