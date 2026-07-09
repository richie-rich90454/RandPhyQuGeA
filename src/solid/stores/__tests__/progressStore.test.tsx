import {describe, it, expect, beforeEach} from "vitest";
import {render, screen} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {useProgressStore, selectStats} from "../progressStore";
import type {PracticeResult} from "../../../types/models";
const STORAGE_KEY="physics-quest-progress";
function makeResult(overrides: Partial<PracticeResult> = {}): PracticeResult {
	return {
		id: "r-default",
		question_id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		is_correct: true,
		time_taken_ms: 1000,
		user_answer: "42",
		timestamp: new Date().toISOString(),
		mode: "Single",
		difficulty: 1,
		...overrides,
	};
}
function CountView(): JSX.Element {
	const count = useProgressStore(s => s.results.length);
	return <div data-testid="count">{count()}</div>;
}
describe("solid progressStore", () => {
	beforeEach(() => {
		localStorage.clear();
		useProgressStore.setState({results: []});
	});
	describe("initial state", () => {
		it("starts with an empty results array", () => {
			expect(useProgressStore.getState().results).toEqual([]);
		});
	});
	describe("addResults", () => {
		it("appends results to the list", () => {
			const r1=makeResult({id: "r1"});
			const r2=makeResult({id: "r2"});
			useProgressStore.getState().addResults([r1, r2]);
			expect(useProgressStore.getState().results).toEqual([r1, r2]);
		});
		it("drops oldest results when the cap is exceeded", () => {
			const results: PracticeResult[]=[];
			for (let i=0; i<2005; i++) {
				results.push(makeResult({id: `r${i}`}));
			}
			useProgressStore.getState().addResults(results);
			const stored=useProgressStore.getState().results;
			expect(stored.length).toBe(2000);
			expect(stored[0]!.id).toBe("r5");
			expect(stored[stored.length - 1]!.id).toBe("r2004");
		});
	});
	describe("deleteResult", () => {
		it("removes the result with the matching id", () => {
			const r1=makeResult({id: "r1"});
			const r2=makeResult({id: "r2"});
			const store=useProgressStore.getState();
			store.addResults([r1, r2]);
			store.deleteResult("r1");
			expect(useProgressStore.getState().results).toEqual([r2]);
		});
	});
	describe("clearResults", () => {
		it("empties the results array", () => {
			const store=useProgressStore.getState();
			store.addResults([makeResult({id: "r1"}), makeResult({id: "r2"})]);
			store.clearResults();
			expect(useProgressStore.getState().results).toEqual([]);
		});
	});
	describe("getResultsByMode", () => {
		it("returns only results for the requested mode", () => {
			const store=useProgressStore.getState();
			store.addResults([makeResult({id: "r1", mode: "Single"}), makeResult({id: "r2", mode: "Mental"})]);
			expect(store.getResultsByMode("Mental").map(r => r.id)).toEqual(["r2"]);
		});
	});
	describe("selectStats", () => {
		it("returns correct aggregates for an empty list", () => {
			const stats=selectStats(useProgressStore.getState());
			expect(stats).toEqual({
				totalCount: 0,
				correctCount: 0,
				accuracy: 0,
				totalTimeMs: 0,
				singleCount: 0,
				mentalCount: 0,
			});
		});
		it("returns correct aggregates for mixed results", () => {
			const store=useProgressStore.getState();
			store.addResults([
				makeResult({id: "r1", is_correct: true, mode: "Single", time_taken_ms: 1000}),
				makeResult({id: "r2", is_correct: false, mode: "Mental", time_taken_ms: 2000}),
				makeResult({id: "r3", is_correct: true, mode: "Single", time_taken_ms: 3000}),
			]);
			const stats=selectStats(useProgressStore.getState());
			expect(stats.totalCount).toBe(3);
			expect(stats.correctCount).toBe(2);
			expect(stats.accuracy).toBeCloseTo(66.67, 2);
			expect(stats.totalTimeMs).toBe(6000);
			expect(stats.singleCount).toBe(2);
			expect(stats.mentalCount).toBe(1);
		});
		it("returns the same stats object when the results array is unchanged", () => {
			const store=useProgressStore.getState();
			store.addResults([makeResult({id: "r1"})]);
			const state=useProgressStore.getState();
			const first=selectStats(state);
			const second=selectStats(state);
			expect(first).toBe(second);
		});
	});
	describe("migration", () => {
		it("migrates old history shape to results shape", async () => {
			const oldResult=makeResult({id: "old1"});
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: {history: [oldResult]}}));
			await useProgressStore.persist!.rehydrate();
			expect(useProgressStore.getState().results).toEqual([oldResult]);
		});
		it("defaults to an empty array when results are missing", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: {}, version: 0}));
			await useProgressStore.persist!.rehydrate();
			expect(useProgressStore.getState().results).toEqual([]);
		});
	});
	describe("reactive subscription", () => {
		it("updates a rendered accessor when addResults fires", () => {
			render(() => <CountView />);
			expect(screen.getByTestId("count").textContent).toBe("0");
			useProgressStore.getState().addResults([makeResult({id: "r1"})]);
			expect(screen.getByTestId("count").textContent).toBe("1");
		});
	});
});
