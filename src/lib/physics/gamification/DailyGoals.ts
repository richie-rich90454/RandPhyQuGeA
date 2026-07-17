/**
 * Daily-goals system.
 *
 * Defines a set of daily practice goals, tracks progress against a raw
 * activity snapshot, rolls over at day boundaries, and maintains a
 * consecutive-day completion streak. Pure-TS, no storage dependencies.
 */
/** Metrics a daily goal can be measured against. */
export type DailyGoalMetric = "questionsAnswered" | "correctAnswers" | "accuracy" | "topicsPracticed" | "sessionMinutes";
/** A single daily goal definition. */
export interface DailyGoalDefinition {
    /** Stable unique identifier. */
    readonly id: string;
    /** Human-readable description. */
    readonly description: string;
    /** The metric this goal is measured against. */
    readonly metric: DailyGoalMetric;
    /** The target value the metric must reach (accuracy target is a ratio in [0,1]). */
    readonly target: number;
}
/** Raw activity counts for the current day, used to evaluate goal progress. */
export interface DailyGoalSnapshot {
    questionsAnswered: number;
    correctAnswers: number;
    topicsPracticed: number;
    sessionMinutes: number;
}
/** Progress snapshot for a single goal. */
export interface DailyGoalProgress {
    readonly goalId: string;
    readonly metric: DailyGoalMetric;
    readonly current: number;
    readonly target: number;
    readonly complete: boolean;
}
/** The default set of daily goals. */
const DEFAULT_GOALS: DailyGoalDefinition[] = [
    {id: "answer_20", description: "Answer 20 questions.", metric: "questionsAnswered", target: 20},
    {id: "correct_15", description: "Answer 15 questions correctly.", metric: "correctAnswers", target: 15},
    {id: "accuracy_80", description: "Reach 80% accuracy.", metric: "accuracy", target: 0.8},
    {id: "topics_3", description: "Practice 3 different topics.", metric: "topicsPracticed", target: 3},
    {id: "session_15", description: "Practice for 15 minutes.", metric: "sessionMinutes", target: 15},
];
/** Tracks daily goal progress, day rollover, and a completion streak. */
export class DailyGoals {
    private readonly goals: DailyGoalDefinition[];
    private snapshot: DailyGoalSnapshot;
    private dayKey: string;
    private streak: number;
    private bestStreakValue: number;
    private lastCompletedDay: string | null;
    /** Construct with the default goals, or a custom `goals` list. `today` is a YYYY-MM-DD day key (defaults to today in the local timezone). */
    public constructor(goals?: DailyGoalDefinition[], today: string = DailyGoals.localDay(Date.now())) {
        this.goals = goals ?? DailyGoals.defaultGoals();
        this.snapshot = {questionsAnswered: 0, correctAnswers: 0, topicsPracticed: 0, sessionMinutes: 0};
        this.dayKey = today;
        this.streak = 0;
        this.bestStreakValue = 0;
        this.lastCompletedDay = null;
    }
    /** Record `snapshot` for `today`, rolling over the day (and updating the streak) when the day changes. Returns the goals that became complete with this update (excluding those already complete). */
    public record(snapshot: DailyGoalSnapshot, today: string = DailyGoals.localDay(Date.now())): DailyGoalDefinition[] {
        if (today !== this.dayKey) {
            this.finalizeDay();
            this.dayKey = today;
            this.snapshot = {questionsAnswered: 0, correctAnswers: 0, topicsPracticed: 0, sessionMinutes: 0};
        }
        const before = new Set(this.completedIds());
        this.snapshot = {questionsAnswered: snapshot.questionsAnswered, correctAnswers: snapshot.correctAnswers, topicsPracticed: snapshot.topicsPracticed, sessionMinutes: snapshot.sessionMinutes};
        const after = this.completedIds();
        const newly: DailyGoalDefinition[] = [];
        for (const goal of this.goals) {
            if (after.includes(goal.id) && !before.has(goal.id)) {
                newly.push(goal);
            }
        }
        return newly;
    }
    /** Return progress for all goals (in definition order). */
    public progress(): DailyGoalProgress[] {
        return this.goals.map(g => {
            const current = this.metricValue(g.metric);
            return {goalId: g.id, metric: g.metric, current, target: g.target, complete: current >= g.target};
        });
    }
    /** Return the progress for a single goal, or undefined when unknown. */
    public progressFor(id: string): DailyGoalProgress | undefined {
        const goal = this.goals.find(g => g.id === id);
        if (goal === undefined) {
            return undefined;
        }
        const current = this.metricValue(goal.metric);
        return {goalId: goal.id, metric: goal.metric, current, target: goal.target, complete: current >= goal.target};
    }
    /** Return true when `id` is complete. */
    public isComplete(id: string): boolean {
        const p = this.progressFor(id);
        return p === undefined ? false : p.complete;
    }
    /** Return the ids of all complete goals (in definition order). */
    public completedIds(): string[] {
        return this.goals.filter(g => this.metricValue(g.metric) >= g.target).map(g => g.id);
    }
    /** Return the number of complete goals. */
    public completedCount(): number {
        return this.completedIds().length;
    }
    /** Return the total number of goals. */
    public total(): number {
        return this.goals.length;
    }
    /** Return true when every goal is complete for the current day. */
    public allComplete(): boolean {
        return this.goals.every(g => this.metricValue(g.metric) >= g.target);
    }
    /** Return the current day key (YYYY-MM-DD). */
    public currentDay(): string {
        return this.dayKey;
    }
    /** Return the current consecutive-day completion streak. */
    public currentStreak(): number {
        return this.streak;
    }
    /** Return the best consecutive-day completion streak ever observed. */
    public bestStreak(): number {
        return this.bestStreakValue;
    }
    /** Reset all progress, streak, and day state (keeps the goal definitions). */
    public reset(): void {
        this.snapshot = {questionsAnswered: 0, correctAnswers: 0, topicsPracticed: 0, sessionMinutes: 0};
        this.streak = 0;
        this.bestStreakValue = 0;
        this.lastCompletedDay = null;
    }
    /** Return the default goal definitions (a fresh copy). */
    public static defaultGoals(): DailyGoalDefinition[] {
        return DEFAULT_GOALS.slice();
    }
    /** Format an epoch millisecond timestamp as a UTC YYYY-MM-DD day key. */
    public static utcDay(epochMs: number): string {
        const d = new Date(epochMs);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }
    /** Format an epoch millisecond timestamp as a local YYYY-MM-DD day key (respects the host timezone so goals roll over at local midnight, not UTC midnight). */
    public static localDay(epochMs: number): string {
        const d = new Date(epochMs);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }
    /** Compute the current value of `metric` from the stored snapshot. */
    private metricValue(metric: DailyGoalMetric): number {
        switch (metric) {
            case "questionsAnswered":
                return this.snapshot.questionsAnswered;
            case "correctAnswers":
                return this.snapshot.correctAnswers;
            case "topicsPracticed":
                return this.snapshot.topicsPracticed;
            case "sessionMinutes":
                return this.snapshot.sessionMinutes;
            case "accuracy":
                return DailyGoals.accuracy(this.snapshot);
            default:
                return 0;
        }
    }
    /** Finalize the current day: increment the streak when all goals were complete, otherwise reset it. */
    private finalizeDay(): void {
        if (this.allComplete()) {
            if (this.lastCompletedDay === null || this.lastCompletedDay !== this.dayKey) {
                this.streak += 1;
                this.bestStreakValue = Math.max(this.bestStreakValue, this.streak);
                this.lastCompletedDay = this.dayKey;
            }
        } else {
            this.streak = 0;
        }
    }
    /** Compute the accuracy ratio ([0,1]) for a snapshot; 0 when no questions answered. */
    private static accuracy(snapshot: DailyGoalSnapshot): number {
        if (snapshot.questionsAnswered <= 0) {
            return 0;
        }
        return snapshot.correctAnswers / snapshot.questionsAnswered;
    }
}
