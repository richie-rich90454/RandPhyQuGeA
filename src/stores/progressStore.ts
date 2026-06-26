/**
 * Persisted practice results history store.
 *
 * Stores every {@link PracticeResult} produced across sessions and exposes
 * aggregate statistics. Backed by `localStorage` via Zustand's `persist`
 * middleware so progress is retained between app launches.
 */
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import type {PracticeMode, PracticeResult} from '../types/models';
export interface PracticeStats {
	totalCount: number;
	correctCount: number;
	accuracy: number;
	totalTimeMs: number;
	singleCount: number;
	mentalCount: number;
	recentResults: (n: number) => PracticeResult[];
	getResultsByMode: (mode: PracticeMode) => PracticeResult[];
}
export interface ProgressState {
	// State
	results: PracticeResult[];
	// Actions
	addResults: (newResults: PracticeResult[]) => void;
	clearResults: () => void;
	getStats: () => PracticeStats;
	getResultsByMode: (mode: PracticeMode) => PracticeResult[];
}
export const useProgressStore = create<ProgressState>()(
	persist(
		(set, get) => ({
			results: [],
			addResults: newResults => set(state => ({results: [...state.results, ...newResults]})),
			clearResults: () => set({results: []}),
			getResultsByMode: mode => get().results.filter(result => result.mode === mode),
			getStats: () => {
				const results = get().results;
				const totalCount = results.length;
				const correctCount = results.filter(r => r.is_correct).length;
				const accuracy = totalCount === 0 ? 0 : (correctCount / totalCount) * 100;
				const totalTimeMs = results.reduce((sum, r) => sum + r.time_taken_ms, 0);
				const singleCount = results.filter(r => r.mode === 'Single').length;
				const mentalCount = results.filter(r => r.mode === 'Mental').length;
				return {
					totalCount,
					correctCount,
					accuracy,
					totalTimeMs,
					singleCount,
					mentalCount,
					recentResults: (n: number) => [...get().results].reverse().slice(0, n),
					getResultsByMode: (mode: PracticeMode) => get().results.filter(r => r.mode === mode)
				};
			}
		}),
		{
			name: 'physics-quest-progress',
			storage: createJSONStorage(() => localStorage)
		}
	)
);
