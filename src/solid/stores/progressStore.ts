/**
 * Persisted practice results history store, Solid port.
 *
 * Mirrors {@link ../../stores/progressStore}: every {@link PracticeResult}
 * produced across sessions is persisted to `localStorage` via Zustand's
 * `persist` middleware and exposed as a Solid reactive primitive through
 * {@link createSolidStore}. The `selectStats`/`selectRecentResults`/
 * `selectResultsByMode` selector helpers are pure functions over the state,
 * reused unchanged so Solid components can subscribe idiomatically.
 */
import {createStore} from "zustand/vanilla";
import {persist, createJSONStorage} from "zustand/middleware";
import {createSolidStore} from "./createSolidStore";
import type {PracticeMode, PracticeResult} from "../../types/models";
export interface PracticeStats {
    totalCount: number;
    correctCount: number;
    accuracy: number;
    totalTimeMs: number;
    singleCount: number;
    mentalCount: number;
}
export interface ProgressState {
    results: PracticeResult[];
    addResults: (newResults: PracticeResult[]) => void;
    deleteResult: (id: string) => void;
    clearResults: () => void;
    getResultsByMode: (mode: PracticeMode) => PracticeResult[];
}
const MAX_RESULTS = 2000;
const progressStore = createStore<ProgressState>()(
    persist(
        (set, get) => ({
            results: [],
            addResults: newResults =>
                set(state => {
                    const combined = [...state.results, ...newResults];
                    const results = combined.length > MAX_RESULTS ? combined.slice(-MAX_RESULTS) : combined;
                    return {results};
                }),
            deleteResult: id => set(state => ({results: state.results.filter(r => r.id !== id)})),
            clearResults: () => set({results: []}),
            getResultsByMode: mode => get().results.filter(result => result.mode === mode),
        }),
        {
            name: "physics-quest-progress",
            version: 1,
            migrate: (persistedState, version) => {
                if (!persistedState || typeof persistedState !== "object" || Array.isArray(persistedState)) {
                    return {results: []} as unknown as ProgressState;
                }
                const state = persistedState as Record<string, unknown>;
                if (version === 0) {
                    if ("history" in state && Array.isArray(state.history)) {
                        state.results = state.history;
                        delete state.history;
                    }
                }
                if (!state.results || !Array.isArray(state.results)) {
                    state.results = [];
                }
                return {results: state.results as PracticeResult[]} as unknown as ProgressState;
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
export const useProgressStore = createSolidStore<ProgressState>(progressStore);
let cachedResults: PracticeResult[] | null = null;
let cachedStats: PracticeStats | null = null;
/**
 * Derive aggregate {@link PracticeStats} from the progress store state.
 *
 * The selector caches the last result and returns the same object reference
 * when the underlying `results` array is unchanged, preventing unnecessary
 * reactive updates. For filtered or sliced access, use {@link selectResultsByMode}
 * and {@link selectRecentResults}.
 */
export const selectStats = (state: ProgressState): PracticeStats => {
    const results = state.results;
    if (cachedResults === results && cachedStats) {
        return cachedStats;
    }
    const totalCount = results.length;
    const correctCount = results.filter(r => r.is_correct).length;
    const accuracy = totalCount === 0 ? 0 : (correctCount / totalCount) * 100;
    const totalTimeMs = results.reduce((sum, r) => sum + r.time_taken_ms, 0);
    const singleCount = results.filter(r => r.mode === "Single").length;
    const mentalCount = results.filter(r => r.mode === "Mental").length;
    cachedResults = results;
    cachedStats = {totalCount, correctCount, accuracy, totalTimeMs, singleCount, mentalCount};
    return cachedStats;
};
/** Return the most recent `n` results, newest first. */
export const selectRecentResults = (state: ProgressState, n: number): PracticeResult[] => [...state.results].reverse().slice(0, n);
/** Return all results for a specific practice mode. */
export const selectResultsByMode = (state: ProgressState, mode: PracticeMode): PracticeResult[] => state.results.filter(r => r.mode === mode);
