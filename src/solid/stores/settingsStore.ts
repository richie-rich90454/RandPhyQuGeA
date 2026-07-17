/**
 * Persisted application settings store, Solid port.
 *
 * Mirrors {@link ../../stores/settingsStore}: user preferences (theme, default
 * practice options, spec content, mental-mode defaults, accessibility toggles,
 * etc.) are persisted to `localStorage` via Zustand's `persist` middleware and
 * exposed as a Solid reactive primitive through {@link createSolidStore}. The
 * `appVersion` field is derived from `package.json` and excluded from persisted
 * storage via `partialize`; the `migrate` function merges any persisted shape
 * onto the known default keys so old payloads never resurrect removed fields.
 */
import {createStore} from "zustand/vanilla";
import {persist, createJSONStorage} from "zustand/middleware";
import pkg from "../../../package.json";
import {createSolidStore} from "./createSolidStore";
import type {PracticeMode, ResponseMode} from "../../types/models";
export type ThemeMode = "light" | "dark" | "dim" | "system";
export type FontMode = "default" | "opendyslexic";
export type FontSize = "small" | "medium" | "large";
export interface SettingsState {
    themeMode: ThemeMode;
    fontMode: FontMode;
    specificationContent: string;
    specificationPath: string;
    defaultDifficulties: number[];
    defaultQuestionCount: number;
    defaultMode: PracticeMode;
    defaultScope: string;
    adaptiveEnabled: boolean;
    autoContinueEnabled: boolean;
    shuffleByDefault: boolean;
    notificationsEnabled: boolean;
    mentalDurationSec: number;
    mentalDifficulty: "easy" | "medium" | "hard";
    mentalMaxQuestions: number;
    mentalScope: string;
    mentalShuffle: boolean;
    mentalUnlimited: boolean;
    hapticEnabled: boolean;
    soundEnabled: boolean;
    autoCheckDelay: number;
    decimalPlaces: number;
    mcqChoices: number;
    defaultResponseMode: ResponseMode;
    sigFigs: number;
    perfMode: boolean;
    waveBackground: boolean;
    blurEffects: boolean;
    livePreview: boolean;
    animations: boolean;
    fpsCap: number;
    reducedDataMode: boolean;
    customShortcuts: Record<string, string>;
    onboardingCompleted: boolean;
    locale: string;
    accentHue: number;
    fontSize: FontSize;
    reducedMotion: boolean;
    appVersion: string;
    setThemeMode: (mode: ThemeMode) => void;
    setFontMode: (mode: FontMode) => void;
    setSpecification: (path: string, content: string) => void;
    setDefaultDifficulties: (difficulties: number[]) => void;
    setDefaultQuestionCount: (count: number) => void;
    setDefaultMode: (mode: PracticeMode) => void;
    setDefaultScope: (scope: string) => void;
    setAdaptiveEnabled: (enabled: boolean) => void;
    setAutoContinueEnabled: (enabled: boolean) => void;
    setShuffleByDefault: (enabled: boolean) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setMentalDurationSec: (sec: number) => void;
    setMentalDifficulty: (difficulty: "easy" | "medium" | "hard") => void;
    setMentalMaxQuestions: (count: number) => void;
    setMentalScope: (scope: string) => void;
    setMentalShuffle: (enabled: boolean) => void;
    setMentalUnlimited: (enabled: boolean) => void;
    setHapticEnabled: (enabled: boolean) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setAutoCheckDelay: (delay: number) => void;
    setDecimalPlaces: (places: number) => void;
    setMcqChoices: (count: number) => void;
    setDefaultResponseMode: (mode: ResponseMode) => void;
    setSigFigs: (figs: number) => void;
    setPerfMode: (enabled: boolean) => void;
    setWaveBackground: (enabled: boolean) => void;
    setBlurEffects: (enabled: boolean) => void;
    setLivePreview: (enabled: boolean) => void;
    setAnimations: (enabled: boolean) => void;
    setFpsCap: (cap: number) => void;
    setReducedDataMode: (enabled: boolean) => void;
    setCustomShortcut: (action: string, shortcut: string) => void;
    setOnboardingCompleted: (completed: boolean) => void;
    setLocale: (locale: string) => void;
    setAccentHue: (hue: number) => void;
    setFontSize: (size: FontSize) => void;
    setReducedMotion: (enabled: boolean) => void;
    clearSpecification: () => void;
    resetToDefaults: () => void;
}
const defaultState = {
    themeMode: "system" as ThemeMode,
    fontMode: "default" as FontMode,
    specificationContent: "",
    specificationPath: "",
    defaultDifficulties: [1, 2, 3, 4, 5, 6, 7],
    defaultQuestionCount: 10,
    defaultMode: "Single" as PracticeMode,
    defaultScope: "all",
    adaptiveEnabled: true,
    autoContinueEnabled: false,
    shuffleByDefault: false,
    notificationsEnabled: true,
    mentalDurationSec: 60,
    mentalDifficulty: "medium" as "easy" | "medium" | "hard",
    mentalMaxQuestions: 5,
    mentalScope: "all",
    mentalShuffle: false,
    mentalUnlimited: false,
    hapticEnabled: true,
    soundEnabled: false,
    autoCheckDelay: 800,
    decimalPlaces: 2,
    mcqChoices: 4,
    defaultResponseMode: "frq" as ResponseMode,
    sigFigs: 3,
    perfMode: false,
    waveBackground: true,
    blurEffects: true,
    livePreview: true,
    animations: true,
    fpsCap: 0,
    reducedDataMode: false,
    customShortcuts: {} as Record<string, string>,
    onboardingCompleted: false,
    locale: "en",
    accentHue: 210,
    fontSize: "medium" as FontSize,
    reducedMotion: false,
} as Omit<SettingsState, "appVersion">;
/** Current persisted-store schema version. Bump when adding/removing/renaming fields so {@link migrateSettingsState} can apply incremental migrations. */
export const SETTINGS_SCHEMA_VERSION = 2;
const VALID_RESPONSE_MODES: ReadonlySet<string> = new Set(["mcq", "frq"]);
/**
 * Migrate a persisted settings payload to the current schema.
 *
 * Starting from {@link defaultState}, known keys from the persisted payload are
 * overlaid one by one. Values that are `null`/`undefined`, or that fail a
 * per-field validity check (e.g. `defaultResponseMode` not in `mcq|frq`,
 * `sigFigs` not a positive finite integer), are skipped so the corresponding
 * default survives. Unknown keys are dropped. The `version` argument is
 * accepted for incremental migrations (v0 had no `responseMode`/`sigFigs`;
 * v1 added them; v2 added validation of those fields' values).
 */
export function migrateSettingsState(persistedState: unknown, version: number): Omit<SettingsState, "appVersion"> {
    const merged: Omit<SettingsState, "appVersion"> = {...defaultState};
    if (!persistedState || typeof persistedState !== "object" || Array.isArray(persistedState)) {
        return merged;
    }
    const state = persistedState as Record<string, unknown>;
    const knownKeys = new Set(Object.keys(defaultState));
    for (const [key, value] of Object.entries(state)) {
        if (!knownKeys.has(key)) continue;
        if (value === null || value === undefined) continue;
        if (key === "defaultResponseMode") {
            if (typeof value === "string" && VALID_RESPONSE_MODES.has(value)) {
                (merged as Record<string, unknown>)[key] = value;
            }
            continue;
        }
        if (key === "sigFigs") {
            if (typeof value === "number" && Number.isFinite(value) && value > 0 && Number.isInteger(value)) {
                (merged as Record<string, unknown>)[key] = value;
            }
            continue;
        }
        if (
            key === "mcqChoices" ||
            key === "defaultQuestionCount" ||
            key === "mentalMaxQuestions" ||
            key === "mentalDurationSec" ||
            key === "autoCheckDelay" ||
            key === "decimalPlaces" ||
            key === "fpsCap" ||
            key === "accentHue"
        ) {
            if (typeof value === "number" && Number.isFinite(value)) {
                (merged as Record<string, unknown>)[key] = value;
            }
            continue;
        }
        if (key === "defaultDifficulties") {
            if (Array.isArray(value) && value.every(v => typeof v === "number")) {
                (merged as Record<string, unknown>)[key] = value;
            }
            continue;
        }
        if (key === "customShortcuts") {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                (merged as Record<string, unknown>)[key] = value;
            }
            continue;
        }
        (merged as Record<string, unknown>)[key] = value;
    }
    void version;
    return merged;
}
const settingsStore = createStore<SettingsState>()(
    persist(
        (set, get) => ({
            ...defaultState,
            appVersion: pkg.version,
            setThemeMode: mode => set({themeMode: mode}),
            setFontMode: mode => set({fontMode: mode}),
            setSpecification: (path, content) => set({specificationPath: path, specificationContent: content}),
            setDefaultDifficulties: difficulties => set({defaultDifficulties: difficulties}),
            setDefaultQuestionCount: count => set({defaultQuestionCount: count}),
            setDefaultMode: mode => set({defaultMode: mode}),
            setDefaultScope: scope => set({defaultScope: scope}),
            setAdaptiveEnabled: enabled => set({adaptiveEnabled: enabled}),
            setAutoContinueEnabled: enabled => set({autoContinueEnabled: enabled}),
            setShuffleByDefault: enabled => set({shuffleByDefault: enabled}),
            setNotificationsEnabled: enabled => set({notificationsEnabled: enabled}),
            setMentalDurationSec: sec => set({mentalDurationSec: sec}),
            setMentalDifficulty: difficulty => set({mentalDifficulty: difficulty}),
            setMentalMaxQuestions: count => set({mentalMaxQuestions: count}),
            setMentalScope: scope => set({mentalScope: scope}),
            setMentalShuffle: enabled => set({mentalShuffle: enabled}),
            setMentalUnlimited: enabled => set({mentalUnlimited: enabled}),
            setHapticEnabled: enabled => set({hapticEnabled: enabled}),
            setSoundEnabled: enabled => set({soundEnabled: enabled}),
            setAutoCheckDelay: delay => set({autoCheckDelay: delay}),
            setDecimalPlaces: places => set({decimalPlaces: places}),
            setMcqChoices: count => set({mcqChoices: count}),
            setDefaultResponseMode: mode => set({defaultResponseMode: mode}),
            setSigFigs: figs => set({sigFigs: figs}),
            setPerfMode: enabled => set({perfMode: enabled}),
            setWaveBackground: enabled => set({waveBackground: enabled}),
            setBlurEffects: enabled => set({blurEffects: enabled}),
            setLivePreview: enabled => set({livePreview: enabled}),
            setAnimations: enabled => set({animations: enabled}),
            setFpsCap: cap => set({fpsCap: cap}),
            setReducedDataMode: enabled => set({reducedDataMode: enabled}),
            setCustomShortcut: (action, shortcut) => set(state => ({customShortcuts: {...state.customShortcuts, [action]: shortcut}})),
            setOnboardingCompleted: completed => set({onboardingCompleted: completed}),
            setLocale: locale => set({locale: locale}),
            setAccentHue: hue => set({accentHue: hue}),
            setFontSize: size => set({fontSize: size}),
            setReducedMotion: enabled => set({reducedMotion: enabled}),
            clearSpecification: () => set({specificationPath: "", specificationContent: ""}),
            resetToDefaults: () => {
                const currentSpec = get();
                set({
                    ...defaultState,
                    appVersion: pkg.version,
                    specificationContent: currentSpec.specificationContent,
                    specificationPath: currentSpec.specificationPath,
                });
            },
        }),
        {
            name: "physics-quest-settings",
            version: SETTINGS_SCHEMA_VERSION,
            migrate: (persistedState, version) => {
                const migrated = migrateSettingsState(persistedState, version);
                return {...migrated, appVersion: pkg.version} as SettingsState;
            },
            partialize: state => {
                const {appVersion: _appVersion, ...rest} = state;
                void _appVersion;
                return rest;
            },
            storage: createJSONStorage(() => localStorage, {
                reviver: (key, value) => {
                    if (key === "" && value && typeof value === "object" && !Array.isArray(value) && typeof (value as {version?: unknown}).version !== "number") {
                        (value as {version: number}).version = 0;
                    }
                    return value;
                },
            }),
        },
    ),
);
export const useSettingsStore = createSolidStore<SettingsState>(settingsStore);
