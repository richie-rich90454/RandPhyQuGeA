/**
 * Barrel for the Solid stores.
 *
 * Mirrors {@link ../../stores/index}, re-exporting the five Solid reactive
 * stores and their public types. The {@link createSolidStore} bridge and its
 * types are also re-exported so Solid providers and hooks can wrap additional
 * Zustand-vanilla stores if needed.
 */
export {createSolidStore} from "./createSolidStore";
export type {SolidStore, StorePersistApi} from "./createSolidStore";
export {usePracticeStore} from "./practiceStore";
export type {PracticeState, AnswerFeedback} from "./practiceStore";
export {
    selectCurrentQuestion,
    selectIsActive,
    selectIsFinished,
    selectMode,
    selectResults,
    selectCurrentIndex,
    selectQuestions,
    selectQuestionStartTime,
    selectSessionStartTime,
    selectSpecification,
} from "./practiceStore";
export {useProgressStore, selectStats, selectRecentResults, selectResultsByMode} from "./progressStore";
export type {ProgressState, PracticeStats} from "./progressStore";
export {useSettingsStore} from "./settingsStore";
export type {SettingsState, ThemeMode, FontMode, FontSize} from "./settingsStore";
export {useSpecStore} from "./specStore";
export type {SpecState, SpecError} from "./specStore";
export {useUiStore} from "./uiStore";
export type {UiState, ModalId} from "./uiStore";
