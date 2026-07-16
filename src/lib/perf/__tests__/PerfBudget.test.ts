import {describe, it, expect} from "vitest";
import {PerfBudget} from "../PerfBudget";
import type {BudgetEntry, ResourceMeasurement} from "../PerfBudget";
describe("PerfBudget.constructor", () => {
	it("stores a defensive copy of the entries", () => {
		let input: BudgetEntry[] = [{category: "script", limitBytes: 100}];
		let budget = new PerfBudget(input);
		input[0]!.limitBytes = 999;
		expect(budget.getLimit("script")).toBe(100);
	});
});
describe("PerfBudget.getEntries", () => {
	it("returns a defensive copy", () => {
		let budget = new PerfBudget([{category: "script", limitBytes: 100}]);
		let entries = budget.getEntries();
		entries[0]!.limitBytes = 999;
		expect(budget.getLimit("script")).toBe(100);
	});
});
describe("PerfBudget.getLimit", () => {
	it("returns the configured limit for a category", () => {
		let budget = new PerfBudget([{category: "style", limitBytes: 2048}]);
		expect(budget.getLimit("style")).toBe(2048);
	});
	it("returns 0 for a category not in the budget", () => {
		let budget = new PerfBudget([{category: "script", limitBytes: 100}]);
		expect(budget.getLimit("font")).toBe(0);
	});
});
describe("PerfBudget.check", () => {
	it("returns one result per budget entry sorted by category", () => {
		let budget = new PerfBudget([
			{category: "script", limitBytes: 1000},
			{category: "style", limitBytes: 500},
		]);
		let results = budget.check([]);
		expect(results).toHaveLength(2);
		expect(results[0]!.category).toBe("script");
		expect(results[1]!.category).toBe("style");
	});
	it("sums measurements per category", () => {
		let budget = new PerfBudget([{category: "script", limitBytes: 1000}]);
		let measurements: ResourceMeasurement[] = [
			{category: "script", bytes: 300},
			{category: "script", bytes: 400, label: "chunk-a"},
			{category: "style", bytes: 100},
		];
		let results = budget.check(measurements);
		expect(results).toHaveLength(1);
		expect(results[0]!.actualBytes).toBe(700);
		expect(results[0]!.count).toBe(2);
	});
	it("marks a category passed when actualBytes is within limit", () => {
		let budget = new PerfBudget([{category: "script", limitBytes: 1000}]);
		let results = budget.check([{category: "script", bytes: 999}]);
		expect(results[0]!.passed).toBe(true);
	});
	it("marks a category failed when actualBytes exceeds limit", () => {
		let budget = new PerfBudget([{category: "script", limitBytes: 1000}]);
		let results = budget.check([{category: "script", bytes: 1001}]);
		expect(results[0]!.passed).toBe(false);
	});
	it("marks a category passed at the exact limit boundary", () => {
		let budget = new PerfBudget([{category: "script", limitBytes: 1000}]);
		let results = budget.check([{category: "script", bytes: 1000}]);
		expect(results[0]!.passed).toBe(true);
	});
	it("computes percent as actual/limit*100", () => {
		let budget = new PerfBudget([{category: "script", limitBytes: 500}]);
		let results = budget.check([{category: "script", bytes: 250}]);
		expect(results[0]!.percent).toBe(50);
	});
	it("returns percent 0 when limit is 0", () => {
		let budget = new PerfBudget([{category: "other", limitBytes: 0}]);
		let results = budget.check([{category: "other", bytes: 100}]);
		expect(results[0]!.percent).toBe(0);
		expect(results[0]!.passed).toBe(false);
	});
	it("ignores measurements for categories not in the budget", () => {
		let budget = new PerfBudget([{category: "script", limitBytes: 1000}]);
		let results = budget.check([{category: "image", bytes: 99999}]);
		expect(results).toHaveLength(1);
		expect(results[0]!.category).toBe("script");
		expect(results[0]!.actualBytes).toBe(0);
	});
	it("returns zero actualBytes and count for an empty category", () => {
		let budget = new PerfBudget([{category: "font", limitBytes: 100}]);
		let results = budget.check([]);
		expect(results[0]!.actualBytes).toBe(0);
		expect(results[0]!.count).toBe(0);
		expect(results[0]!.passed).toBe(true);
	});
});
describe("PerfBudget.allPassed", () => {
	it("returns true when every category is within budget", () => {
		let budget = new PerfBudget([
			{category: "script", limitBytes: 1000},
			{category: "style", limitBytes: 500},
		]);
		let ok = budget.allPassed([
			{category: "script", bytes: 800},
			{category: "style", bytes: 400},
		]);
		expect(ok).toBe(true);
	});
	it("returns false when any category exceeds its budget", () => {
		let budget = new PerfBudget([
			{category: "script", limitBytes: 1000},
			{category: "style", limitBytes: 500},
		]);
		let ok = budget.allPassed([
			{category: "script", bytes: 800},
			{category: "style", bytes: 600},
		]);
		expect(ok).toBe(false);
	});
});
describe("PerfBudget.formatBytes", () => {
	it("formats bytes below 1 KB as B", () => {
		expect(PerfBudget.formatBytes(512)).toBe("512 B");
	});
	it("formats bytes between 1 KB and 1 MB as KB", () => {
		expect(PerfBudget.formatBytes(2048)).toBe("2.0 KB");
	});
	it("formats bytes at 1 MB or above as MB", () => {
		expect(PerfBudget.formatBytes(1024 * 1024)).toBe("1.00 MB");
	});
	it("formats 0 bytes as B", () => {
		expect(PerfBudget.formatBytes(0)).toBe("0 B");
	});
});
describe("PerfBudget.defaultBudget", () => {
	it("returns entries for all five categories", () => {
		let budget = PerfBudget.defaultBudget();
		expect(budget).toHaveLength(5);
		let categories = budget.map(b => b.category).sort();
		expect(categories).toEqual(["font", "image", "other", "script", "style"]);
	});
	it("returns positive limits for every category", () => {
		let budget = PerfBudget.defaultBudget();
		for (let entry of budget) {
			expect(entry.limitBytes).toBeGreaterThan(0);
		}
	});
});
describe("PerfBudget.classifyUrl", () => {
	it("classifies .js as script", () => {
		expect(PerfBudget.classifyUrl("app.js")).toBe("script");
	});
	it("classifies .mjs as script", () => {
		expect(PerfBudget.classifyUrl("chunk.mjs")).toBe("script");
	});
	it("classifies .css as style", () => {
		expect(PerfBudget.classifyUrl("styles.css")).toBe("style");
	});
	it("classifies .woff2 as font", () => {
		expect(PerfBudget.classifyUrl("inter.woff2")).toBe("font");
	});
	it("classifies .ttf as font", () => {
		expect(PerfBudget.classifyUrl("mono.ttf")).toBe("font");
	});
	it("classifies .png as image", () => {
		expect(PerfBudget.classifyUrl("logo.png")).toBe("image");
	});
	it("classifies .svg as image", () => {
		expect(PerfBudget.classifyUrl("icon.svg")).toBe("image");
	});
	it("classifies unknown extensions as other", () => {
		expect(PerfBudget.classifyUrl("data.json")).toBe("other");
	});
	it("strips query strings before classifying", () => {
		expect(PerfBudget.classifyUrl("app.js?v=123")).toBe("script");
	});
	it("is case-insensitive", () => {
		expect(PerfBudget.classifyUrl("APP.JS")).toBe("script");
	});
});
