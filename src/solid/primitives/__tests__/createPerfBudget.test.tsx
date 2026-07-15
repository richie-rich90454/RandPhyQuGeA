import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import type {JSX} from "solid-js";
import {createPerfBudget} from "../createPerfBudget";
import type {CreatePerfBudgetReturn} from "../createPerfBudget";
import type {BudgetEntry} from "../../../lib/perf/PerfBudget";
interface FakeEntry {
	name: string;
	transferSize: number;
	encodedBodySize: number;
}
function makeEntries(list: FakeEntry[]): PerformanceResourceTiming[] {
	return list.map(e => ({
		name: e.name,
		transferSize: e.transferSize,
		encodedBodySize: e.encodedBodySize,
	} as unknown as PerformanceResourceTiming));
}
let captured: CreatePerfBudgetReturn | null=null;
function makeRoot(entries: FakeEntry[], budget?: BudgetEntry[], observe?: boolean): () => JSX.Element {
	return () => {
		captured=createPerfBudget({
			budget,
			getEntries: () => makeEntries(entries),
			observe,
		});
		return <div>pb</div>;
	};
}
beforeEach(() => {
	captured=null;
});
describe("createPerfBudget", () => {
	it("returns zero results for an empty resource list", () => {
		render(makeRoot([]));
		expect(captured!.results()).toHaveLength(5);
		for (let r of captured!.results()) {
			expect(r.actualBytes).toBe(0);
			expect(r.count).toBe(0);
			expect(r.passed).toBe(true);
		}
	});
	it("uses the provided budget entries", () => {
		let budget: BudgetEntry[]=[{category: "script", limitBytes: 1000}];
		render(makeRoot([], budget));
		expect(captured!.results()).toHaveLength(1);
		expect(captured!.results()[0]!.category).toBe("script");
	});
	it("defaults to PerfBudget.defaultBudget when no budget is passed", () => {
		render(makeRoot([]));
		expect(captured!.results()).toHaveLength(5);
	});
	it("classifies and sums resource entries by category", () => {
		render(makeRoot([
			{name: "app.js", transferSize: 400, encodedBodySize: 0},
			{name: "chunk.mjs", transferSize: 300, encodedBodySize: 0},
			{name: "styles.css", transferSize: 100, encodedBodySize: 0},
		]));
		let scriptResult=captured!.results().find(r => r.category==="script");
		expect(scriptResult?.actualBytes).toBe(700);
		expect(scriptResult?.count).toBe(2);
		let styleResult=captured!.results().find(r => r.category==="style");
		expect(styleResult?.actualBytes).toBe(100);
	});
	it("marks a category failed when the sum exceeds the limit", () => {
		let budget: BudgetEntry[]=[{category: "script", limitBytes: 500}];
		render(makeRoot([{name: "app.js", transferSize: 600, encodedBodySize: 0}], budget));
		let scriptResult=captured!.results().find(r => r.category==="script");
		expect(scriptResult?.passed).toBe(false);
		expect(captured!.allPassed()).toBe(false);
	});
	it("reports allPassed true when every category is within budget", () => {
		let budget: BudgetEntry[]=[{category: "script", limitBytes: 1000}];
		render(makeRoot([{name: "app.js", transferSize: 400, encodedBodySize: 0}], budget));
		expect(captured!.allPassed()).toBe(true);
	});
	it("falls back to encodedBodySize when transferSize is 0", () => {
		let budget: BudgetEntry[]=[{category: "script", limitBytes: 1000}];
		render(makeRoot([{name: "app.js", transferSize: 0, encodedBodySize: 350}], budget));
		let scriptResult=captured!.results().find(r => r.category==="script");
		expect(scriptResult?.actualBytes).toBe(350);
	});
	it("refresh re-computes from the current entries", () => {
		let entries: FakeEntry[]=[{name: "app.js", transferSize: 100, encodedBodySize: 0}];
		let budget: BudgetEntry[]=[{category: "script", limitBytes: 1000}];
		render(() => {
			captured=createPerfBudget({
				budget,
				getEntries: () => makeEntries(entries),
			});
			return <div>pb</div>;
		});
		expect(captured!.results().find(r => r.category==="script")?.actualBytes).toBe(100);
		entries.push({name: "chunk.js", transferSize: 250, encodedBodySize: 0});
		captured!.refresh();
		expect(captured!.results().find(r => r.category==="script")?.actualBytes).toBe(350);
	});
	it("exposes the underlying PerfBudget instance", () => {
		render(makeRoot([]));
		expect(captured!.budget).toBeDefined();
		expect(captured!.budget.getEntries()).toHaveLength(5);
	});
	it("subscribes via PerformanceObserver when observe is true", () => {
		let observerCalls: {type: string, buffered: boolean}[]=[];
		let disconnect=vi.fn();
		class FakeObserver {
			constructor(cb: PerformanceObserverCallback) {
				(this as unknown as {cb: PerformanceObserverCallback}).cb=cb;
			}
			observe(opts: {type: string, buffered: boolean}) {
				observerCalls.push(opts);
			}
			disconnect() {
				disconnect();
			}
		}
		let original=globalThis.PerformanceObserver;
		globalThis.PerformanceObserver=FakeObserver as unknown as typeof PerformanceObserver;
		try {
			let rendered=render(makeRoot([], [{category: "script", limitBytes: 1000}], true));
			expect(observerCalls).toHaveLength(1);
			expect(observerCalls[0].type).toBe("resource");
			rendered.unmount();
			expect(disconnect).toHaveBeenCalled();
		} finally {
			globalThis.PerformanceObserver=original;
		}
	});
	it("does not subscribe when observe is false", () => {
		let observeCalls=0;
		class FakeObserver {
			observe() { observeCalls+=1; }
			disconnect() {}
		}
		let original=globalThis.PerformanceObserver;
		globalThis.PerformanceObserver=FakeObserver as unknown as typeof PerformanceObserver;
		try {
			render(makeRoot([], [{category: "script", limitBytes: 1000}], false));
			expect(observeCalls).toBe(0);
		} finally {
			globalThis.PerformanceObserver=original;
		}
	});
});
