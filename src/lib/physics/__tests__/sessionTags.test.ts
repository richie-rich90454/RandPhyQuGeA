import {describe, it, expect} from "vitest";
import {SessionTags} from "../session/SessionTags";
describe("SessionTags.tagSession", () => {
	it("attaches tags to a session and returns the full set", () => {
		const s = new SessionTags();
		expect(s.tagSession("S1", ["warmup", "mechanics"])).toEqual(["mechanics", "warmup"]);
	});
	it("creates the session record when first tagged", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["x"]);
		expect(s.hasSession("S1")).toBe(true);
		expect(s.sessionCount()).toBe(1);
	});
	it("ignores empty tag strings", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["", "real"]);
		expect(s.tagsForSession("S1")).toEqual(["real"]);
		expect(s.allTags()).toEqual(["real"]);
	});
	it("does not duplicate tags on re-tag", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["a"]);
		s.tagSession("S1", ["a", "b"]);
		expect(s.tagsForSession("S1")).toEqual(["a", "b"]);
	});
});
describe("SessionTags.untagSession", () => {
	it("removes a tag and cleans the index when empty", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["a", "b"]);
		expect(s.untagSession("S1", "a")).toBe(true);
		expect(s.tagsForSession("S1")).toEqual(["b"]);
		expect(s.allTags()).toEqual(["b"]);
	});
	it("returns false when the tag was not present", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["a"]);
		expect(s.untagSession("S1", "nope")).toBe(false);
		expect(s.untagSession("unknown", "a")).toBe(false);
	});
});
describe("SessionTags.sessionsForTag", () => {
	it("returns session ids carrying the tag", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["mechanics"]);
		s.tagSession("S2", ["optics"]);
		s.tagSession("S3", ["mechanics"]);
		expect(s.sessionsForTag("mechanics")).toEqual(["S1", "S3"]);
		expect(s.sessionsForTag("optics")).toEqual(["S2"]);
		expect(s.sessionsForTag("none")).toEqual([]);
	});
});
describe("SessionTags.recordResult and statsFor", () => {
	it("accumulates stats per session", () => {
		const s = new SessionTags();
		s.recordResult("S1", true, 5000);
		s.recordResult("S1", false, 3000);
		const stats = s.statsFor("S1");
		expect(stats).toEqual({questionsAnswered: 2, correctAnswers: 1, totalTimeMs: 8000});
	});
	it("creates the session on first record", () => {
		const s = new SessionTags();
		s.recordResult("S1", true, 100);
		expect(s.hasSession("S1")).toBe(true);
	});
	it("setStats replaces the stats outright", () => {
		const s = new SessionTags();
		s.recordResult("S1", true, 100);
		s.setStats("S1", {questionsAnswered: 10, correctAnswers: 9, totalTimeMs: 1000});
		expect(s.statsFor("S1")).toEqual({questionsAnswered: 10, correctAnswers: 9, totalTimeMs: 1000});
	});
	it("statsFor returns undefined for an unknown session", () => {
		const s = new SessionTags();
		expect(s.statsFor("nope")).toBeUndefined();
	});
});
describe("SessionTags.aggregateByTag", () => {
	it("aggregates stats across sessions sharing a tag", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["mechanics"]);
		s.tagSession("S2", ["mechanics"]);
		s.tagSession("S3", ["optics"]);
		s.setStats("S1", {questionsAnswered: 10, correctAnswers: 8, totalTimeMs: 1000});
		s.setStats("S2", {questionsAnswered: 10, correctAnswers: 6, totalTimeMs: 2000});
		s.setStats("S3", {questionsAnswered: 5, correctAnswers: 5, totalTimeMs: 500});
		const agg = s.aggregateByTag("mechanics");
		expect(agg.sessionCount).toBe(2);
		expect(agg.questionsAnswered).toBe(20);
		expect(agg.correctAnswers).toBe(14);
		expect(agg.accuracy).toBeCloseTo(0.7);
		expect(agg.totalTimeMs).toBe(3000);
	});
	it("returns zeroed aggregate for an unknown tag", () => {
		const s = new SessionTags();
		const agg = s.aggregateByTag("none");
		expect(agg.sessionCount).toBe(0);
		expect(agg.accuracy).toBe(0);
	});
});
describe("SessionTags.allTags", () => {
	it("returns every tag in use, sorted", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["zebra", "alpha"]);
		s.tagSession("S2", ["mike"]);
		expect(s.allTags()).toEqual(["alpha", "mike", "zebra"]);
	});
});
describe("SessionTags.removeSession", () => {
	it("removes the session and cleans up tag indexes", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["a", "b"]);
		s.tagSession("S2", ["a"]);
		expect(s.removeSession("S1")).toBe(true);
		expect(s.hasSession("S1")).toBe(false);
		expect(s.sessionsForTag("a")).toEqual(["S2"]);
		expect(s.sessionsForTag("b")).toEqual([]);
		expect(s.allTags()).toEqual(["a"]);
	});
	it("returns false for an unknown session", () => {
		const s = new SessionTags();
		expect(s.removeSession("nope")).toBe(false);
	});
});
describe("SessionTags.clear", () => {
	it("removes all sessions, tags, and stats", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["a"]);
		s.recordResult("S1", true, 10);
		s.clear();
		expect(s.sessionCount()).toBe(0);
		expect(s.allTags()).toEqual([]);
		expect(s.statsFor("S1")).toBeUndefined();
	});
});
describe("SessionTags.tagsForSession unknown session", () => {
	it("returns an empty array for an unknown session", () => {
		const s = new SessionTags();
		expect(s.tagsForSession("unknown")).toEqual([]);
	});
});
describe("SessionTags.setStats new session", () => {
	it("creates the session record when setStats is called on an unknown session", () => {
		const s = new SessionTags();
		s.setStats("newSession", {questionsAnswered: 5, correctAnswers: 3, totalTimeMs: 1000});
		expect(s.hasSession("newSession")).toBe(true);
		expect(s.statsFor("newSession")).toEqual({questionsAnswered: 5, correctAnswers: 3, totalTimeMs: 1000});
	});
});
describe("SessionTags.untagSession shared tag", () => {
	it("does not remove the tag index when other sessions still carry the tag", () => {
		const s = new SessionTags();
		s.tagSession("S1", ["shared"]);
		s.tagSession("S2", ["shared"]);
		expect(s.untagSession("S1", "shared")).toBe(true);
		expect(s.sessionsForTag("shared")).toEqual(["S2"]);
		expect(s.allTags()).toEqual(["shared"]);
	});
});
describe("SessionTags.tagSession empty tags", () => {
	it("creates a session with no tags when given an empty tags array", () => {
		const s = new SessionTags();
		expect(s.tagSession("S1", [])).toEqual([]);
		expect(s.hasSession("S1")).toBe(true);
		expect(s.allTags()).toEqual([]);
	});
});
describe("SessionTags.removeSession no tags", () => {
	it("removes a session that has no tags without errors", () => {
		const s = new SessionTags();
		s.recordResult("S1", true, 100);
		expect(s.removeSession("S1")).toBe(true);
		expect(s.hasSession("S1")).toBe(false);
	});
});
