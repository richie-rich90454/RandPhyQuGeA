import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import type {JSX} from "solid-js";
import {createAchievements} from "../createAchievements";
import type {AchievementsState} from "../createAchievements";
import type {AchievementStats, AchievementDefinition} from "../../../lib/physics/gamification/Achievements";
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
let state: AchievementsState | null = null;
function makeRoot(options?: Parameters<typeof createAchievements>[0]): () => JSX.Element {
	return () => {
		state = createAchievements(options);
		return <div>achievements</div>;
	};
}
beforeEach(() => {
	state = null;
});
describe("createAchievements default state", () => {
	it("starts with no unlocks and the default catalog total", () => {
		render(makeRoot());
		expect(state!.unlockedIds()).toEqual([]);
		expect(state!.count()).toBe(0);
		expect(state!.total()).toBeGreaterThan(10);
	});
	it("isUnlocked returns false for any id before any check", () => {
		render(makeRoot());
		expect(state!.isUnlocked("first_steps")).toBe(false);
	});
});
describe("createAchievements check + onUnlock (task 5.69)", () => {
	it("unlocks achievements and returns newly-unlocked definitions", () => {
		render(makeRoot());
		let newly = state!.check(baseline({questionsAnswered: 1}));
		expect(newly.map(d => d.id)).toContain("first_steps");
		expect(state!.isUnlocked("first_steps")).toBe(true);
		expect(state!.count()).toBe(1);
	});
	it("fires onUnlock callback with newly-unlocked definitions", () => {
		let onUnlock = vi.fn<(newly: AchievementDefinition[]) => void>();
		render(makeRoot({onUnlock}));
		state!.check(baseline({questionsAnswered: 1}));
		expect(onUnlock).toHaveBeenCalledTimes(1);
		expect(onUnlock).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({id: "first_steps"})]));
	});
	it("does not fire onUnlock when no new achievements are unlocked", () => {
		let onUnlock = vi.fn<(newly: AchievementDefinition[]) => void>();
		render(makeRoot({onUnlock}));
		state!.check(baseline({questionsAnswered: 0}));
		expect(onUnlock).not.toHaveBeenCalled();
	});
	it("is idempotent: re-checking with the same stats returns empty and does not re-fire onUnlock", () => {
		let onUnlock = vi.fn<(newly: AchievementDefinition[]) => void>();
		render(makeRoot({onUnlock}));
		state!.check(baseline({questionsAnswered: 1}));
		let second = state!.check(baseline({questionsAnswered: 1}));
		expect(second).toEqual([]);
		expect(onUnlock).toHaveBeenCalledTimes(1);
	});
	it("unlocks multiple achievements at once in catalog order", () => {
		render(makeRoot());
		let newly = state!.check(baseline({questionsAnswered: 100, bestStreak: 10, topicsPracticed: 5}));
		let ids = newly.map(d => d.id);
		expect(ids).toContain("century");
		expect(ids).toContain("streak_10");
		expect(ids).toContain("polymath");
		let catalogOrder = state!
			.inner()
			.all()
			.map(d => d.id)
			.filter(id => ids.includes(id));
		expect(ids).toEqual(catalogOrder);
	});
});
describe("createAchievements reactivity (task 5.69)", () => {
	it("unlockedIds accessor updates after check", () => {
		render(makeRoot());
		expect(state!.unlockedIds()).toEqual([]);
		state!.check(baseline({questionsAnswered: 1}));
		expect(state!.unlockedIds()).toContain("first_steps");
	});
	it("unlockedIds accessor updates after markUnlocked", () => {
		render(makeRoot());
		expect(state!.unlockedIds()).toEqual([]);
		state!.markUnlocked("century");
		expect(state!.unlockedIds()).toContain("century");
	});
	it("count accessor reflects unlocks", () => {
		render(makeRoot());
		expect(state!.count()).toBe(0);
		state!.check(baseline({questionsAnswered: 10}));
		expect(state!.count()).toBeGreaterThan(0);
	});
	it("unlockedIds accessor is empty after reset", () => {
		render(makeRoot());
		state!.check(baseline({questionsAnswered: 1}));
		expect(state!.unlockedIds().length).toBeGreaterThan(0);
		state!.reset();
		expect(state!.unlockedIds()).toEqual([]);
		expect(state!.count()).toBe(0);
	});
});
describe("createAchievements pre-seeding (task 5.69)", () => {
	it("pre-seeds unlocked ids from options", () => {
		render(makeRoot({unlockedIds: ["first_steps", "century"]}));
		expect(state!.unlockedIds()).toEqual(["first_steps", "century"]);
		expect(state!.count()).toBe(2);
		expect(state!.isUnlocked("first_steps")).toBe(true);
	});
	it("does not re-return pre-seeded unlocks on check", () => {
		render(makeRoot({unlockedIds: ["first_steps"]}));
		let newly = state!.check(baseline({questionsAnswered: 1}));
		expect(newly.map(d => d.id)).not.toContain("first_steps");
	});
	it("ignores unknown ids in pre-seed", () => {
		render(makeRoot({unlockedIds: ["unknown_id"]}));
		expect(state!.count()).toBe(0);
		expect(state!.unlockedIds()).toEqual([]);
	});
});
describe("createAchievements custom definitions (task 5.69)", () => {
	it("uses a custom catalog exclusively", () => {
		let custom: AchievementDefinition[] = [{id: "custom_1", name: "Custom", description: "x", category: "x", check: s => s.questionsAnswered >= 5}];
		render(makeRoot({definitions: custom}));
		expect(state!.total()).toBe(1);
		let newly = state!.check(baseline({questionsAnswered: 5}));
		expect(newly.map(d => d.id)).toEqual(["custom_1"]);
		expect(state!.count()).toBe(1);
	});
	it("fires onUnlock for custom catalog unlocks", () => {
		let onUnlock = vi.fn<(newly: AchievementDefinition[]) => void>();
		let custom: AchievementDefinition[] = [{id: "custom_1", name: "Custom", description: "x", category: "x", check: s => s.questionsAnswered >= 5}];
		render(makeRoot({definitions: custom, onUnlock}));
		state!.check(baseline({questionsAnswered: 5}));
		expect(onUnlock).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({id: "custom_1"})]));
	});
});
describe("createAchievements markUnlocked (task 5.69)", () => {
	it("returns true for a known id and updates reactive state", () => {
		render(makeRoot());
		expect(state!.markUnlocked("century")).toBe(true);
		expect(state!.isUnlocked("century")).toBe(true);
		expect(state!.unlockedIds()).toContain("century");
		expect(state!.count()).toBe(1);
	});
	it("returns false for an unknown id and does not update state", () => {
		render(makeRoot());
		expect(state!.markUnlocked("nope")).toBe(false);
		expect(state!.count()).toBe(0);
		expect(state!.unlockedIds()).toEqual([]);
	});
	it("does not duplicate state when markUnlocked is called twice for the same id", () => {
		render(makeRoot());
		state!.markUnlocked("century");
		state!.markUnlocked("century");
		expect(state!.count()).toBe(1);
	});
});
describe("createAchievements inner (task 5.69)", () => {
	it("exposes the underlying Achievements instance", () => {
		render(makeRoot());
		let inner = state!.inner();
		expect(inner.total()).toBe(state!.total());
		expect(inner.count()).toBe(state!.count());
	});
});
describe("createAchievements cleanup (task 5.69)", () => {
	it("resets the underlying instance on disposal", () => {
		let rendered = render(makeRoot());
		state!.check(baseline({questionsAnswered: 1}));
		expect(state!.inner().count()).toBeGreaterThan(0);
		rendered.unmount();
		expect(state!.inner().count()).toBe(0);
	});
});
