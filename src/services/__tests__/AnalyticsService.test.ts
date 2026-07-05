import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {AnalyticsService} from "../AnalyticsService";
import type {PracticeResult, Specification} from "../../types/models";
function makeResult(overrides: Partial<PracticeResult> = {}): PracticeResult {
	return {
		id: "r1",
		question_id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		is_correct: true,
		time_taken_ms: 1000,
		user_answer: "answer",
		timestamp: new Date().toISOString(),
		mode: "Single",
		difficulty: 1,
		...overrides,
	};
}
function makeSpec(): Specification {
	return {
		units: [{id: "u1", name: "Unit 1", description: ""}],
		topics: [
			{id: "t1", name: "Topic One", unit_id: "u1", description: ""},
			{id: "t2", name: "Topic Two", unit_id: "u1", description: ""},
		],
		skills: [],
		templates: [],
	};
}
describe("AnalyticsService", () => {
	describe("getStreak", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2024-01-10T12:00:00.000Z"));
		});
		afterEach(() => {
			vi.useRealTimers();
		});
		it("returns zero streaks for empty history", () => {
			let service = new AnalyticsService();
			expect(service.getStreak([])).toEqual({currentStreak: 0, bestStreak: 0, totalActiveDays: 0});
		});
		it("counts a single active day as streak 1", () => {
			let service = new AnalyticsService();
			let results = [makeResult({timestamp: "2024-01-10T10:00:00.000Z"})];
			expect(service.getStreak(results)).toEqual({currentStreak: 1, bestStreak: 1, totalActiveDays: 1});
		});
		it("tracks a multi-day current streak", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({timestamp: "2024-01-10T10:00:00.000Z"}),
				makeResult({timestamp: "2024-01-09T10:00:00.000Z"}),
				makeResult({timestamp: "2024-01-08T10:00:00.000Z"}),
			];
			expect(service.getStreak(results)).toEqual({currentStreak: 3, bestStreak: 3, totalActiveDays: 3});
		});
		it("continues a streak from yesterday", () => {
			let service = new AnalyticsService();
			let results = [makeResult({timestamp: "2024-01-09T10:00:00.000Z"})];
			expect(service.getStreak(results)).toEqual({currentStreak: 1, bestStreak: 1, totalActiveDays: 1});
		});
		it("breaks a streak when a day is skipped", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({timestamp: "2024-01-10T10:00:00.000Z"}),
				makeResult({timestamp: "2024-01-08T10:00:00.000Z"}),
			];
			expect(service.getStreak(results)).toEqual({currentStreak: 1, bestStreak: 1, totalActiveDays: 2});
		});
		it("records the best streak separately from current streak", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({timestamp: "2024-01-10T10:00:00.000Z"}),
				makeResult({timestamp: "2024-01-06T10:00:00.000Z"}),
				makeResult({timestamp: "2024-01-05T10:00:00.000Z"}),
				makeResult({timestamp: "2024-01-04T10:00:00.000Z"}),
			];
			expect(service.getStreak(results)).toEqual({currentStreak: 1, bestStreak: 3, totalActiveDays: 4});
		});
	});
	describe("getWeakTopics", () => {
		it("returns empty array when there are no results", () => {
			let service = new AnalyticsService();
			expect(service.getWeakTopics([], makeSpec())).toEqual([]);
		});
		it("returns topics with accuracy below the default threshold", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({topic_id: "t1", is_correct: true}),
				makeResult({topic_id: "t1", is_correct: false}),
				makeResult({topic_id: "t2", is_correct: true}),
				makeResult({topic_id: "t2", is_correct: true}),
			];
			let weak = service.getWeakTopics(results, makeSpec());
			expect(weak).toHaveLength(1);
			expect(weak[0]).toEqual({topicId: "t1", topicName: "Topic One", accuracy: 50, attempts: 2});
		});
		it("respects a custom threshold", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({topic_id: "t1", is_correct: true}),
				makeResult({topic_id: "t1", is_correct: true}),
				makeResult({topic_id: "t1", is_correct: false}),
			];
			let weak = service.getWeakTopics(results, makeSpec(), 80);
			expect(weak).toHaveLength(1);
			expect(weak[0]!.accuracy).toBeCloseTo(66.67, 1);
		});
		it("excludes topics above the threshold", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({topic_id: "t1", is_correct: true}),
				makeResult({topic_id: "t1", is_correct: true}),
				makeResult({topic_id: "t1", is_correct: false}),
			];
			let weak = service.getWeakTopics(results, makeSpec(), 50);
			expect(weak).toHaveLength(0);
		});
		it("sorts weak topics by ascending accuracy", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({topic_id: "t1", is_correct: true}),
				makeResult({topic_id: "t1", is_correct: false}),
				makeResult({topic_id: "t2", is_correct: false}),
				makeResult({topic_id: "t2", is_correct: false}),
			];
			let weak = service.getWeakTopics(results, makeSpec());
			expect(weak.map(w => w.topicId)).toEqual(["t2", "t1"]);
		});
		it("falls back to the topic id when the topic is not in the spec", () => {
			let service = new AnalyticsService();
			let results = [makeResult({topic_id: "unknown", is_correct: false})];
			let weak = service.getWeakTopics(results, makeSpec());
			expect(weak[0]!.topicName).toBe("unknown");
		});
		it("excludes topics with accuracy equal to the threshold", () => {
			let service = new AnalyticsService();
			let results = [makeResult({topic_id: "t1", is_correct: true})];
			let weak = service.getWeakTopics(results, makeSpec(), 100);
			expect(weak).toHaveLength(0);
		});
	});
	describe("getAccuracy", () => {
		it("returns zero for empty history", () => {
			let service = new AnalyticsService();
			expect(service.getAccuracy([])).toBe(0);
		});
		it("returns 100 when all results are correct", () => {
			let service = new AnalyticsService();
			let results = [makeResult({is_correct: true}), makeResult({is_correct: true})];
			expect(service.getAccuracy(results)).toBe(100);
		});
		it("returns 50 for a mixed history", () => {
			let service = new AnalyticsService();
			let results = [makeResult({is_correct: true}), makeResult({is_correct: false})];
			expect(service.getAccuracy(results)).toBe(50);
		});
		it("filters by topic id when provided", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({topic_id: "t1", is_correct: true}),
				makeResult({topic_id: "t1", is_correct: false}),
				makeResult({topic_id: "t2", is_correct: false}),
			];
			expect(service.getAccuracy(results, "t1")).toBe(50);
			expect(service.getAccuracy(results, "t2")).toBe(0);
		});
		it("returns zero for a topic with no attempts", () => {
			let service = new AnalyticsService();
			let results = [makeResult({topic_id: "t1", is_correct: true})];
			expect(service.getAccuracy(results, "t2")).toBe(0);
		});
	});
	describe("getSessionSummary", () => {
		it("returns zeroed summary for an empty session", () => {
			let service = new AnalyticsService();
			expect(service.getSessionSummary([])).toEqual({
				totalQuestions: 0,
				correctCount: 0,
				accuracy: 0,
				totalTimeMs: 0,
				averageTimeMs: 0,
				mode: "Single",
			});
		});
		it("summarizes a single completed question", () => {
			let service = new AnalyticsService();
			let results = [makeResult({is_correct: true, time_taken_ms: 2000, mode: "Mental"})];
			expect(service.getSessionSummary(results)).toEqual({
				totalQuestions: 1,
				correctCount: 1,
				accuracy: 100,
				totalTimeMs: 2000,
				averageTimeMs: 2000,
				mode: "Mental",
			});
		});
		it("summarizes a mixed session", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({is_correct: true, time_taken_ms: 1000}),
				makeResult({is_correct: false, time_taken_ms: 2000}),
				makeResult({is_correct: true, time_taken_ms: 3000}),
			];
			expect(service.getSessionSummary(results)).toEqual({
				totalQuestions: 3,
				correctCount: 2,
				accuracy: expect.closeTo(66.67, 1),
				totalTimeMs: 6000,
				averageTimeMs: 2000,
				mode: "Single",
			});
		});
		it("derives the mode from the most frequent result mode", () => {
			let service = new AnalyticsService();
			let results = [
				makeResult({mode: "Mental"}),
				makeResult({mode: "Mental"}),
				makeResult({mode: "Single"}),
			];
			expect(service.getSessionSummary(results).mode).toBe("Mental");
		});
		it("defaults to Single when modes are tied", () => {
			let service = new AnalyticsService();
			let results = [makeResult({mode: "Mental"}), makeResult({mode: "Single"})];
			expect(service.getSessionSummary(results).mode).toBe("Single");
		});
	});
});
