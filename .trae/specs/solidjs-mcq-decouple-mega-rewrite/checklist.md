# Checklist

Verification checkpoints for the `solidjs-mcq-decouple-mega-rewrite` megatask. Each must be checked only after the corresponding phase/task work is complete.

## Tooling & Dependencies (Phase 0)
- [x] `package.json` has `solid-js`, `vite-plugin-solid`, `babel-preset-solid`; `@solidjs/testing-library` + `@testing-library/jest-dom` in devDeps (task 0.2, commit 843efe3).
- [ ] DEFERRED to end of Phase 3 (task 0.3): `package.json` still lists `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `@testing-library/react`, `framer-motion`, `@gsap/react`, `@phosphor-icons/react` — removal gated on zero React imports under `src/` (excluding `src/solid/**`).
- [ ] DEFERRED to end of Phase 3 (task 0.4): `tailwindcss`, `postcss`, `autoprefixer` deps + `tailwind.config.js`/`postcss.config.js` stay — removal gated on zero `@tailwind`/`@apply` directives under `src/`.
- [x] `vite.config.ts` runs `vite-plugin-solid` ALONGSIDE `@vitejs/plugin-react` (solid scoped to `src/solid/**`, React excludes it) + a solid vendor chunk (task 0.5, commit 318c9fb). Coexistence: React plugin stays until end of Phase 3.
- [x] `vitest.config.ts` configured for Solid testing (jsdom + solid plugin scoped to `src/solid/**` + `hot:false` to disable `@solid-refresh` HMR injection under vitest + jest-dom setup) (task 0.6, commits e2dfe1a + eea8e03).
- [x] Split tsconfig coexistence: base `tsconfig.json` is React (`jsx: "react-jsx"`, excludes `src/solid/**`); `tsconfig.solid.json` (`jsx: "preserve"`, `jsxImportSource: "solid-js"`, includes `src/solid`) + `typecheck:solid` script (task 0.7, commit 5d5e1e4).
- [x] `src/solid/index.html` mounts the Solid preview (root `index.html` still mounts React `/src/main.tsx`) (task 0.10, commit 314d6ce; script src made relative in commit 00e159d).
- [x] `.gitignore` covers `.vite/`, `.lightningcss/`, `*.tsbuildinfo`, `.eslintcache`, `src/solid/dist/` (task 0.12, commit fc52688).
- [x] `.oxlintrc.json` `src/solid/**` override disables React hooks rules (task 0.8, commit 6a055fe).
- [x] `src/solid/solid-env.d.ts` references `vite/client` + `solid-js` types (task 0.9, commit f2e630f).
- [x] CI `.github/workflows/code-quality.yml` has a Solid typecheck step (task 0.11, commit f622dcd).
- [x] `dev:solid`, `build:solid`, `typecheck:solid` npm scripts; `build:solid` fixed for Vite 8 positional root (task 0.13 + fix, commits 37167c2 + 00e159d).
- [x] `src/solid/styles/globals.css` liquid/glass design tokens (light/dark/dim) + base/reset CSS, no Tailwind (task 0.14, commits fe25761/e467957/6fb45ea/7e56ea0).
- [x] `src/solid/main.tsx` + `App.tsx` + `App.module.css` Solid shell stub (task 0.15, commit b35f977).
- [x] Solid `ErrorBoundaryRetry` primitive + co-located CSS module + 6-test `@solidjs/testing-library` suite, wired into `App.tsx` (task 0.16, commit f5582e7).
- [x] 14 Phase 3 Migration Plan anchors added to `CHANGELOG.md` (tasks 0.17–0.30, commits 6e09ed6…23199c3).
- [x] `npx tsc --noEmit` (base) clean; `npx tsc --noEmit -p tsconfig.solid.json` clean.
- [x] `npx vitest run` = 71 files / 803 tests pass (797 React + 6 Solid).
- [x] `npm run build:solid` produces `src/solid/dist/` (13 modules).

## MCQ/FRQ Decoupling (Phase 1)
- [x] `ResponseMode` type exists; `GeneratedQuestion` has `response_mode`, `choices?`, `correct_choice_index?`.
- [x] `QuestionFilter` has `responseMode?` field.
- [x] `ResponseFormatStrategy` interface defined; per-type strategies implemented (`Numeric`, `Boolean`, `BlankToken`, `ShortAnswerNeighbor`).
- [x] `UniversalDistractorGenerator` picks strategy per type, dedupes, scales to choice count.
- [x] `McqAssembler` decorates base questions with choices when mode is `mcq`.
- [x] `BaseQuestionHandler` no longer generates choices; handlers produce answer + solution only.
- [x] `QuestionGenerator` threads `responseMode` through `generate`/`generateBatch`/`generateUnique`.
- [x] `AnswerGrader` class dispatches by mode + type (choice-index / exact / boolean / blank-token / numeric-tolerance).
- [x] `ExpressionNormalizer` handles fraction↔decimal, commutative reordering, `2x`↔`2*x`, whitespace — no math.js.
- [x] `PhysicsCore` constructor injects `AnswerGrader`, `UniversalDistractorGenerator`, `McqAssembler`; `configureCore` exposes them.
- [x] All exporters emit `response_mode` and render choices when present.
- [x] OCP test exercises a custom `ResponseFormatStrategy` end-to-end via `PhysicsCore.generateQuestion({responseMode:'mcq'})`.
- [x] Unit tests cover every question type × every response mode (10 combinations) for generation + grading.
- [x] Unit tests cover `UniversalDistractorGenerator` (dedup, count scaling, no-duplicate-correct invariant).
- [x] Unit tests cover `ExpressionNormalizer` equivalence cases.
- [x] Unit tests cover `AnswerGrader` per type/mode (correct/incorrect/partial).

## Phase 1 Hardening (Tasks 1.27–1.35)
- [x] `SeededRandom` (xorshift32) provides deterministic distractor ordering; two different seeds diverge (Task 1.27).
- [x] `McqAssembler.assemble` accepts an optional `seed` and `QuestionGenerator.generateFromTemplate` threads a seed derived from `template.id + variable hash` so MCQ choice ordering is stable for a given seed (Task 1.28).
- [x] `NumericDistractorStrategy` is significant-figures-aware — decimal answers preserve their sig-fig count in distractors; integer answers keep legacy behavior (Task 1.29).
- [x] `QuestionGenerator.generateUnique` guards against `excludeIds` emptying a single-template pool by re-randomizing variables (Task 1.30).
- [x] `McqAssembler` falls back to `response_mode='frq'` with `grader_hint='mcq-unavailable-fallback'` when the strategy yields zero distractors (Task 1.31).
- [x] `McqAssembler` pads short distractor sets (≥1 distractor but fewer than requested) with a single literal `"None of the above"` choice that is never marked correct (Task 1.32).
- [x] Comprehensive JSDoc on `McqAssembler`, `UniversalDistractorGenerator`, and the `ResponseFormatStrategy`/`DistractorContext`/`McqAssemblerLike`/`UniversalDistractorGeneratorLike` interfaces in `contracts.ts` (Task 1.33).
- [x] Comprehensive JSDoc on `AnswerGrader`, `ExpressionNormalizer`, all four `*DistractorStrategy` classes, and the `AnswerGraderLike`/`ExpressionNormalizerLike`/`GradeResult` interfaces (Task 1.34).
- [x] JSDoc on `BaseQuestionHandler` and all handler subclasses; hardening test exercises every question type × every response mode (10 combinations) end-to-end through `PhysicsCore` with a seeded RNG asserting reproducibility, seed divergence, batch reproducibility, and grading in both modes (Task 1.35).

## Core OOP Isolation (Phases 1 & 2)
- [x] No file under `src/lib/physics/` imports from `solid-js` or any component file (grep-verified; CI gate).
- [x] No file under `src/lib/physics/` contains JSX.
- [x] All extension points are `interface`-defined; registries injectable through `PhysicsCore`.
- [x] New core classes (`SpacedRepetitionQueue`, `QuestionHistory`, `Bookmarks`, `Achievements`, `DailyGoals`, `LocalLeaderboard`, `ShareLinkCodec`, `QuestionSetIo`, `AdaptiveDifficulty`, `HintGenerator`, `DimensionalAnalysisChecker`, `UnitConverter`, `ConstantsReference`, `Glossary`, `WorkedSolution`) are pure TS with JSDoc + tests.
- [x] New question types `Matching`, `Ordering`, `MultipleResponse` registered via `QuestionTypeRegistry` (no edits to `QuestionGenerator`).
- [x] New variable types `bool`/`set` registered via `VariableTypeRegistry`.
- [x] New evaluator functions registered via `FunctionRegistry`.

## SolidJS + CSS Modules Migration (Phase 3)
- [ ] No file under `src/` imports from `react` (grep-verified; CI gate).
- [ ] All components use Solid primitives (`createSignal`, `createStore`, `createMemo`, `createEffect`, `onCleanup`, `<Show>`, `<For>`, `<Switch>`/`<Match>`, `<ErrorBoundary>`, `<Portal>`, `<Dynamic>`).
- [ ] No React idioms remain (`useEffect`, `useState`, `useRef`, `useMemo`, `useCallback`, `useContext`).
- [ ] Every styled component has a co-located `*.module.css`; classes applied via the styles import object.
- [ ] Design tokens (colors, radii, shadows, motion) live as CSS custom properties in `src/styles/globals.css`.
- [ ] Stores re-implemented as Solid stores (or Zustand-vanilla + Solid `useStore` primitive).
- [ ] Hooks re-implemented as Solid primitives.
- [ ] `ToastProvider` mounted at root.
- [ ] Skip-link, `<header>`/`<nav>`/`<main>`/`<h1>`, live regions present.
- [ ] Smoke tests for primitives, toolbars, modals, main content using `@solidjs/testing-library`.
- [ ] Accessibility: focus-visible, ARIA roles (radiogroup, tablist), focus-trapped modals, reduced-motion, 100% root font-size.

## RandMatQuGeA Mimicry (Phase 4)
- [ ] Liquid animated background reproduces RandMatQuGeA aesthetic (CSS-only, `prefers-reduced-motion` guarded).
- [ ] Glassmorphism surfaces match RandMatQuGeA tokens (light/dark/dim/system).
- [ ] Control toolbar top + bottom rows match RandMatQuGeA structure.
- [ ] Mental mode controls (difficulty, timer, score, pause/skip, scope/shuffle/unlimited, statistics, Start, progress bar) match.
- [ ] Math toolbar has all symbol sections + working "more" dropdown.
- [ ] Live KaTeX preview in answer card.
- [ ] Smart answer checking feedback (KaTeX + plain-text alternate + equivalence note).
- [ ] All modals (onboarding, print, recommend, manage-data, settings Basic/Advanced, shortcuts, resume) match RandMatQuGeA structure.
- [ ] Theme toggle honors `system` + `dim`.
- [ ] Responsive rules match RandMatQuGeA breakpoints (<1024, <768, <480).
- [ ] NO offline-exclusive affordances: no system-tray UI, no OS-global-shortcut config, no SQLite/native-storage UI, no window-effect controls, no PWA service worker.
- [ ] `README.md`/`ARCHITECTURE.md`/`CONTRIBUTING.md` describe SolidJS + CSS Modules architecture with no offline-exclusive claims.

## Bug Fixes (Phase 5) — 200 bugs
- [ ] Math pipeline bugs fixed (delimiters, solution substitution, exporter over-rendering, single engine, no error spans).
- [ ] MCQ grading bugs fixed (string drift, reachable branch, correct index after shuffle).
- [ ] Store bugs fixed (duplication, memoization, persistence migration).
- [ ] Modal bugs fixed (focus trap, return focus, scroll lock, tab/radiogroup semantics).
- [ ] Shortcut bugs fixed (scope, conflicts).
- [ ] Exporter bugs fixed (field correctness, `response_mode` emission).
- [ ] Parser bugs fixed (cross-reference validation, variable edge cases).
- [ ] Evaluator bugs fixed (div-by-zero, sqrt/log invalid, degree/radian).
- [ ] RNG bugs fixed (range inclusivity, seeding determinism).
- [ ] A11y bugs fixed (focus-visible, live regions, landmarks, motion/contrast/font).
- [ ] Responsiveness bugs fixed (breakpoints, touch targets).
- [ ] Theming bugs fixed (system mode, persistence).
- [ ] Session-resume bugs fixed.
- [ ] Print-worksheet bugs fixed.
- [ ] Resilience bugs fixed (empty states, async failures, confirm dialogs).
- [ ] Dead-code / repo-hygiene / docs / CI bugs fixed.
- [ ] New-feature bugs fixed (distractor dedup, normalizer, grader tolerance, adaptive difficulty, spaced repetition, share-link, question-set IO, new question types, diagrams, sig-figs/sci-notation, command palette, shortcut customization, undo/redo, RTL, voice input, font-size, reduced-data, achievements, daily goals, leaderboard, SR queue surface, bookmarks, history, hints, worked solutions, formula sheet, unit converter, glossary).
- [ ] Total distinct bug count reaches 200 (tracked in `CHANGELOG.md`).

## New Features (Phase 6) — 100 features
- [ ] Response-mode toggle works for ALL question types (verified per type).
- [ ] Universal distractor count setting works (2–6).
- [ ] Equivalence checking surfaces accepted forms.
- [ ] Partial-credit hints + budget.
- [ ] Worked-solution step renderer + reveal-on-demand.
- [ ] Formula cheat-sheet modal + topic filter.
- [ ] Spaced-repetition queue + Recommend-modal integration.
- [ ] Question history + re-attempt.
- [ ] Bookmarks + bookmark-only practice.
- [ ] Adaptive difficulty.
- [ ] Timed-challenge variants.
- [ ] Question annotations.
- [ ] Diagram support.
- [ ] Unit-aware answers.
- [ ] Significant-figures enforcement.
- [ ] Scientific-notation input.
- [ ] LaTeX answer input + preview.
- [ ] Streaks + freezer.
- [ ] Achievements/badges.
- [ ] Daily goals + ring.
- [ ] Local leaderboards.
- [ ] Session tags + filter.
- [ ] Custom question sets + set practice.
- [ ] Import/export question sets.
- [ ] Share-question-link + open-shared-link route.
- [ ] Dim theme + 4-way picker.
- [ ] Font-size control.
- [ ] Reduced-data mode.
- [ ] Shortcut customization.
- [ ] Command palette (Ctrl+K).
- [ ] Undo/redo in answer.
- [ ] Voice input.
- [ ] RTL support.
- [ ] More units/topics/templates (content).
- [ ] Formula library expansion (50+).
- [ ] Glossary modal.
- [ ] Unit converter modal.
- [ ] Constants reference modal.
- [ ] Dimensional-analysis checker.
- [ ] Component playground (`/playground`).
- [ ] Live spec editor (`/spec-editor`).
- [ ] Template wizard (`/wizard`).
- [ ] Coverage dashboard (`/dx`).
- [ ] Perf budget monitor.
- [ ] Error boundary with retry.
- [ ] Offline-toggle (testing) + network indicator.
- [ ] A11y inspector hook (dev overlay).
- [ ] Matching/Ordering/MultipleResponse question types end-to-end.
- [ ] Total distinct feature count reaches 100 (tracked in `CHANGELOG.md`).

## Commit Hygiene & Quality Gates (Phase 7)
- [ ] Commit count is ~400; all follow Conventional Commits.
- [ ] No commit bundles unrelated changes; sequence leaves repo green.
- [ ] `npm run typecheck` passes (strict, zero `any`/`@ts-ignore`).
- [ ] `npm run lint` + `npm run format:check` pass (oxlint + oxfmt, AGENTS.md rules).
- [ ] `npm run test:coverage` passes (≥90% core).
- [ ] `npm run build` passes (zero warnings, vendor chunks for solid/katex).
- [ ] CI runs typecheck + lint + format + test:coverage + build on every PR.
- [ ] grep gate: no `react` imports under `src/`; no `solid-js` imports under `src/lib/physics/`; no JSX under `src/lib/physics/`.
- [ ] grep gate: no Tailwind classes; no offline-exclusive affordances (tray, OS shortcuts, SQLite UI, window effects, SW).
- [ ] Tauri shell builds and contains no domain logic.
- [ ] `CHANGELOG.md` consolidates the megatask; `README`/`ARCHITECTURE`/`CONTRIBUTING` final.
- [ ] MCQ/FRQ matrix test passes (all type×mode combinations generate + grade correctly).
