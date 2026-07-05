/** Analytics service for streaks, weak topics, accuracy, and session summaries. */
import type {IAnalyticsService, WeakTopic, SessionSummary} from "./contracts";
import type {PracticeResult, PracticeMode, Specification} from "../types/models";
import type {StreakData} from "./streakService";
import {computeStreak} from "./streakService";
/** Default accuracy threshold (percentage) below which a topic is considered weak. */
const DEFAULT_WEAK_THRESHOLD = 70;
/** Minimum number of attempts required before a topic is evaluated as weak. */
const MIN_ATTEMPTS = 1;
export class AnalyticsService implements IAnalyticsService {
	public getStreak(results: PracticeResult[]): StreakData {
		return computeStreak(results);
	}
	public getWeakTopics(results: PracticeResult[], spec: Specification, threshold: number = DEFAULT_WEAK_THRESHOLD): WeakTopic[] {
		let byTopic = new Map<string, {total: number; correct: number}>();
		for (let result of results) {
			let entry = byTopic.get(result.topic_id) ?? {total: 0, correct: 0};
			entry.total += 1;
			if (result.is_correct) {
				entry.correct += 1;
			}
			byTopic.set(result.topic_id, entry);
		}
		let weak: WeakTopic[] = [];
		for (let [topicId, {total, correct}] of byTopic) {
			if (total < MIN_ATTEMPTS) {
				continue;
			}
			let accuracy = (correct / total) * 100;
			if (accuracy >= threshold) {
				continue;
			}
			let topic = spec.topics.find(t => t.id === topicId);
			weak.push({topicId, topicName: topic?.name ?? topicId, accuracy, attempts: total});
		}
		weak.sort((a, b) => a.accuracy - b.accuracy);
		return weak;
	}
	public getAccuracy(results: PracticeResult[], topicId?: string): number {
		let filtered = topicId ? results.filter(r => r.topic_id === topicId) : results;
		if (filtered.length === 0) {
			return 0;
		}
		let correct = filtered.filter(r => r.is_correct).length;
		return (correct / filtered.length) * 100;
	}
	public getSessionSummary(results: PracticeResult[]): SessionSummary {
		let totalQuestions = results.length;
		let correctCount = results.filter(r => r.is_correct).length;
		let accuracy = totalQuestions === 0 ? 0 : (correctCount / totalQuestions) * 100;
		let totalTimeMs = results.reduce((sum, r) => sum + r.time_taken_ms, 0);
		let averageTimeMs = totalQuestions === 0 ? 0 : totalTimeMs / totalQuestions;
		let mode = this.deriveMode(results);
		return {totalQuestions, correctCount, accuracy, totalTimeMs, averageTimeMs, mode};
	}
	private deriveMode(results: PracticeResult[]): PracticeMode {
		if (results.length === 0) {
			return "Single";
		}
		let counts = new Map<PracticeMode, number>([["Single", 0], ["Mental", 0]]);
		for (let result of results) {
			counts.set(result.mode, (counts.get(result.mode) ?? 0) + 1);
		}
		let mode: PracticeMode = "Single";
		let max = 0;
		for (let [m, c] of counts) {
			if (c > max) {
				max = c;
				mode = m;
			}
		}
		return mode;
	}
}
