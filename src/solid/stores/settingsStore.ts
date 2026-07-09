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
import type {PracticeMode} from "../../types/models";
export type ThemeMode = "light" | "dark" | "system";
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
	perfMode: boolean;
	waveBackground: boolean;
	blurEffects: boolean;
	livePreview: boolean;
	animations: boolean;
	fpsCap: number;
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
	setPerfMode: (enabled: boolean) => void;
	setWaveBackground: (enabled: boolean) => void;
	setBlurEffects: (enabled: boolean) => void;
	setLivePreview: (enabled: boolean) => void;
	setAnimations: (enabled: boolean) => void;
	setFpsCap: (cap: number) => void;
	setOnboardingCompleted: (completed: boolean) => void;
	setLocale: (locale: string) => void;
	setAccentHue: (hue: number) => void;
	setFontSize: (size: FontSize) => void;
	setReducedMotion: (enabled: boolean) => void;
	clearSpecification: () => void;
	resetToDefaults: () => void;
}
const defaultState= {
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
	perfMode: false,
	waveBackground: true,
	blurEffects: true,
	livePreview: true,
	animations: true,
	fpsCap: 0,
	onboardingCompleted: false,
	locale: "en",
	accentHue: 210,
	fontSize: "medium" as FontSize,
	reducedMotion: false,
} as Omit<SettingsState, "appVersion">;
const settingsStore=createStore<SettingsState>()(
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
			setPerfMode: enabled => set({perfMode: enabled}),
			setWaveBackground: enabled => set({waveBackground: enabled}),
			setBlurEffects: enabled => set({blurEffects: enabled}),
			setLivePreview: enabled => set({livePreview: enabled}),
			setAnimations: enabled => set({animations: enabled}),
			setFpsCap: cap => set({fpsCap: cap}),
			setOnboardingCompleted: completed => set({onboardingCompleted: completed}),
			setLocale: locale => set({locale: locale}),
			setAccentHue: hue => set({accentHue: hue}),
			setFontSize: size => set({fontSize: size}),
			setReducedMotion: enabled => set({reducedMotion: enabled}),
			clearSpecification: () => set({specificationPath: "", specificationContent: ""}),
			resetToDefaults: () => {
				const currentSpec=get();
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
			version: 1,
			migrate: (persistedState, _version) => {
				if (!persistedState || typeof persistedState !== "object") {
					return {...defaultState, appVersion: pkg.version};
				}
				const state=persistedState as Record<string, unknown>;
				const merged: SettingsState={...defaultState, appVersion: pkg.version};
				const knownKeys=new Set(Object.keys(defaultState));
				const picked=Object.fromEntries(Object.entries(state).filter(([key]) => knownKeys.has(key)));
				Object.assign(merged, picked);
				return merged;
			},
			partialize: state => {
				const {appVersion:_appVersion, ...rest}=state;
				void _appVersion;
				return rest;
			},
			storage: createJSONStorage(() => localStorage, {
				reviver: (key, value) => {
					if (key === "" && value && typeof value === "object" && !Array.isArray(value) && typeof (value as {version?: unknown}).version !== "number") {
						(value as {version: number}).version=0;
					}
					return value;
				},
			}),
		},
	),
);
export const useSettingsStore=createSolidStore<SettingsState>(settingsStore);
