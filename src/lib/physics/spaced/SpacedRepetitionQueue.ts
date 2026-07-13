/**
 * Spaced-repetition queue (SM-2-lite).
 *
 * Schedules review of weak topics using a simplified SuperMemo-2 algorithm.
 * Each item tracks repetitions, interval, ease factor, and a due timestamp.
 * Quality grades are 0-5 (>= 3 counts as a successful recall). Pure-TS, no
 * DOM or storage dependencies.
 */
export interface SpacedRepetitionItem {
	/** Unique key for the item (typically a topic id). */
	key: string;
	/** Number of consecutive successful reviews. */
	repetitions: number;
	/** Current interval in days. */
	interval: number;
	/** Ease factor (>= 1.3); higher means longer intervals. */
	ease: number;
	/** Epoch milliseconds when the item is next due. */
	due: number;
	/** Last review quality (0-5) or undefined if never reviewed. */
	lastQuality?: number;
}
export interface ReviewResult {
	/** The updated item after applying the review. */
	item: SpacedRepetitionItem;
	/** The new interval in days. */
	interval: number;
	/** Whether the review was considered successful (quality >= 3). */
	success: boolean;
}
export interface SpacedRepetitionStats {
	/** Total registered items. */
	total: number;
	/** Items whose due timestamp is <= now. */
	due: number;
	/** Items with at least one successful review. */
	learned: number;
}
/** Schedules review of weak topics using a simplified SuperMemo-2 algorithm (quality 0-5; >= 3 is a successful recall). */
export class SpacedRepetitionQueue {
	private readonly items: Map<string, SpacedRepetitionItem>;
	private readonly dayMs: number;
	/** Construct the queue. `dayMs` overrides the milliseconds-per-day used when computing the next due timestamp. */
	public constructor(dayMs?: number) {
		this.items = new Map();
		this.dayMs = dayMs ?? 86400000;
	}
	/** Register a new item with defaults (reps=0, interval=1, ease=2.5, due=now). Returns the registered item. */
	public register(key: string, now: number = Date.now()): SpacedRepetitionItem {
		const item: SpacedRepetitionItem = {key, repetitions: 0, interval: 1, ease: 2.5, due: now};
		this.items.set(key, item);
		return item;
	}
	/** Return the item for `key`, or undefined when not registered. */
	public get(key: string): SpacedRepetitionItem | undefined {
		return this.items.get(key);
	}
	/** Return all registered items in insertion order. */
	public getAll(): SpacedRepetitionItem[] {
		return [...this.items.values()];
	}
	/** Return items whose due timestamp is <= `now`, sorted by due ascending. */
	public getDue(now: number = Date.now()): SpacedRepetitionItem[] {
		const due: SpacedRepetitionItem[] = [];
		for (const item of this.items.values()) {
			if (item.due <= now) {
				due.push(item);
			}
		}
		due.sort((a, b) => a.due - b.due);
		return due;
	}
	/** Apply a review of quality (0-5) to `key`, updating interval/ease/reps/due. Registers the item first if unknown. On success with reps >= 2, the new interval is `Math.max(prevInterval, Math.round(prevInterval * ease))` so the interval never decays even if a future ease change were to drop below 1.0. */
	public review(key: string, quality: number, now: number = Date.now()): ReviewResult {
		const existing = this.items.get(key);
		const item = existing ?? this.register(key, now);
		const clamped = Math.max(0, Math.min(5, quality));
		const success = clamped >= 3;
		let interval = 1;
		let reps = 0;
		let ease = item.ease;
		if (success) {
			reps = item.repetitions + 1;
			if (item.repetitions === 0) {
				interval = 1;
			} else if (item.repetitions === 1) {
				interval = 6;
			} else {
				interval = Math.max(item.interval, Math.round(item.interval * ease));
			}
		} else {
			reps = 0;
			interval = 1;
		}
		ease = Math.max(1.3, ease + 0.1 - (5 - clamped) * (0.08 + (5 - clamped) * 0.02));
		const updated: SpacedRepetitionItem = {key, repetitions: reps, interval, ease, due: now + interval * this.dayMs, lastQuality: clamped};
		this.items.set(key, updated);
		return {item: updated, interval, success};
	}
	/** Remove an item from the queue. Returns true when an item was removed. */
	public remove(key: string): boolean {
		return this.items.delete(key);
	}
	/** Return the number of registered items. */
	public size(): number {
		return this.items.size;
	}
	/** Return summary stats: total, due, and learned (reps > 0). */
	public stats(now: number = Date.now()): SpacedRepetitionStats {
		let due = 0;
		let learned = 0;
		for (const item of this.items.values()) {
			if (item.due <= now) {
				due += 1;
			}
			if (item.repetitions > 0) {
				learned += 1;
			}
		}
		return {total: this.items.size, due, learned};
	}
}
