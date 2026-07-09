import {describe, it, expect} from "vitest";
import {Achievements} from "../gamification/Achievements";
import type {AchievementStats, AchievementDefinition} from "../gamification/Achievements";
function baseline(overrides: Partial<AchievementStats> = {}): AchievementStats {
	return {
		questionsAnswered: 0,
		correctAnswers: 0,
		currentStreak: 0,
		bestStreak: 0,
		sessionDurationMs: 0,
		topicsPracticed: 0,
		unitsPracticed: 0,
		totalSessions: 0,
		perfectSessions: 0,
		bookmarksCreated: 0,
		dailyStreak: 0,
		avgTimePerQuestionMs: 0,
		...overrides,
	};
}
describe("Achievements catalog", () => {
	it("exposes a non-empty default catalog", () => {
		const a = new Achievements();
		expect(a.total()).toBeGreaterThan(10);
		expect(a.all().length).toBe(a.total());
	});
	it("definitions have unique ids", () => {
		const ids = Achievements.defaultDefinitions().map(d => d.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
	it("get returns a definition by id and undefined for unknown", () => {
		const a = new Achievements();
		expect(a.get("century")?.name).toBe("Century");
		expect(a.get("nope")).toBeUndefined();
	});
});
describe("Achievements.check", () => {
	it("unlocks first_steps on a single answered question", () => {
		const a = new Achievements();
		const newly = a.check(baseline({questionsAnswered: 1}));
		expect(newly.map(d => d.id)).toContain("first_steps");
		expect(a.isUnlocked("first_steps")).toBe(true);
	});
	it("returns only newly-unlocked definitions (idempotent on re-check)", () => {
		const a = new Achievements();
		const first = a.check(baseline({questionsAnswered: 1}));
		const second = a.check(baseline({questionsAnswered: 1}));
		expect(first.length).toBeGreaterThan(0);
		expect(second.length).toBe(0);
	});
	it("unlocks multiple achievements at once in catalog order", () => {
		const a = new Achievements();
		const newly = a.check(baseline({questionsAnswered: 100, bestStreak: 10, topicsPracticed: 5}));
		const ids = newly.map(d => d.id);
		expect(ids).toContain("century");
		expect(ids).toContain("streak_10");
		expect(ids).toContain("polymath");
		const order = newly.map(d => d.id);
		const catalogOrder = a.all().map(d => d.id).filter(id => order.includes(id));
		expect(order).toEqual(catalogOrder);
	});
	it("does not unlock streak achievements from currentStreak alone", () => {
		const a = new Achievements();
		a.check(baseline({currentStreak: 25, bestStreak: 0}));
		expect(a.isUnlocked("streak_25")).toBe(false);
	});
});
describe("Achievements accuracy-based unlocks", () => {
	it("unlocks sharpshooter at 90% over 20 questions", () => {
		const a = new Achievements();
		a.check(baseline({questionsAnswered: 20, correctAnswers: 18}));
		expect(a.isUnlocked("sharpshooter")).toBe(true);
	});
	it("does not unlock sharpshooter below 20 questions even at 100%", () => {
		const a = new Achievements();
		a.check(baseline({questionsAnswered: 19, correctAnswers: 19}));
		expect(a.isUnlocked("sharpshooter")).toBe(false);
	});
	it("unlocks accuracy_master at 95% over 50 questions", () => {
		const a = new Achievements();
		a.check(baseline({questionsAnswered: 50, correctAnswers: 48}));
		expect(a.isUnlocked("accuracy_master")).toBe(true);
	});
	it("accuracy helper returns 0 with no questions", () => {
		expect(Achievements.accuracy(baseline())).toBe(0);
		expect(Achievements.accuracy(baseline({questionsAnswered: 4, correctAnswers: 3}))).toBeCloseTo(0.75);
	});
});
describe("Achievements query helpers", () => {
	it("unlockedIds and lockedIds partition the catalog", () => {
		const a = new Achievements();
		a.check(baseline({questionsAnswered: 10}));
		const unlocked = a.unlockedIds();
		const locked = a.lockedIds();
		expect(unlocked.length + locked.length).toBe(a.total());
		expect(unlocked).toContain("getting_warm");
		expect(locked).toContain("century");
	});
	it("count reflects unlocked total", () => {
		const a = new Achievements();
		expect(a.count()).toBe(0);
		a.check(baseline({questionsAnswered: 1}));
		expect(a.count()).toBe(1);
	});
});
describe("Achievements.markUnlocked", () => {
	it("manually unlocks a known id", () => {
		const a = new Achievements();
		expect(a.markUnlocked("century")).toBe(true);
		expect(a.isUnlocked("century")).toBe(true);
	});
	it("returns false for an unknown id", () => {
		const a = new Achievements();
		expect(a.markUnlocked("unknown")).toBe(false);
	});
	it("check does not re-return manually-unlocked achievements", () => {
		const a = new Achievements();
		a.markUnlocked("first_steps");
		const newly = a.check(baseline({questionsAnswered: 1}));
		expect(newly.map(d => d.id)).not.toContain("first_steps");
	});
});
describe("Achievements.reset", () => {
	it("clears all unlocked state", () => {
		const a = new Achievements();
		a.check(baseline({questionsAnswered: 100, bestStreak: 10}));
		expect(a.count()).toBeGreaterThan(0);
		a.reset();
		expect(a.count()).toBe(0);
		expect(a.unlockedIds()).toEqual([]);
	});
});
describe("Achievements custom definitions", () => {
	it("accepts a custom catalog and uses it exclusively", () => {
		const custom: AchievementDefinition[] = [
			{id: "custom_1", name: "Custom", description: "x", category: "x", check: s => s.questionsAnswered >= 5},
		];
		const a = new Achievements(custom);
		expect(a.total()).toBe(1);
		expect(a.check(baseline({questionsAnswered: 5})).map(d => d.id)).toEqual(["custom_1"]);
	});
});
