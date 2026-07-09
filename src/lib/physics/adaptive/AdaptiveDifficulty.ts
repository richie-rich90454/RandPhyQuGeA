/**
 * Adaptive-difficulty selector.
 *
 * Tracks recent correctness over a sliding window and nudges the recommended
 * difficulty up when the learner is consistently correct and down when they
 * struggle. Pure-TS, no DOM dependencies.
 */
export interface AdaptiveDifficultyConfig {
	/** Minimum difficulty (inclusive). Default 1. */
	min: number;
	/** Maximum difficulty (inclusive). Default 5. */
	max: number;
	/** Number of recent results considered. Default 5. */
	windowSize: number;
	/** Accuracy at or above which difficulty increases. Default 0.8. */
	upThreshold: number;
	/** Accuracy at or below which difficulty decreases. Default 0.5. */
	downThreshold: number;
	/** Amount to step the difficulty by. Default 1. */
	step: number;
}
/** Tracks recent results in a sliding window and recommends a difficulty that scales with learner accuracy. */
export class AdaptiveDifficulty {
	private difficulty: number;
	private readonly results: boolean[];
	private readonly config: AdaptiveDifficultyConfig;
	/** Construct with an initial difficulty (clamped to [min,max]) and optional config overrides. */
	public constructor(initial: number = 1, config?: Partial<AdaptiveDifficultyConfig>) {
		const cfg: AdaptiveDifficultyConfig = {min: 1, max: 5, windowSize: 5, upThreshold: 0.8, downThreshold: 0.5, step: 1, ...config};
		this.config = cfg;
		this.results = [];
		this.difficulty = this.clamp(initial);
	}
	/** Record a result and return the (possibly updated) current difficulty. */
	public record(correct: boolean): number {
		this.results.push(correct);
		while (this.results.length > this.config.windowSize) {
			this.results.shift();
		}
		if (this.results.length === this.config.windowSize) {
			const acc = this.accuracy();
			if (acc >= this.config.upThreshold) {
				this.difficulty = this.clamp(this.difficulty + this.config.step);
			} else if (acc <= this.config.downThreshold) {
				this.difficulty = this.clamp(this.difficulty - this.config.step);
			}
		}
		return this.difficulty;
	}
	/** Return the current difficulty. */
	public current(): number {
		return this.difficulty;
	}
	/** Return the accuracy over the current window ([0,1]; 0 when empty). */
	public accuracy(): number {
		if (this.results.length === 0) {
			return 0;
		}
		let correct = 0;
		for (const r of this.results) {
			if (r) {
				correct += 1;
			}
		}
		return correct / this.results.length;
	}
	/** Return the number of results currently in the window. */
	public windowCount(): number {
		return this.results.length;
	}
	/** Return the configured window size. */
	public windowSize(): number {
		return this.config.windowSize;
	}
	/** Reset difficulty to `value` (clamped) and clear the result window. */
	public reset(value: number = this.config.min): void {
		this.difficulty = this.clamp(value);
		this.results.length = 0;
	}
	/** Clamp a value to [min, max]. */
	private clamp(value: number): number {
		return Math.max(this.config.min, Math.min(this.config.max, value));
	}
}
