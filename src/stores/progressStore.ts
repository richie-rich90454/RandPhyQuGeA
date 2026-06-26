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
	deleteResult: (id: string) => void;
	clearResults: () => void;
	getResultsByMode: (mode: PracticeMode) => PracticeResult[];
}
export const useProgressStore = create<ProgressState>()(
	persist(
		(set, get) => ({
			results: [],
			addResults: newResults => set(state => ({results: [...state.results, ...newResults]})),
			deleteResult: id => set(state => ({results: state.results.filter(r => r.id !== id)})),
			clearResults: () => set({results: []}),
			getResultsByMode: mode => get().results.filter(result => result.mode === mode)
		}),
		{
			name: 'physics-quest-progress',
			storage: createJSONStorage(() => localStorage)
		}
	)
);
/**
 * Derive aggregate {@link PracticeStats} from the progress store state.
 *
 * Exported as a standalone selector (rather than a `getStats()` method on the
 * store) so React components can subscribe to it idiomatically with Zustand v5:
 *
 * ```
 * const stats = useProgressStore(useShallow(selectStats));
 * ```
 *
 * or memoize it at the call site:
 *
 * ```
 * const results = useProgressStore(s => s.results);
 * const stats = useMemo(() => selectStats(useProgressStore.getState()), [results]);
 * ```
 *
 * Either pattern prevents unrelated store ticks from triggering re-renders,
 * since the stats object only changes when the underlying `results` change.
 */
export const selectStats = (state: ProgressState): PracticeStats => {
	const results = state.results;
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
		recentResults: (n: number) => [...results].reverse().slice(0, n),
		getResultsByMode: (mode: PracticeMode) => results.filter(r => r.mode === mode)
	};
};
