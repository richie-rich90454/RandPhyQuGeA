# Tasks

This megatask is delivered as \~400 atomic Conventional Commits. Each subtask below is one commit commited as code is written (commit as you go) unless annotated `(N commits)`. Phases are ordered; within a phase, independent subtasks may be parallelized. Every commit leaves the repo green (`npm run typecheck && npm run lint && npm run test && npm run build`).

## Phase 0 — Scaffolding, Tooling & SolidJS Dependency Swap (≈30 commits)

> Coexistence strategy: SolidJS tooling is added ALONGSIDE the existing React app so both build and test green at every commit. React/Tailwind dependency removal is deferred to the END of Phase 3 (see CHANGELOG.md "Deferred to end of Phase 3"). The Solid entry lives in `src/solid/**`; the React app at `src/main.tsx` keeps building and the 797 React tests keep passing throughout.

- [x] Task 0.1: Create `CHANGELOG.md` "Unreleased" section for the megatask with all 8 phases listed. (commit 6496a2c)
- [x] Task 0.2: Add `solid-js`, `vite-plugin-solid`, `babel-preset-solid` to deps; add `@solidjs/testing-library`, `@testing-library/jest-dom` to devDeps. (commit 843efe3)
- [x] Task 0.3 (DEFERRED TO END OF PHASE 3): React dep removal documented as a deferral plan in CHANGELOG.md; React deps stay until Phase 3 completes. (commit 773f303)
- [x] Task 0.4 (DEFERRED TO END OF PHASE 3): Tailwind/PostCSS removal documented as a deferral plan in CHANGELOG.md; `tailwind.config.js`/`postcss.config.js` stay until Phase 3 completes. (commit 8da3fa1)
- [x] Task 0.5: Add `vite-plugin-solid` ALONGSIDE `@vitejs/plugin-react` in `vite.config.ts` (solid scoped to `src/solid/**`, React excludes it); add a `solid` vendor chunk. React app still builds. (commit 318c9fb)
- [x] Task 0.6: Register the solid plugin + jest-dom setup in `vitest.config.ts` (solid scoped to `src/solid/**`); existing 797 React tests stay green and Solid tests load. (config landed in commit e2dfe1a; `hot:false` fix in commit eea8e03 so Solid tests load under vitest — 803 tests pass)
- [x] Task 0.7: Add `tsconfig.solid.json` (`jsx: "preserve"`, `jsxImportSource: "solid-js"`, includes `src/solid`); base `tsconfig.json` stays React (`jsx: "react-jsx"`) and excludes `src/solid/**`. Add `typecheck:solid` script. (commit 5d5e1e4)
- [x] Task 0.8: Update `.oxlintrc.json` with a `src/solid/**` override disabling React hooks rules for SolidJS files. (commit 6a055fe)
- [x] Task 0.9: Add `src/solid/solid-env.d.ts` referencing `vite/client` + `solid-js` types (React `vite-env.d.ts` untouched). (commit f2e630f)
- [x] Task 0.10: Add `src/solid/index.html` Solid dev preview entry; root `index.html` still mounts the React `/src/main.tsx`. (commit 314d6ce)
- [x] Task 0.11: Add a Solid typecheck step to `.github/workflows/code-quality.yml` (runs alongside the existing React jobs). (commit f622dcd)
- [x] Task 0.12: Update `.gitignore` for Solid/Vite/LightningCSS caches (`.vite/`, `.lightningcss/`, `*.tsbuildinfo`, `.eslintcache`, `src/solid/dist/`). (commit fc52688)
- [x] Task 0.13: Add `dev:solid`, `build:solid`, `typecheck:solid` npm scripts; keep `clean` + `typecheck:watch` for the React toolchain. (commit 37167c2)
- [x] Task 0.14: Add `src/solid/styles/globals.css` skeleton with liquid/glass design-token custom properties (light/dark/dim) + base/reset CSS, ported from the RandMatQuGeA aesthetic. No Tailwind directives. (commits fe25761, e467957, 6fb45ea, 7e56ea0)
- [x] Task 0.15: Add `src/solid/main.tsx` + `src/solid/App.tsx` + `App.module.css` Solid stubs rendering a "SolidJS migration in progress" shell; React app still builds. (commit b35f977)
- [x] Task 0.16: Add a Solid `ErrorBoundary`-with-retry primitive (`src/solid/components/ErrorBoundary.tsx` + `ErrorBoundary.module.css`) with a `@solidjs/testing-library` smoke test; wire it into the `src/solid/App.tsx` shell. (commit f5582e7)
- [x] Task 0.17: Migration-tracking anchor — `src/stores/**` (practiceStore, progressStore, settingsStore, specStore, uiStore, index) → Phase 3 Task 3.1 (Solid stores). Doc-only CHANGELOG entry. (commit 6e09ed6)
- [x] Task 0.18: Migration-tracking anchor — `src/components/providers/ServiceProvider.tsx` + `src/hooks/useServices.ts` → Phase 3 Task 3.2 (Solid context/provider). Doc-only. (commit 49b5fb1)
- [x] Task 0.19: Migration-tracking anchor — `src/hooks/**` Solid primitives (useTheme, useGlobalShortcuts, useSpecLoader, useSessionSnapshot, usePracticeActions, useMcqHotReconfig, useReducedMotion, useMediaQuery, useCountUp, useCountdownTimer, useGsapContext, useAnswerActions, useMentalMode, useSingleMode) → Phase 3 Task 3.3. Doc-only. (commit f56a854)
- [x] Task 0.20: Migration-tracking anchor — `src/components/ui/**` primitives part 1 (Button, Card, Modal, Input, Select, Slider, Switch, Tabs, Toast) → Phase 3 Task 3.4. Doc-only. (commit 6e50d83)
- [x] Task 0.21: Migration-tracking anchor — `src/components/ui/**` primitives part 2 (Tooltip, Badge, Pill, ProgressBar, Spinner, Accordion, EmptyState, ConfirmDialog, Toolbar, index) → Phase 3 Task 3.4. Doc-only. (commit 650e9ae)
- [x] Task 0.22: Migration-tracking anchor — `src/components/MathText.tsx` + `src/components/MathRenderer.tsx` (KaTeX) → Phase 3 Task 3.5. Doc-only. (commit a78628b)
- [x] Task 0.23: Migration-tracking anchor — `src/components/layout/AppShell.tsx` + `AppTopBar.tsx` + `src/components/ErrorBoundary.tsx` (React) → Phase 3 Task 3.6. Doc-only. (commit e91747b)
- [x] Task 0.24: Migration-tracking anchor — `src/components/practice/**` toolbar row (ControlToolbarTop, ControlToolbarBottom, ModeSelector, TopicsSection, McqToggle, UtilityButtons, MentalControls, SingleControls, MathToolbar) → Phase 3 Task 3.7. Doc-only. (commit 216a040)
- [x] Task 0.25: Migration-tracking anchor — `src/components/practice/**` main content (MainContent, QuestionCard, AnswerSection, AnswerCard, ResultsCard) → Phase 3 Task 3.8. Doc-only. (commit b708443)
- [x] Task 0.26: Migration-tracking anchor — `src/components/modals/**` (OnboardingModal, PrintModal, RecommendModal, ManageDataModal, SettingsModal, ShortcutsModal, ResumeSessionModal) → Phase 3 Task 3.9. Doc-only. (commit 6506396)
- [x] Task 0.27: Migration-tracking anchor — `src/components/analytics/ProgressPanel.tsx` → Phase 3 Task 3.10. Doc-only. (commit 95a3bc7)
- [x] Task 0.28: Migration-tracking anchor — `src/components/animations/ScrollReveal.tsx` (motion helper) → Phase 3 Task 3.16. Doc-only. (commit 8c77ff4)
- [x] Task 0.29: Migration-tracking anchor — `src/App.tsx` + `src/main.tsx` (React root shell) → Phase 3 Task 3.20 final React-file deletion. Doc-only. (commit 9da39a3)
- [x] Task 0.30: Migration-tracking anchor — `src/styles/globals.css` (React/Tailwind global stylesheet) + final React/Tailwind dep removal gate → end of Phase 3. Doc-only. (commit 23199c3)

## Phase 1 — Core: MCQ/FRQ Decoupling (≈35 commits)

> Pure-TS, no JSX. Each commit extends the OOP core and is fully unit-tested.

- [x] Task 1.1: Add `ResponseMode` (`'mcq' | 'frq'`) and extend `GeneratedQuestion` with `response_mode`, `choices?`, `correct_choice_index?`, `grader_hint?` in `src/lib/physics/types.ts`.
- [x] Task 1.2: Add `responseMode?: ResponseMode` to `QuestionFilter` in `src/lib/physics/types.ts`.
- [x] Task 1.3: Define `ResponseFormatStrategy` interface in `contracts.ts` (produces distractors + correct index for a given question type + canonical answer + variables).
- [x] Task 1.4: Implement `NumericDistractorStrategy` (perturbation: ±rounding, ×scale, off-by-one, unit drift) for `NE`/`MC`.
- [x] Task 1.5: Implement `BooleanDistractorStrategy` (flip true/false + near-boolean phrasing) for `TF`.
- [x] Task 1.6: Implement `BlankTokenDistractorStrategy` (alternate fill-in tokens) for `FB`.
- [x] Task 1.7: Implement `ShortAnswerNeighborStrategy` (answer-string neighbors + expression-equivalent forms) for `SA`.
- [x] Task 1.8: Implement `UniversalDistractorGenerator` that picks the right `ResponseFormatStrategy` per question type and dedupes/scales to the requested choice count.
- [x] Task 1.9: Implement `McqAssembler` that takes a base `GeneratedQuestion` (answer+solution only) and decorates it with `choices`/`correct_choice_index`/`response_mode='mcq'` via the `UniversalDistractorGenerator`.
- [x] Task 1.10: Refactor `BaseQuestionHandler.handle` to produce answer + solution only (remove `generateChoices` from the handler contract); handlers no longer own MCQ assembly.
- [x] Task 1.11: Update `MultipleChoiceHandler` to no longer generate choices (it now only formats the canonical answer for its semantic type); its legacy distractor expressions feed the `NumericDistractorStrategy` as hints.
- [x] Task 1.12: Update `ShortAnswerHandler`, `TrueFalseHandler`, `FillInBlankHandler`, `NumericEntryHandler` to the new base contract (4 commits, one per handler).
- [x] Task 1.13: Update `QuestionGenerator.generateFromTemplate` to call the handler, then conditionally apply `McqAssembler` based on `filter.responseMode` (default `'frq'`).
- [x] Task 1.14: Update `QuestionGenerator.matchesFilter` to filter by `questionType` (semantic) and accept `responseMode` separately.
- [x] Task 1.15: Define `AnswerGrader` interface + implement `AnswerGrader` class dispatching by mode + type (choice-index for mcq; exact/boolean/blank-token/numeric-tolerance for frq).
- [x] Task 1.16: Implement `ExpressionNormalizer` (commutative/associative normalization, fraction↔decimal, `2x`↔`2*x`, whitespace, trailing-zero) for `SA` equivalence grading — no math.js.
- [x] Task 1.17: Wire `AnswerGrader` + `UniversalDistractorGenerator` + `McqAssembler` into `PhysicsCore` constructor (injectable) and `configureCore`.
- [x] Task 1.18: Update `PhysicsCore.generateQuestion`/`generateBatch`/`generateUnique` to thread `responseMode` through.
- [x] Task 1.19: Update all exporters (`Html`, `Markdown`, `Text`, `Json`, `Csv`, `Latex`, `Pdf`) to emit `response_mode` and render choices when present (7 commits, one per exporter).
- [x] Task 1.20: Update `FormulaLibrary` with a `responseMode`-agnostic API (no change to formulas; ensure no MCQ coupling).
- [x] Task 1.21: Update the OCP test to exercise a custom `ResponseFormatStrategy` end-to-end through `PhysicsCore.generateQuestion({responseMode:'mcq'})`.
- [x] Task 1.22: Add unit tests: every question type × every response mode (10 combinations) for generation + grading.
- [x] Task 1.23: Add unit tests: `UniversalDistractorGenerator` dedup, choice-count scaling, no-correct-answer-duplicated invariant.
- [x] Task 1.24: Add unit tests: `ExpressionNormalizer` equivalence cases (fractions, decimals, commutative, whitespace, LaTeX vs plain).
- [x] Task 1.25: Add unit tests: `AnswerGrader` per type/mode (correct/incorrect/partial).
- [x] Task 1.26: Update `services/physicsCore.ts` `configureCore` to accept `responseFormatStrategies`, `distractorGenerator`, `grader`.
- [x] Task 1.27: Add a `SeededRandom` class implementing `RandomGenerator` (xorshift32) to `src/lib/physics/random/SeededRandom.ts`; deterministic given the same seed; two different seeds diverge. Unit tests in `src/lib/physics/__tests__/seededRandom.test.ts`.
- [x] Task 1.28: `McqAssembler.assemble` accepts an optional `seed` and uses a `SeededRandom` when provided (stable distractor ordering); `QuestionGenerator.generateFromTemplate` threads a seed derived from `template.id + variable hash` when no explicit seed is given. Tests for ordering stability.
- [x] Task 1.29: `NumericDistractorStrategy` significant-figures-aware — inspect the canonical answer string for sig figs and preserve the same sig-fig count where possible. Tests.
- [x] Task 1.30: Edge case — single-template topics don't crash; guard in `QuestionGenerator.generateUnique` so a single template with `excludeIds` emptying the pool still returns a fresh instance by re-randomizing variables. Regression test.
- [x] Task 1.31: Edge case — no-distractor-available fallback; when `UniversalDistractorGenerator` cannot produce enough unique distractors, `McqAssembler.assemble` falls back to `response_mode: 'frq'` with `grader_hint: 'mcq-unavailable-fallback'`. Tests.
- [x] Task 1.32: Edge case — distractor dedup padding; when the strategy yields fewer unique distractors than requested but at least 1, pad with a literal `"None of the above"` choice (never marked correct). Tests.
- [x] Task 1.33: Comprehensive JSDoc on `McqAssembler`, `UniversalDistractorGenerator`, and the `ResponseFormatStrategy`/`DistractorContext`/`McqAssemblerLike`/`UniversalDistractorGeneratorLike` interfaces in `contracts.ts`. Doc-only commit.
- [x] Task 1.34: Comprehensive JSDoc on `AnswerGrader`, `ExpressionNormalizer`, all four `*DistractorStrategy` classes, and the `AnswerGraderLike`/`ExpressionNormalizerLike`/`GradeResult` interfaces. Doc-only commit.
- [x] Task 1.35: JSDoc on `BaseQuestionHandler` (post-refactor contract) and handler subclasses; hardening test exercising every question type × every response mode end-to-end through `PhysicsCore` with a seeded RNG asserting reproducibility.

## Phase 2 — Core: New Domain Features (pure-TS, no JSX) (≈35 commits)

- [x] Task 2.1: Significant-figures formatter (`formatSigFigs`) + integrate into `ExpressionEvaluator.formatNumeric` (opt-in). (commit e498b9a)
- [x] Task 2.2: Scientific-notation formatter + parser. (commit 20cd144)
- [x] Task 2.3: Unit-aware answer comparison (unit registry + conversion for SI prefixes). (commit 8d76ac7)
- [x] Task 2.4: Dimensional-analysis checker (`DimensionalAnalysisChecker` class). (commit 7282e2e)
- [x] Task 2.5: Constants reference data (`ConstantsReference` class — physics constants). (commit fec36f9)
- [x] Task 2.6: Glossary data (`Glossary` class — physics terms). (commit a983298)
- [x] Task 2.7: Unit converter (`UnitConverter` class). (commit f5d7be8)
- [x] Task 2.8: Formula cheat-sheet expansion (`FormulaLibrary` — add 50+ physics formulas with LaTeX + variables + topic). (commit 09384b1)
- [x] Task 2.9: Spaced-repetition queue (`SpacedRepetitionQueue` class — SM-2-lite for weak topics). (commit 438cdc2)
- [x] Task 2.10: Question history store (`QuestionHistory` class — ring buffer of attempts with re-attempt support). (commit e5adf7e)
- [x] Task 2.11: Bookmarks store (`Bookmarks` class). (commit 23b95bf)
- [x] Task 2.12: Worked-solution step renderer data model (`WorkedSolution` type + builder). (commit 03b9880)
- [x] Task 2.13: Partial-credit hint generator (`HintGenerator` class). (commit 088eefc)
- [x] Task 2.14: Adaptive-difficulty selector (`AdaptiveDifficulty` class — adjusts based on recent accuracy). (commit 08266f1)
- [x] Task 2.15: Question annotation model (`QuestionAnnotation` type). (commit 84c062a)
- [x] Task 2.16: Diagram support in templates (`diagram_svg` field on `QuestionTemplate` + substitution). (commit 280c9d8)
- [x] Task 2.17: Share-link encoder/decoder (`ShareLinkCodec` — base64-encoded question state). (commit 906e55e)
- [x] Task 2.18: Custom question set model (`QuestionSet` type + `QuestionSetStore`). (commit 444a4f5)
- [x] Task 2.19: Import/export question sets (JSON) (`QuestionSetIo` class). (commit 00e6d33)
- [x] Task 2.20: Achievements data (`Achievements` class — definitions + unlock logic). (commit 43abf5c)
- [x] Task 2.21: Daily-goals data (`DailyGoals` class). (commit 06417c4)
- [x] Task 2.22: Local leaderboards data (`LocalLeaderboard` class). (commit d56753a)
- [x] Task 2.23: Session tags model (`SessionTags`). (commit 3318ee5)
- [x] Task 2.24: Timed-challenge variants data (`TimedChallenge` types). (commit 6e7e89f)
- [x] Task 2.25: New question type handler `Matching` (register via `QuestionTypeRegistry`) + distractor strategy. (commit 40bcd8f)
- [x] Task 2.26: New question type handler `Ordering` + distractor strategy. (commit 404bdd6)
- [x] Task 2.27: New question type handler `MultipleResponse` (select-all-that-apply) + grader. (commit d5a8c2a)
- [x] Task 2.28: New variable types `bool`/`set` handlers (register via `VariableTypeRegistry`). (commit 7cee415)
- [x] Task 2.29: New evaluator functions (`sec`, `csc`, `cot`, `logb`, `root`, `gamma`, `mod`) registered via `FunctionRegistry`. (commit 8616ce8)
- [x] Task 2.30: More physics units/topics/templates added to `part_one.txt` (content commit). (commit ca947af)
- [x] Task 2.31: More physics units/topics/templates batch 2 (content commit). (commit 40e5750)
- [x] Task 2.32: Spec-parser support for new sections (`[DIAGRAM]`, `[HINT]`, `[UNIT_CONVERT]`). (commit 4ac1dd3)
- [x] Task 2.33: Exporter for Anki/APKG (new `AnkiExporter`). (commit 80e74ac)
- [x] Task 2.34: Exporter for Quizlet CSV (new `QuizletExporter`). (commit 3ba6afc)
- [x] Task 2.35: JSDoc + unit tests for all new core classes added in this phase. (commit 9d36b2b)

## Phase 3 — SolidJS UI Foundation (≈60 commits)

> Port each React component to SolidJS + a co-located CSS Module. Delete the React original in the same commit.

- [x] Task 3.1: Solid `createSignal`/`createStore`-based store shims: re-implement `practiceStore`, `progressStore`, `settingsStore`, `specStore`, `uiStore` as Solid stores (or Zustand-vanilla + Solid `useStore` primitive) — 5 commits. (3.1a–3.1e; createSolidStore bridges Zustand-vanilla to Solid accessors)
- [x] Task 3.2: Solid `ServiceProvider`/context equivalents (provide `PhysicsCore`, `AnswerGrader`, stores via context). (commit 8d6cfb3)
- [x] Task 3.3: Solid primitives replacing hooks: `useTheme`, `useGlobalShortcuts`, `useSpecLoader`, `useSessionSnapshot`, `usePracticeActions`, `useMcqHotReconfig`, `useReducedMotion`, `useMediaQuery`, `useCountUp`, `useCountdownTimer` — 10 commits. (3.3a–3.3j; commits d48824b, b7539b8, 94e141a, ab806f7, 64dd5db, e007b10, cfb4292, cd5eade, 8363a5c, d9b6177)
- [ ] Task 3.4: UI primitives (SolidJS + `*.module.css`): `Button`, `Card`, `Modal` (with focus trap via `Portal` + `onCleanup`), `Input`, `Select`, `Slider`, `Switch`, `Tabs`, `Toast` (Portal + live region), `Tooltip`, `Badge`, `Pill`, `ProgressBar`, `Spinner`, `Accordion`, `EmptyState`, `ConfirmDialog`, `Toolbar` — 18 commits.
- [ ] Task 3.5: `MathText` + `MathRenderer` (KaTeX) ported to Solid (`createEffect` to re-render on text change).
- [ ] Task 3.6: `AppShell`, `AppTopBar`, `ErrorBoundary` (Solid).
- [x] Task 3.7: `ControlToolbarTop`, `ControlToolbarBottom`, `ModeSelector`, `TopicsSection`, `McqToggle` (now the **Response Mode** toggle, enabled for all types), `UtilityButtons`, `MentalControls`, `SingleControls`, `MathToolbar` — 9 commits.
- [x] Task 3.8: `MainContent`, `QuestionCard`, `AnswerSection`, `AnswerCard` (with live KaTeX preview), `ResultsCard`, `ResultsCard` solution rendering — 6 commits.
- [x] Task 3.9: Modals: `OnboardingModal`, `PrintModal`, `RecommendModal`, `ManageDataModal`, `SettingsModal` (Basic/Advanced tabs), `ShortcutsModal`, `ResumeSessionModal` — 7 commits.
- [x] Task 3.10: `ProgressPanel` (analytics) + `analytics` wiring.
- [ ] Task 3.11: Liquid animated background component (pure CSS) + glassmorphism surfaces.
- [ ] Task 3.12: Skip-link, landmarks (`<header>`/`<nav>`/`<main>`/`<h1>`), live regions ported to Solid.
- [ ] Task 3.13: `ToastProvider` mounted at root (Solid context + Portal).
- [ ] Task 3.14: Keyboard-shortcut primitive (`createShortcut`) replacing `useGlobalShortcuts`.
- [ ] Task 3.15: `createPersistedSignal`/`createPersistedStore` for localStorage/IndexedDB persistence.
- [ ] Task 3.16: Motion: replace framer-motion with GSAP (already a dep) or CSS transitions; add `useGsapContext` Solid equivalent.
- [ ] Task 3.17: Smoke tests for each Solid component using `@solidjs/testing-library` — 10 commits covering primitives, toolbars, modals, main content.
- [ ] Task 3.18: Accessibility pass on Solid components (focus-visible, ARIA, radiogroup/tablist roles, focus trap).
- [ ] Task 3.19: Responsive breakpoints via CSS Modules `@media` + container queries.
- [ ] Task 3.20: Final deletion of any remaining React-only files + `react` import sweep (grep-verified zero).

## Phase 4 — RandMatQuGeA UI/UX/DX Mimicry (≈55 commits)

- [ ] Task 4.1: Port RandMatQuGeA color tokens / typography / spacing / radii / shadows into `globals.css` (light/dark/dim/system) — verify no offline-exclusive affordances.
- [ ] Task 4.2: Liquid animated background: match RandMatQuGeA's blob/gradient motion (CSS keyframes + `prefers-reduced-motion` guard).
- [ ] Task 4.3: Glassmorphism surface tokens (`--surface`, `--shadow-glass`, backdrop-filter) — 2 commits (light + dark/dim).
- [ ] Task 4.4: Control toolbar top-row layout fidelity (mode selector, topic pills + search, utility buttons, response-mode toggle).
- [ ] Task 4.5: Control toolbar bottom-row fidelity (Single + Mental variants).
- [ ] Task 4.6: Mental mode: difficulty selector, countdown timer, score, pause/skip, scope/shuffle/unlimited, statistics, Start, progress bar — 4 commits.
- [ ] Task 4.7: Math toolbar: all symbol sections (Basic, Exponents/Roots, Calculus, Greek, Trig/Log, Vectors, Matrices, Logic/Sets, Relations, "more" dropdown) — 3 commits.
- [ ] Task 4.8: Live KaTeX preview in answer card (matches RandMatQuGeA feedback pattern).
- [ ] Task 4.9: Smart answer checking feedback UI (correct answer in KaTeX + plain-text alternate + equivalence note).
- [ ] Task 4.10: Onboarding modal fidelity (steps as `<ol>`).
- [ ] Task 4.11: Print worksheet modal + printable preview (`@media print`) — KaTeX only.
- [ ] Task 4.12: Weak-topics recommendation modal (`<ul>`).
- [ ] Task 4.13: Manage-data modal (in-app confirm dialog, no native `confirm`).
- [ ] Task 4.14: Settings modal Basic tab (theme, font, mode, scope, difficulty, timer, response mode, MCQ choice count, decimal tolerance, sig figs).
- [ ] Task 4.15: Settings modal Advanced tab (sound, vibration, reduced-data, performance toggles, shortcut customization, reset-to-defaults with confirm).
- [ ] Task 4.16: Keyboard shortcuts modal (`<thead>`/`<th scope>`).
- [ ] Task 4.17: Resume-session modal.
- [ ] Task 4.18: Theme toggle honoring `system` + `dim` (utility button, settings, `Ctrl+Shift+T`).
- [ ] Task 4.19: Footer matching RandMatQuGeA.
- [ ] Task 4.20: Micro-interactions + hover/focus states per RandMatQuGeA.
- [ ] Task 4.21: Responsive rules (<1024, <768, <480) matching RandMatQuGeA breakpoints.
- [ ] Task 4.22: Touch-target sizing (≥24px, ≥44px where space allows).
- [ ] Task 4.23: `prefers-contrast-more` / `forced-colors` / 100% root font-size.
- [ ] Task 4.24: Command palette (Ctrl+K) — RandMatQuGeA-DX-inspired quick actions.
- [ ] Task 4.25: DX: VSCode-recommended extensions + `.vscode/settings.json` for Solid.
- [ ] Task 4.26: DX: `README.md` rewrite for SolidJS + CSS Modules architecture (no offline-exclusive claims).
- [ ] Task 4.27: DX: `ARCHITECTURE.md` rewrite (Solid + pure-TS OOP core + MCQ/FRQ decoupling diagram).
- [ ] Task 4.28: DX: `CONTRIBUTING.md` rewrite (Solid conventions, CSS Modules, AGENTS.md formatting, commit conventions).
- [ ] Task 4.29: DX: Component playground route (`/playground`) for isolated component dev.
- [ ] Task 4.30: DX: Live spec editor route (`/spec-editor`) with preview.
- [ ] Task 4.31: DX: Template-authoring wizard route (`/wizard`).
- [ ] Task 4.32: DX: Coverage/perf dashboard route (`/dx`).
- [ ] Task 4.33–4.55 (23 commits): Pixel/interaction polish iteratively comparing against RandMatQuGeA screenshots (each commit narrows one visual/UX gap: spacing, motion timing, focus ring, pill overflow, modal transition, choice-button states, toolbar wrapping, etc.).

## Phase 5 — Bug Fixes Batch (200 bugs, ≈80 commits; \~2–3 bugs per commit)

> Each commit fixes a categorized cluster + adds regression tests. Count targets 200 distinct bugs.

- [ ] Task 5.1: Math pipeline — `$...$`/`$$...$$`/`\(...\)`/`\[...\]`/`\$` escape + unbalanced-delimiter handling (3 bugs).
- [ ] Task 5.2: Math pipeline — `solution_latex` substituted (vars + `{answer}`) before render; fallback to `solution_text` (2 bugs).
- [ ] Task 5.3: Math pipeline — exporters/print stop wrapping plain text in math delimiters (2 bugs).
- [ ] Task 5.4: Math pipeline — single KaTeX engine on main + print popup (2 bugs).
- [ ] Task 5.5: Math pipeline — no KaTeX error spans on standard templates (2 bugs).
- [ ] Task 5.6: MCQ grading — `'MultipleChoice'` vs `'MC'` string drift eliminated (canonical `QUESTION_TYPES`) (2 bugs).
- [ ] Task 5.7: MCQ grading — grading branch reachable for all types in both modes (2 bugs).
- [ ] Task 5.8: MCQ grading — `correct_choice_index` correct after shuffle (deterministic with seed) (2 bugs).
- [ ] Task 5.9: Stores — `practiceStore` slimmed; mode config moved to `settingsStore`; no duplication (3 bugs).
- [ ] Task 5.10: Stores — `progressStore.getStats()` memoized (stable reference) (2 bugs).
- [ ] Task 5.11: Stores — persistence migration for schema changes (response mode, sig figs) (2 bugs).
- [ ] Task 5.12: Modals — focus trap + return focus + scroll lock across all modals (3 bugs).
- [ ] Task 5.13: Modals — Settings tabs `role="tablist"` + arrow keys + `aria-selected`/`aria-controls` (2 bugs).
- [ ] Task 5.14: Modals — MCQ choices `role="radiogroup"`/`role="radio"` + `aria-checked` (2 bugs).
- [ ] Task 5.15: Shortcuts — Ctrl+G/Shift+Enter/Ctrl+1·2/Ctrl+,/Ctrl+Shift+T scope + conflict fixes (3 bugs).
- [ ] Task 5.16: Exporters — CSV/JSON/LaTeX field correctness + `response_mode` emission (3 bugs).
- [ ] Task 5.17: Parser — cross-reference validation + multi-error reporting (3 bugs).
- [ ] Task 5.18: Parser — enum/bool/set variable edge cases (2 bugs).
- [ ] Task 5.19: Evaluator — division by zero / sqrt-of-negative / log-of-invalid error handling (3 bugs).
- [ ] Task 5.20: Evaluator — degree/radian consistency for trig + inverse trig (2 bugs).
- [ ] Task 5.21: RNG — `nextInt`/`nextDouble` range inclusivity + seeding determinism (2 bugs).
- [ ] Task 5.22: A11y — focus-visible on all primary controls (2 bugs).
- [ ] Task 5.23: A11y — live regions for question/results/timer/score/theme/errors (3 bugs).
- [ ] Task 5.24: A11y — skip-link + landmarks + single `<h1>` (2 bugs).
- [ ] Task 5.25: A11y — `prefers-reduced-motion`/`prefers-contrast-more`/`forced-colors` honored (2 bugs).
- [ ] Task 5.26: A11y — 100% root font-size + browser font scaling (1 bug).
- [ ] Task 5.27: Responsiveness — stacked answer section + horizontal pills + font sizes at breakpoints (3 bugs).
- [ ] Task 5.28: Theming — `system` mode + persisted theme application on load (2 bugs).
- [ ] Task 5.29: Session resume — snapshot serialization + restore correctness (2 bugs).
- [ ] Task 5.30: Print worksheet — N-question generation + answer-key toggle + `@media print` (2 bugs).
- [ ] Task 5.31: Resilience — no-template / evaluation-failure user-facing messages + toasts (3 bugs).
- [ ] Task 5.32: Resilience — loading skeletons + `aria-busy` on async buttons (2 bugs).
- [ ] Task 5.33: Resilience — in-app confirm dialogs replace `window.confirm` (1 bug).
- [ ] Task 5.34: Dead code — remove unused exports, unreachable branches, `console.log`, swallowed errors (3 bugs).
- [ ] Task 5.35: Repo — `.gitignore` overhaul + `Cargo.lock` committed + no stale `target/` (2 bugs).
- [ ] Task 5.36: Repo — broken `@font-face`/`<link rel="preload">`/favicon refs fixed (2 bugs).
- [ ] Task 5.37: Repo — license consistency (Apache 2.0 everywhere) (1 bug).
- [ ] Task 5.38: Docs — README/ARCHITECTURE/CONTRIBUTING/CHANGELOG describe SolidJS stack (2 bugs).
- [ ] Task 5.39: CI — build + coverage gates on PR; npm caching; `version-bump` regenerates lockfile (3 bugs).
- [ ] Task 5.40: Core — `PhysicsCore` registries injectable; OCP test via facade (2 bugs).
- [ ] Task 5.41: Core — `configureCore` extension without editing core (1 bug).
- [ ] Task 5.42: Core — single source of truth for question types (`QUESTION_TYPES` const) (1 bug).
- [ ] Task 5.43: Core — barrels for `stores/`, `hooks/`, `components/ui/` (1 bug).
- [ ] Task 5.44: UI — MathToolbar visible + dropdown `.show` toggle + `data-symbol` widening (2 bugs).
- [ ] Task 5.45: UI — `ToastProvider` mounted + all async failures routed to toasts (2 bugs).
- [ ] Task 5.46: UI — `UtilityButtons` theme toggle honors `system`/`dim` (1 bug).
- [ ] Task 5.47: UI — Generate button `isLoading` disabled during async (1 bug).
- [ ] Task 5.48: UI — `<label>` for answer textarea (1 bug).
- [ ] Task 5.49: UI — `EmptyState` titles as real headings (1 bug).
- [ ] Task 5.50: UI — `ProgressBar` `aria-label`/`aria-valuetext` (1 bug).
- [ ] Task 5.51: UI — mental-mode focus preserved on pause↔resume swaps (1 bug).
- [ ] Task 5.52: Core — distractor dedup vs correct answer (1 bug).
- [ ] Task 5.53: Core — `ExpressionNormalizer` LaTeX/plain equivalence edge cases (2 bugs).
- [ ] Task 5.54: Core — `AnswerGrader` numeric-tolerance boundary (1 bug).
- [ ] Task 5.55: Core — `AdaptiveDifficulty` monotonic adjustment (1 bug).
- [ ] Task 5.56: Core — `SpacedRepetitionQueue` interval decay (1 bug).
- [ ] Task 5.57: Core — `ShareLinkCodec` round-trip + URL-safety (1 bug).
- [ ] Task 5.58: Core — `QuestionSetIo` schema validation (1 bug).
- [ ] Task 5.59: UI — `Matching`/`Ordering`/`MultipleResponse` rendering + grading (3 bugs).
- [ ] Task 5.60: UI — diagram SVG substitution + render (1 bug).
- [ ] Task 5.61: UI — significant-figures/scientific-notation input parsing (2 bugs).
- [ ] Task 5.62: UI — command palette action correctness (1 bug).
- [ ] Task 5.63: UI — shortcut customization persistence (1 bug).
- [ ] Task 5.64: UI — undo/redo in answer textarea correctness (1 bug).
- [ ] Task 5.65: UI — RTL layout mirroring (1 bug).
- [ ] Task 5.66: UI — voice input fallback + cleanup (1 bug).
- [ ] Task 5.67: UI — font-size control application across components (1 bug).
- [ ] Task 5.68: UI — reduced-data mode disables background animation + heavy assets (1 bug).
- [ ] Task 5.69: UI — achievements unlock triggers + notifications (1 bug).
- [ ] Task 5.70: UI — daily-goals reset at midnight + timezone (1 bug).
- [ ] Task 5.71: UI — leaderboard sort + tie-break (1 bug).
- [ ] Task 5.72: UI — spaced-repetition queue surfacing in Recommend modal (1 bug).
- [ ] Task 5.73: UI — bookmarks CRUD + re-attempt (1 bug).
- [ ] Task 5.74: UI — history list + re-attempt (1 bug).
- [ ] Task 5.75: UI — partial-credit hint display (1 bug).
- [ ] Task 5.76: UI — worked-solution step renderer (1 bug).
- [ ] Task 5.77: UI — formula cheat-sheet modal (1 bug).
- [ ] Task 5.78: UI — unit converter modal (1 bug).
- [ ] Task 5.79: UI — glossary modal (1 bug).
- [ ] Task 5.80: Remaining tail bugs — final sweep closing the count to 200 (covers residual a11y/perf/edge cases).

## Phase 6 — New Features Batch (100 features, ≈50 commits; \~2 features per commit)

> Each commit wires a feature end-to-end (core + UI + test) and logs it in `CHANGELOG.md`.

- [ ] Task 6.1: Response-mode toggle for all question types (UI) + per-question mode override.
- [ ] Task 6.2: Universal distractor count setting (2–6 choices) + adaptive distractor difficulty.
- [ ] Task 6.3: Answer-equivalence checking UI (show accepted equivalent forms).
- [ ] Task 6.4: Partial-credit hints + hint budget.
- [ ] Task 6.5: Worked-solution step renderer + reveal-on-demand.
- [ ] Task 6.6: Formula cheat-sheet modal + topic filter.
- [ ] Task 6.7: Spaced-repetition weak-topic queue + Recommend-modal integration.
- [ ] Task 6.8: Question history list + re-attempt.
- [ ] Task 6.9: Bookmark/favorite questions + bookmark-only practice.
- [ ] Task 6.10: Adaptive difficulty + difficulty-aware generation.
- [ ] Task 6.11: Timed-challenge mode variants (sprint, marathon).
- [ ] Task 6.12: Question annotation + notes persistence.
- [ ] Task 6.13: Diagram/image support in templates + renderer.
- [ ] Task 6.14: Unit-aware answers + unit input.
- [ ] Task 6.15: Significant-figures enforcement + UI indicator.
- [ ] Task 6.16: Scientific-notation input + toggle.
- [ ] Task 6.17: LaTeX answer input with live preview (toggle from plain).
- [ ] Task 6.18: Streaks (daily + current) + streak freezer.
- [ ] Task 6.19: Achievements/badges + unlock toasts.
- [ ] Task 6.20: Daily goals + progress ring.
- [ ] Task 6.21: Local leaderboards (per topic/scope/week).
- [ ] Task 6.22: Session tags + tag filter.
- [ ] Task 6.23: Custom question sets + set practice mode.
- [ ] Task 6.24: Import question sets (JSON) + validation.
- [ ] Task 6.25: Export question sets (JSON/CSV).
- [ ] Task 6.26: Share-question-link (encoded URL) + open-shared-link route.
- [ ] Task 6.27: Dim theme + 4-way theme picker.
- [ ] Task 6.28: Font-size control (XS–XL).
- [ ] Task 6.29: Reduced-data mode toggle.
- [ ] Task 6.30: Keyboard-shortcut customization.
- [ ] Task 6.31: Command palette (Ctrl+K) + action registry.
- [ ] Task 6.32: Undo/redo in answer textarea.
- [ ] Task 6.33: Voice input (Web Speech API) with fallback.
- [ ] Task 6.34: Right-to-left support + locale toggle.
- [ ] Task 6.35: More physics units/topics batch (content).
- [ ] Task 6.36: More physics templates batch (content).
- [ ] Task 6.37: Formula library expansion (50+ formulas).
- [ ] Task 6.38: Glossary modal + search.
- [ ] Task 6.39: Unit converter modal.
- [ ] Task 6.40: Constants reference modal.
- [ ] Task 6.41: Dimensional-analysis checker (answers + expressions).
- [ ] Task 6.42: Component playground (`/playground`).
- [ ] Task 6.43: Live spec editor with preview (`/spec-editor`).
- [ ] Task 6.44: Template-authoring wizard (`/wizard`).
- [ ] Task 6.45: Test coverage dashboard (`/dx`).
- [ ] Task 6.46: Perf budget monitor + bundle-size report.
- [ ] Task 6.47: Error boundary with retry + report.
- [ ] Task 6.48: Offline-toggle (testing) + network-status indicator.
- [ ] Task 6.49: Accessibility inspector hook (dev-only overlay).
- [ ] Task 6.50: Matching/Ordering/MultipleResponse question types (UI + grading) — completes the 100-feature count with the 3 new question types from Phase 2 surfaced end-to-end.

## Phase 7 — Polish, Verification & Release (≈20 commits)

- [ ] Task 7.1: Full a11y audit pass (axe-equivalent checklist) + fixes.
- [ ] Task 7.2: Full responsiveness audit across breakpoints + fixes.
- [ ] Task 7.3: Performance audit (bundle size, first paint, interaction latency) + `manualChunks` tuning.
- [ ] Task 7.4: Test coverage to ≥90% on core + smoke tests for all Solid components.
- [ ] Task 7.5: Lint/format zero-violation sweep (`oxlint` + `oxfmt`).
- [ ] Task 7.6: Typecheck zero-error sweep (`tsc --noEmit` strict).
- [ ] Task 7.7: Build zero-warning sweep (`vite build`).
- [ ] Task 7.8: Verify no React/Tailwind imports remain (grep gate in CI).
- [ ] Task 7.9: Verify no offline-exclusive UI affordances exist (system tray, OS shortcuts, SQLite UI, window effects, SW).
- [ ] Task 7.10: Verify core has zero JSX / zero `solid-js` imports (grep gate).
- [ ] Task 7.11: Verify MCQ/FRQ toggle enabled for all question types (E2E checklist).
- [ ] Task 7.12: Verify grading correct for all type×mode combinations (matrix test).
- [ ] Task 7.13: `CHANGELOG.md` final consolidation for the megatask.
- [ ] Task 7.14: `README.md`/`ARCHITECTURE.md`/`CONTRIBUTING.md` final review.
- [ ] Task 7.15: CI gates green on PR (typecheck + lint + format + test:coverage + build).
- [ ] Task 7.16: Commit-count verification (\~400) + conventional-commits lint.
- [ ] Task 7.17: Tauri shell build smoke (thin wrapper, no domain logic).
- [ ] Task 7.18: Final dead-code / unused-deps sweep.
- [ ] Task 7.19: Final `.gitignore` / repo hygiene check.
- [ ] Task 7.20: Megatask completion tag + release notes draft.

# Task Dependencies

- Phase 0 (tooling) must complete before Phase 3 (Solid UI) can start.
- Phase 1 (MCQ/FRQ decoupling, pure-TS) is independent of Phase 0/3 and MAY run in parallel with Phase 0; Phase 3 UI consumes Phase 1's `ResponseMode` API, so Phase 1's core types (Tasks 1.1–1.3) must land before Phase 3's `McqToggle`/`AnswerCard`.
- Phase 2 (core new features) depends on Phase 1's grader/normalizer (Tasks 1.15–1.16) for equivalence/sig-figs features; most Phase 2 tasks are independent of the UI and MAY parallelize with Phase 3.
- Phase 3 (Solid UI foundation) must complete before Phase 4 (RandMatQuGeA mimicry) and Phase 6 (feature UI) can start.
- Phase 4 (mimicry) and Phase 5 (bug fixes) MAY interleave; many bug fixes are easier once the Solid UI + mimicry lands.
- Phase 6 (new features) depends on Phase 2 (core features) + Phase 3 (UI foundation); feature commits pair core + UI.
- Phase 7 (verification) depends on all prior phases.
- Recommended parallel streams during execution: (A) Phase 1 core decoupling, (B) Phase 2 core features (after 1.15–1.16), (C) Phase 0→3→4 UI track. Phase 5 and 6 follow once their respective foundations land.

