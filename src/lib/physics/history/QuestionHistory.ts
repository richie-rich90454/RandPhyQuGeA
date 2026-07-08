/**
 * Question history store (ring buffer).
 *
 * Records question attempts in a fixed-capacity ring buffer. When the buffer
 * is full, the oldest attempt is dropped. Supports querying recent attempts,
 * per-question lookups, accuracy stats, and re-attempt detection (a question
 * whose most recent attempt was incorrect). Pure-TS, no storage dependencies.
 */
export interface QuestionAttempt {
	/** Unique attempt id (auto-assigned). */
	id: string;
	/** The question id this attempt answers. */
	questionId: string;
	/** Whether the response was graded correct. */
	correct: boolean;
	/** The user's response string. */
	response: string;
	/** Response mode ("MC" | "FRQ" | ...). */
	mode: string;
	/** Epoch milliseconds when the attempt was recorded. */
	timestamp: number;
	/** Optional time spent on the question in milliseconds. */
	timeSpentMs?: number;
}
export interface HistoryStats {
	/** Total attempts currently in the buffer. */
	total: number;
	/** Number of correct attempts. */
	correct: number;
	/** Accuracy in the range [0, 1]; 0 when empty. */
	accuracy: number;
}
export class QuestionHistory {
	private readonly capacity: number;
	private readonly attempts: QuestionAttempt[];
	private counter: number;
	/** Construct a history with the given ring-buffer capacity (default 100). */
	public constructor(capacity: number = 100) {
		if (capacity < 1) {
			throw new Error("QuestionHistory capacity must be >= 1");
		}
		this.capacity = capacity;
		this.attempts = [];
		this.counter = 0;
	}
	/** Record an attempt (without id) and return the stored attempt with an auto-assigned id. Older entries are dropped when over capacity. */
	public record(input: Omit<QuestionAttempt, "id" | "timestamp"> & {timestamp?: number}): QuestionAttempt {
		this.counter += 1;
		const attempt: QuestionAttempt = {
			id: `att-${this.counter}`,
			questionId: input.questionId,
			correct: input.correct,
			response: input.response,
			mode: input.mode,
			timestamp: input.timestamp ?? Date.now(),
			timeSpentMs: input.timeSpentMs,
		};
		this.attempts.push(attempt);
		while (this.attempts.length > this.capacity) {
			this.attempts.shift();
		}
		return attempt;
	}
	/** Return the `n` most recent attempts (newest last). */
	public recent(n: number): QuestionAttempt[] {
		if (n <= 0) {
			return [];
		}
		return this.attempts.slice(Math.max(0, this.attempts.length - n));
	}
	/** Return all attempts in chronological order. */
	public all(): QuestionAttempt[] {
		return [...this.attempts];
	}
	/** Return all attempts for a given question id in chronological order. */
	public getByQuestion(questionId: string): QuestionAttempt[] {
		return this.attempts.filter(a => a.questionId === questionId);
	}
	/** Return the most recent attempt for a question, or undefined. */
	public lastAttempt(questionId: string): QuestionAttempt | undefined {
		for (let i = this.attempts.length - 1; i >= 0; i--) {
			const a = this.attempts[i];
			if (a !== undefined && a.questionId === questionId) {
				return a;
			}
		}
		return undefined;
	}
	/** Return true when the most recent attempt for `questionId` was incorrect. */
	public needsReattempt(questionId: string): boolean {
		const last = this.lastAttempt(questionId);
		return last !== undefined && !last.correct;
	}
	/** Return the set of question ids whose most recent attempt was incorrect. */
	public reattemptQueue(): string[] {
		const seen = new Map<string, boolean>();
		for (const a of this.attempts) {
			seen.set(a.questionId, a.correct);
		}
		const result: string[] = [];
		for (const [qid, correct] of seen) {
			if (!correct) {
				result.push(qid);
			}
		}
		return result;
	}
	/** Return the number of attempts currently stored. */
	public count(): number {
		return this.attempts.length;
	}
	/** Return aggregate accuracy stats over the current buffer. */
	public stats(): HistoryStats {
		const total = this.attempts.length;
		let correct = 0;
		for (const a of this.attempts) {
			if (a.correct) {
				correct += 1;
			}
		}
		return {total, correct, accuracy: total === 0 ? 0 : correct / total};
	}
	/** Remove all attempts. */
	public clear(): void {
		this.attempts.length = 0;
	}
	/** Return the ring-buffer capacity. */
	public getCapacity(): number {
		return this.capacity;
	}
}
