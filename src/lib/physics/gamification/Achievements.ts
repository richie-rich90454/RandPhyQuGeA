/**
 * Achievements system.
 *
 * Defines a catalog of achievement definitions and tracks which have been
 * unlocked. Unlock conditions are evaluated against an immutable stats
 * snapshot, returning the set of newly-unlocked achievements. Pure-TS, no
 * storage or DOM dependencies.
 */
/** Snapshot of learner statistics used to evaluate achievement unlock conditions. */
export interface AchievementStats {
	/** Total questions answered across all sessions. */
	questionsAnswered: number;
	/** Total questions answered correctly. */
	correctAnswers: number;
	/** Current consecutive-correct streak (0 when the last answer was wrong). */
	currentStreak: number;
	/** Best consecutive-correct streak ever achieved. */
	bestStreak: number;
	/** Duration of the current/last session in milliseconds. */
	sessionDurationMs: number;
	/** Number of distinct topics practiced. */
	topicsPracticed: number;
	/** Number of distinct units practiced. */
	unitsPracticed: number;
	/** Total number of practice sessions completed. */
	totalSessions: number;
	/** Number of sessions with 100% accuracy over at least 10 questions. */
	perfectSessions: number;
	/** Number of bookmarks created. */
	bookmarksCreated: number;
	/** Current consecutive-day practice streak. */
	dailyStreak: number;
	/** Average time per question in milliseconds (over recent history). */
	avgTimePerQuestionMs: number;
}
/** A single achievement definition with its unlock predicate. */
export interface AchievementDefinition {
	/** Stable unique identifier (used for persistence). */
	readonly id: string;
	/** Human-readable display name. */
	readonly name: string;
	/** Short description of the unlock condition. */
	readonly description: string;
	/** Grouping label (e.g. 'volume', 'streak', 'accuracy'). */
	readonly category: string;
	/** Returns true when the stats snapshot satisfies the unlock condition. */
	readonly check: (stats: AchievementStats) => boolean;
}
/** The default catalog of achievement definitions. */
const DEFAULT_DEFINITIONS: AchievementDefinition[] = [
	{id: "first_steps", name: "First Steps", description: "Answer your first question.", category: "volume", check: s => s.questionsAnswered >= 1},
	{id: "getting_warm", name: "Getting Warm", description: "Answer 10 questions.", category: "volume", check: s => s.questionsAnswered >= 10},
	{id: "fifty_questions", name: "Half Century", description: "Answer 50 questions.", category: "volume", check: s => s.questionsAnswered >= 50},
	{id: "century", name: "Century", description: "Answer 100 questions.", category: "volume", check: s => s.questionsAnswered >= 100},
	{id: "five_hundred", name: "Quincentenary", description: "Answer 500 questions.", category: "volume", check: s => s.questionsAnswered >= 500},
	{id: "streak_5", name: "On a Roll", description: "Get 5 correct in a row.", category: "streak", check: s => s.bestStreak >= 5},
	{id: "streak_10", name: "Perfect Streak", description: "Get 10 correct in a row.", category: "streak", check: s => s.bestStreak >= 10},
	{id: "streak_25", name: "Unstoppable", description: "Get 25 correct in a row.", category: "streak", check: s => s.bestStreak >= 25},
	{id: "marathon", name: "Marathon", description: "Practice for one hour in a session.", category: "session", check: s => s.sessionDurationMs >= 3600000},
	{id: "sprint_session", name: "Sprint", description: "Practice for 5 minutes in a session.", category: "session", check: s => s.sessionDurationMs >= 300000},
	{id: "polymath", name: "Polymath", description: "Practice 5 different topics.", category: "breadth", check: s => s.topicsPracticed >= 5},
	{id: "renaissance", name: "Renaissance", description: "Practice 3 different units.", category: "breadth", check: s => s.unitsPracticed >= 3},
	{id: "sharpshooter", name: "Sharpshooter", description: "Reach 90% accuracy over at least 20 questions.", category: "accuracy", check: s => s.questionsAnswered >= 20 && Achievements.accuracy(s) >= 0.9},
	{id: "accuracy_master", name: "Accuracy Master", description: "Reach 95% accuracy over at least 50 questions.", category: "accuracy", check: s => s.questionsAnswered >= 50 && Achievements.accuracy(s) >= 0.95},
	{id: "bookworm", name: "Bookworm", description: "Bookmark 10 questions.", category: "collection", check: s => s.bookmarksCreated >= 10},
	{id: "dedicated", name: "Dedicated", description: "Complete 10 practice sessions.", category: "session", check: s => s.totalSessions >= 10},
	{id: "flawless", name: "Flawless", description: "Complete a perfect session (100% over 10+ questions).", category: "accuracy", check: s => s.perfectSessions >= 1},
	{id: "daily_streak_3", name: "Consistent", description: "Practice 3 days in a row.", category: "streak", check: s => s.dailyStreak >= 3},
	{id: "daily_streak_7", name: "Week Warrior", description: "Practice 7 days in a row.", category: "streak", check: s => s.dailyStreak >= 7},
	{id: "speed_demon", name: "Speed Demon", description: "Average under 15s per question over 20+ questions.", category: "speed", check: s => s.questionsAnswered >= 20 && s.avgTimePerQuestionMs > 0 && s.avgTimePerQuestionMs <= 15000},
];
/** Tracks achievement unlock state and evaluates conditions against stats snapshots. */
export class Achievements {
	private readonly definitions: AchievementDefinition[];
	private readonly unlocked: Set<string>;
	/** Construct with the default catalog, or a custom `definitions` list. */
	public constructor(definitions?: AchievementDefinition[]) {
		this.definitions = definitions ?? Achievements.defaultDefinitions();
		this.unlocked = new Set();
	}
	/** Evaluate `stats` against all locked achievements, unlock those satisfied, and return the newly-unlocked definitions (in catalog order). */
	public check(stats: AchievementStats): AchievementDefinition[] {
		const newly: AchievementDefinition[] = [];
		for (const def of this.definitions) {
			if (this.unlocked.has(def.id)) {
				continue;
			}
			if (def.check(stats)) {
				this.unlocked.add(def.id);
				newly.push(def);
			}
		}
		return newly;
	}
	/** Return true when `id` has been unlocked. */
	public isUnlocked(id: string): boolean {
		return this.unlocked.has(id);
	}
	/** Return the ids of all unlocked achievements in catalog order. */
	public unlockedIds(): string[] {
		return this.definitions.filter(d => this.unlocked.has(d.id)).map(d => d.id);
	}
	/** Return the ids of all still-locked achievements in catalog order. */
	public lockedIds(): string[] {
		return this.definitions.filter(d => !this.unlocked.has(d.id)).map(d => d.id);
	}
	/** Return all achievement definitions (catalog order). */
	public all(): AchievementDefinition[] {
		return this.definitions.slice();
	}
	/** Return the definition for `id`, or undefined when unknown. */
	public get(id: string): AchievementDefinition | undefined {
		return this.definitions.find(d => d.id === id);
	}
	/** Manually mark `id` as unlocked (e.g. when restoring from persistence). Returns true when `id` is a known definition. */
	public markUnlocked(id: string): boolean {
		if (!this.definitions.some(d => d.id === id)) {
			return false;
		}
		this.unlocked.add(id);
		return true;
	}
	/** Return the number of unlocked achievements. */
	public count(): number {
		return this.unlocked.size;
	}
	/** Return the total number of achievements in the catalog. */
	public total(): number {
		return this.definitions.length;
	}
	/** Forget all unlocked achievements. */
	public reset(): void {
		this.unlocked.clear();
	}
	/** Return the default catalog of achievement definitions (a fresh copy). */
	public static defaultDefinitions(): AchievementDefinition[] {
		return DEFAULT_DEFINITIONS.slice();
	}
	/** Compute the accuracy ratio ([0,1]) for a stats snapshot; 0 when no questions answered. */
	public static accuracy(stats: AchievementStats): number {
		if (stats.questionsAnswered <= 0) {
			return 0;
		}
		return stats.correctAnswers / stats.questionsAnswered;
	}
}
