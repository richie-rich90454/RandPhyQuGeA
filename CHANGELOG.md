# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
