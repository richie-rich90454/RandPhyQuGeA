/**
 * Timed-challenge variants.
 *
 * Defines sprint (30s/60s/120s), marathon (10min/30min), and
 * accuracy-challenge (get N right fastest) configs and a state machine
 * driving a challenge lifecycle: idle -> running -> paused -> completed/aborted.
 * Pure-TS, no timer/DOM dependencies; time is injected via epoch-ms arguments.
 */
/** The kind of timed challenge. */
export type TimedChallengeKind = "sprint" | "marathon" | "accuracy";
/** The lifecycle state of a challenge. */
export type TimedChallengeState = "idle" | "running" | "paused" | "completed" | "aborted";
/** Configuration for a single timed-challenge variant. */
export interface TimedChallengeConfig {
	/** The challenge kind. */
	readonly kind: TimedChallengeKind;
	/** Total duration in ms (sprint/marathon); 0 for an uncapped accuracy challenge. */
	readonly durationMs: number;
	/** Target correct answers (accuracy kind); 0 for time-based kinds. */
	readonly targetCorrect: number;
	/** Human-readable label. */
	readonly label: string;
}
/** The result of a finished challenge. */
export interface TimedChallengeResult {
	readonly config: TimedChallengeConfig;
	readonly state: TimedChallengeState;
	readonly answeredCount: number;
	readonly correctCount: number;
	readonly elapsedMs: number;
	readonly completed: boolean;
}
/** Built-in sprint variants. */
export const SPRINT_CHALLENGES: TimedChallengeConfig[] = [
	{kind: "sprint", durationMs: 30000, targetCorrect: 0, label: "30s Sprint"},
	{kind: "sprint", durationMs: 60000, targetCorrect: 0, label: "60s Sprint"},
	{kind: "sprint", durationMs: 120000, targetCorrect: 0, label: "120s Sprint"},
];
/** Built-in marathon variants. */
export const MARATHON_CHALLENGES: TimedChallengeConfig[] = [
	{kind: "marathon", durationMs: 600000, targetCorrect: 0, label: "10min Marathon"},
	{kind: "marathon", durationMs: 1800000, targetCorrect: 0, label: "30min Marathon"},
];
/** Built-in accuracy-challenge variants. */
export const ACCURACY_CHALLENGES: TimedChallengeConfig[] = [
	{kind: "accuracy", durationMs: 0, targetCorrect: 50, label: "50-Correct Accuracy Challenge"},
];
/** Drives a single timed-challenge lifecycle with an injected clock. */
export class TimedChallenge {
	private readonly config: TimedChallengeConfig;
	private state: TimedChallengeState;
	private startedAt: number;
	private elapsedBeforePause: number;
	private endedAt: number;
	private answeredValue: number;
	private correctValue: number;
	/** Construct an idle challenge for `config`. */
	public constructor(config: TimedChallengeConfig) {
		this.config = config;
		this.state = "idle";
		this.startedAt = 0;
		this.elapsedBeforePause = 0;
		this.endedAt = 0;
		this.answeredValue = 0;
		this.correctValue = 0;
	}
	/** Start the challenge (idle -> running). Throws when not idle. */
	public start(now: number = Date.now()): void {
		if (this.state !== "idle") {
			throw new Error(`Cannot start from state ${this.state}`);
		}
		this.startedAt = now;
		this.state = "running";
	}
	/** Pause a running challenge (running -> paused). Returns true on success. */
	public pause(now: number = Date.now()): boolean {
		if (this.state !== "running") {
			return false;
		}
		this.elapsedBeforePause += now - this.startedAt;
		this.startedAt = now;
		this.state = "paused";
		return true;
	}
	/** Resume a paused challenge (paused -> running). Returns true on success. */
	public resume(now: number = Date.now()): boolean {
		if (this.state !== "paused") {
			return false;
		}
		this.startedAt = now;
		this.state = "running";
		return true;
	}
	/** Abort a running or paused challenge. Returns true on success. */
	public abort(now: number = Date.now()): boolean {
		if (this.state !== "running" && this.state !== "paused") {
			return false;
		}
		this.foldElapsed(now);
		this.state = "aborted";
		this.endedAt = now;
		return true;
	}
	/** Record an answered question; for accuracy challenges, completes when the target is met. */
	public record(correct: boolean, now: number = Date.now()): TimedChallengeState {
		if (this.state !== "running" && this.state !== "paused") {
			return this.state;
		}
		this.answeredValue += 1;
		if (correct) {
			this.correctValue += 1;
		}
		if (this.config.kind === "accuracy" && this.correctValue >= this.config.targetCorrect) {
			this.complete(now);
		}
		return this.state;
	}
	/** Evaluate time-based completion for sprint/marathon challenges; returns the current state. */
	public tick(now: number = Date.now()): TimedChallengeState {
		if (this.state === "running" && this.config.kind !== "accuracy" && this.config.durationMs > 0) {
			if (this.elapsedMs(now) >= this.config.durationMs) {
				this.complete(now);
			}
		}
		return this.state;
	}
	/** Return the current state. */
	public currentState(): TimedChallengeState {
		return this.state;
	}
	/** Return true when the challenge is finished (completed or aborted). */
	public isFinished(): boolean {
		return this.state === "completed" || this.state === "aborted";
	}
	/** Return the elapsed time in ms (folded at finish). */
	public elapsedMs(now: number = Date.now()): number {
		if (this.state === "running") {
			return this.elapsedBeforePause + (now - this.startedAt);
		}
		return this.elapsedBeforePause;
	}
	/** Return the remaining time in ms for time-based challenges (0 when finished/uncapped). */
	public remainingMs(now: number = Date.now()): number {
		if (this.config.durationMs <= 0) {
			return 0;
		}
		return Math.max(0, this.config.durationMs - this.elapsedMs(now));
	}
	/** Return the number of answered questions. */
	public answeredCount(): number {
		return this.answeredValue;
	}
	/** Return the number of correct answers. */
	public correctCount(): number {
		return this.correctValue;
	}
	/** Return the challenge config. */
	public getConfig(): TimedChallengeConfig {
		return this.config;
	}
	/** Return the result when finished, otherwise undefined. */
	public result(now: number = Date.now()): TimedChallengeResult | undefined {
		if (!this.isFinished()) {
			return undefined;
		}
		return {
			config: this.config,
			state: this.state,
			answeredCount: this.answeredValue,
			correctCount: this.correctValue,
			elapsedMs: this.elapsedBeforePause,
			completed: this.state === "completed",
		};
	}
	/** Transition to the completed state, folding elapsed time. */
	private complete(now: number): void {
		if (this.state !== "running" && this.state !== "paused") {
			return;
		}
		this.foldElapsed(now);
		this.state = "completed";
		this.endedAt = now;
	}
	/** Fold the current running segment into the accumulated elapsed total. */
	private foldElapsed(now: number): void {
		if (this.state === "running") {
			this.elapsedBeforePause += now - this.startedAt;
			this.startedAt = now;
		}
	}
}
