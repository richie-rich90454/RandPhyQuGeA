/**
 * Persisted application settings store.
 *
 * Backed by `localStorage` via Zustand's `persist` middleware so that
 * user preferences (theme, default practice options, spec content, etc.)
 * survive across sessions.
 */
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
export type ThemeMode = 'light' | 'dark' | 'system';
export interface SettingsState {
	// State
	themeMode: ThemeMode;
	specificationContent: string;
	specificationPath: string;
	defaultDifficulties: number[];
	defaultQuestionCount: number;
	mentalDurationSec: number;
	hapticEnabled: boolean;
	soundEnabled: boolean;
	onboardingCompleted: boolean;
	// Actions
	setThemeMode: (mode: ThemeMode) => void;
	setSpecification: (path: string, content: string) => void;
	setDefaultDifficulties: (difficulties: number[]) => void;
	setDefaultQuestionCount: (count: number) => void;
	setMentalDurationSec: (sec: number) => void;
	setHapticEnabled: (enabled: boolean) => void;
	setSoundEnabled: (enabled: boolean) => void;
	setOnboardingCompleted: (completed: boolean) => void;
	clearSpecification: () => void;
}
export const useSettingsStore = create<SettingsState>()(
	persist(
		set => ({
			// State
			themeMode: 'system',
			specificationContent: '',
			specificationPath: '',
			defaultDifficulties: [1, 2, 3, 4, 5, 6, 7],
			defaultQuestionCount: 10,
			mentalDurationSec: 60,
			hapticEnabled: true,
			soundEnabled: true,
			onboardingCompleted: false,
			// Actions
			setThemeMode: mode => set({themeMode: mode}),
			setSpecification: (path, content) => set({specificationPath: path, specificationContent: content}),
			setDefaultDifficulties: difficulties => set({defaultDifficulties: difficulties}),
			setDefaultQuestionCount: count => set({defaultQuestionCount: count}),
			setMentalDurationSec: sec => set({mentalDurationSec: sec}),
			setHapticEnabled: enabled => set({hapticEnabled: enabled}),
			setSoundEnabled: enabled => set({soundEnabled: enabled}),
			setOnboardingCompleted: completed => set({onboardingCompleted: completed}),
			clearSpecification: () => set({specificationPath: '', specificationContent: ''})
		}),
		{
			name: 'physics-quest-settings',
			storage: createJSONStorage(() => localStorage)
		}
	)
);
