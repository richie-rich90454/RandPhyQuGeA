import {describe, it, expect} from "vitest";
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
		const custom: DailyGoalDefinition[] = [
			{id: "one", description: "x", metric: "questionsAnswered", target: 1},
		];
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
