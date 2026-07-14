/**
 * Barrel for the Solid primitives (the SolidJS equivalent of React hooks).
 *
 * Re-exports every createX primitive and its public options/return types so
 * consumers import from "../primitives" instead of reaching into individual
 * files. Mirrors the barrels in ../stores and ../components/ui.
 */
export {createCountUp} from "./createCountUp";
export type {CreateCountUpOptions} from "./createCountUp";
export {createCountdownTimer} from "./createCountdownTimer";
export type {CreateCountdownTimerOptions, CreateCountdownTimerReturn} from "./createCountdownTimer";
export {createGlobalShortcuts} from "./createGlobalShortcuts";
export type {CreateGlobalShortcutsOptions} from "./createGlobalShortcuts";
export {createGsapContext} from "./createGsapContext";
export type {GsapSetup, CreateGsapContextOptions} from "./createGsapContext";
export {createHashRouter} from "./createHashRouter";
export type {HashRouter} from "./createHashRouter";
export {createMcqHotReconfig} from "./createMcqHotReconfig";
export type {CreateMcqHotReconfigOptions} from "./createMcqHotReconfig";
export {createMediaQuery} from "./createMediaQuery";
export {createPersistedSignal} from "./createPersistedSignal";
export type {CreatePersistedSignalOptions} from "./createPersistedSignal";
export {createPersistedStore} from "./createPersistedStore";
export type {CreatePersistedStoreOptions} from "./createPersistedStore";
export {createPracticeActions} from "./createPracticeActions";
export type {CreatePracticeActionsOptions, CreatePracticeActionsReturn} from "./createPracticeActions";
export {createReducedMotion} from "./createReducedMotion";
export type {CreateReducedMotionOptions} from "./createReducedMotion";
export {createSessionSnapshot} from "./createSessionSnapshot";
export type {CreateSessionSnapshotOptions, CreateSessionSnapshotReturn} from "./createSessionSnapshot";
export {createShortcut} from "./createShortcut";
export type {ShortcutModifiers, CreateShortcutOptions} from "./createShortcut";
export {createSpecLoader} from "./createSpecLoader";
export type {CreateSpecLoaderOptions, CreateSpecLoaderReturn} from "./createSpecLoader";
export {createTheme} from "./createTheme";
export type {CreateThemeOptions} from "./createTheme";
export {createVoiceInput} from "./createVoiceInput";
export type {CreateVoiceInputOptions, VoiceInputState} from "./createVoiceInput";
