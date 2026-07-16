import {describe, it, expect, vi, afterEach} from "vitest";
import {DailyGoals} from "../gamification/DailyGoals";
import type {DailyGoalSnapshot, DailyGoalDefinition} from "../gamification/DailyGoals";
function snap(overrides: Partial<DailyGoalSnapshot> = {}): DailyGoalSnapshot {
	return {questionsAnswered: 0, correctAnswers: 0, topicsPracticed: 0, sessionMinutes: 0, ...overrides};
}
describe("DailyGoals catalog", () => {
	it("exposes a non-empty default goal set", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		expect(g.total()).toBeGreaterThan(0);
	});
	it("default goals have unique ids", () => {
		const ids = DailyGoals.defaultGoals().map(x => x.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
describe("DailyGoals.record", () => {
	it("updates progress for the current day", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		g.record(snap({questionsAnswered: 10}), "2026-01-01");
		expect(g.progressFor("answer_20")?.current).toBe(10);
		expect(g.isComplete("answer_20")).toBe(false);
	});
	it("returns only goals that became complete with this update", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		const first = g.record(snap({questionsAnswered: 20}), "2026-01-01");
		expect(first.map(x => x.id)).toContain("answer_20");
		const second = g.record(snap({questionsAnswered: 25}), "2026-01-01");
		expect(second.map(x => x.id)).not.toContain("answer_20");
	});
	it("replaces the snapshot rather than accumulating", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		g.record(snap({questionsAnswered: 20}), "2026-01-01");
		g.record(snap({questionsAnswered: 5}), "2026-01-01");
		expect(g.progressFor("answer_20")?.current).toBe(5);
		expect(g.isComplete("answer_20")).toBe(false);
	});
});
describe("DailyGoals accuracy metric", () => {
	it("computes accuracy from the snapshot", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		g.record(snap({questionsAnswered: 10, correctAnswers: 8}), "2026-01-01");
		expect(g.progressFor("accuracy_80")?.current).toBeCloseTo(0.8);
		expect(g.isComplete("accuracy_80")).toBe(true);
	});
	it("treats zero questions as 0 accuracy", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		expect(g.progressFor("accuracy_80")?.current).toBe(0);
	});
});
describe("DailyGoals.allComplete / completedIds", () => {
	it("allComplete is true only when every goal is satisfied", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		g.record(snap({questionsAnswered: 20, correctAnswers: 16, topicsPracticed: 3, sessionMinutes: 15}), "2026-01-01");
		expect(g.completedCount()).toBe(g.total());
		expect(g.allComplete()).toBe(true);
	});
	it("completedIds returns definition order", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		g.record(snap({questionsAnswered: 20, correctAnswers: 15}), "2026-01-01");
		const ids = g.completedIds();
		expect(ids).toEqual(["answer_20", "correct_15"]);
	});
});
describe("DailyGoals day rollover + streak", () => {
	it("increments the streak when the previous day was fully complete", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		g.record(snap({questionsAnswered: 20, correctAnswers: 16, topicsPracticed: 3, sessionMinutes: 15}), "2026-01-01");
		expect(g.currentStreak()).toBe(0);
		g.record(snap({questionsAnswered: 1}), "2026-01-02");
		expect(g.currentStreak()).toBe(1);
		expect(g.bestStreak()).toBe(1);
	});
	it("resets the streak when the previous day was not complete", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		g.record(snap({questionsAnswered: 20, correctAnswers: 16, topicsPracticed: 3, sessionMinutes: 15}), "2026-01-01");
		g.record(snap({questionsAnswered: 1}), "2026-01-02");
		expect(g.currentStreak()).toBe(1);
		g.record(snap({questionsAnswered: 1}), "2026-01-03");
		expect(g.currentStreak()).toBe(0);
	});
	it("clears progress for the new day after rollover", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		g.record(snap({questionsAnswered: 20}), "2026-01-01");
		g.record(snap({questionsAnswered: 5}), "2026-01-02");
		expect(g.currentDay()).toBe("2026-01-02");
		expect(g.progressFor("answer_20")?.current).toBe(5);
	});
	it("accumulates the streak across multiple complete days", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		const full = snap({questionsAnswered: 20, correctAnswers: 16, topicsPracticed: 3, sessionMinutes: 15});
		g.record(full, "2026-01-01");
		g.record(full, "2026-01-02");
		expect(g.currentStreak()).toBe(1);
		g.record(full, "2026-01-03");
		expect(g.currentStreak()).toBe(2);
		expect(g.bestStreak()).toBe(2);
	});
});
describe("DailyGoals.reset", () => {
	it("clears progress and streak state", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		g.record(snap({questionsAnswered: 20}), "2026-01-01");
		g.record(snap({questionsAnswered: 1}), "2026-01-02");
		g.reset();
		expect(g.currentStreak()).toBe(0);
		expect(g.bestStreak()).toBe(0);
		expect(g.completedCount()).toBe(0);
	});
});
describe("DailyGoals custom + helpers", () => {
	it("accepts a custom goal set", () => {
		const custom: DailyGoalDefinition[] = [{id: "one", description: "x", metric: "questionsAnswered", target: 1}];
		const g = new DailyGoals(custom, "2026-01-01");
		expect(g.total()).toBe(1);
		g.record(snap({questionsAnswered: 1}), "2026-01-01");
		expect(g.allComplete()).toBe(true);
	});
	it("progressFor returns undefined for an unknown id", () => {
		const g = new DailyGoals(undefined, "2026-01-01");
		expect(g.progressFor("nope")).toBeUndefined();
	});
	it("utcDay formats an epoch as YYYY-MM-DD", () => {
		const key = DailyGoals.utcDay(Date.UTC(2026, 0, 5, 12, 0, 0));
		expect(key).toBe("2026-01-05");
	});
});
describe("DailyGoals localDay + timezone defaults (task 5.70)", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});
	it("localDay formats an epoch as a local YYYY-MM-DD string", () => {
		const epoch = Date.UTC(2026, 0, 5, 12, 0, 0);
		const result = DailyGoals.localDay(epoch);
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		const local = new Date(epoch);
		const expected = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
		expect(result).toBe(expected);
	});
	it("localDay uses local date components, not UTC", () => {
		const epoch = Date.UTC(2026, 0, 5, 23, 0, 0);
		const local = DailyGoals.localDay(epoch);
		const utc = DailyGoals.utcDay(epoch);
		const localDate = new Date(epoch);
		const expected = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
		expect(local).toBe(expected);
		expect(utc).toBe("2026-01-05");
		if (utc !== local) {
			expect(local).toBe("2026-01-06");
		}
	});
	it("constructor defaults to localDay(Date.now()) not utcDay", () => {
		const fixedEpoch = Date.UTC(2026, 0, 5, 23, 0, 0);
		const spy = vi.spyOn(Date, "now").mockReturnValue(fixedEpoch);
		const g = new DailyGoals();
		const localExpected = DailyGoals.localDay(fixedEpoch);
		const utcExpected = DailyGoals.utcDay(fixedEpoch);
		expect(g.currentDay()).toBe(localExpected);
		if (utcExpected !== localExpected) {
			expect(g.currentDay()).not.toBe(utcExpected);
		}
		spy.mockRestore();
	});
	it("record defaults to localDay(Date.now()) not utcDay", () => {
		const fixedEpoch = Date.UTC(2026, 0, 5, 23, 0, 0);
		const spy = vi.spyOn(Date, "now").mockReturnValue(fixedEpoch);
		const g = new DailyGoals(undefined, "2025-12-31");
		g.record(snap({questionsAnswered: 1}));
		const localExpected = DailyGoals.localDay(fixedEpoch);
		const utcExpected = DailyGoals.utcDay(fixedEpoch);
		expect(g.currentDay()).toBe(localExpected);
		if (utcExpected !== localExpected) {
			expect(g.currentDay()).not.toBe(utcExpected);
		}
		spy.mockRestore();
	});
	it("goals roll over at local midnight, not UTC midnight", () => {
		const g = new DailyGoals(undefined, "2026-01-05");
		g.record(snap({questionsAnswered: 20}), "2026-01-05");
		const spy = vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 0, 6, 0, 30, 0));
		g.record(snap({questionsAnswered: 1}));
		const localAtEpoch = DailyGoals.localDay(Date.UTC(2026, 0, 6, 0, 30, 0));
		const utcAtEpoch = DailyGoals.utcDay(Date.UTC(2026, 0, 6, 0, 30, 0));
		expect(g.currentDay()).toBe(localAtEpoch);
		if (localAtEpoch !== utcAtEpoch) {
			expect(g.currentDay()).not.toBe(utcAtEpoch);
		}
		spy.mockRestore();
	});
});
