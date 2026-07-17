/**
 * Session tags model.
 *
 * Associates arbitrary string tags with practice sessions and aggregates
 * per-tag statistics across the tagged sessions. Pure-TS, no storage
 * dependencies.
 */
/** Aggregate statistics for a single practice session. */
export interface SessionStats {
    /** Questions answered in the session. */
    questionsAnswered: number;
    /** Questions answered correctly. */
    correctAnswers: number;
    /** Total time spent in the session (milliseconds). */
    totalTimeMs: number;
}
/** Aggregated statistics for all sessions sharing a tag. */
export interface TagAggregate {
    /** The tag the aggregation is grouped by. */
    readonly tag: string;
    /** Number of sessions carrying this tag. */
    readonly sessionCount: number;
    /** Total questions answered across tagged sessions. */
    readonly questionsAnswered: number;
    /** Total correct answers across tagged sessions. */
    readonly correctAnswers: number;
    /** Accuracy ratio ([0,1]) across tagged sessions; 0 when no questions. */
    readonly accuracy: number;
    /** Total time (ms) across tagged sessions. */
    readonly totalTimeMs: number;
}
function emptyStats(): SessionStats {
    return {questionsAnswered: 0, correctAnswers: 0, totalTimeMs: 0};
}
/** Tracks tags per session, a tag→sessions index, and per-session stats for aggregation. */
export class SessionTags {
    private readonly sessions: Map<string, Set<string>>;
    private readonly stats: Map<string, SessionStats>;
    private readonly tagIndex: Map<string, Set<string>>;
    /** Construct an empty session-tags store. */
    public constructor() {
        this.sessions = new Map();
        this.stats = new Map();
        this.tagIndex = new Map();
    }
    /** Attach `tags` to `sessionId` (creating the session record when needed). Returns the session's full tag set after the update. */
    public tagSession(sessionId: string, tags: string[]): string[] {
        let set = this.sessions.get(sessionId);
        if (set === undefined) {
            set = new Set();
            this.sessions.set(sessionId, set);
            this.stats.set(sessionId, emptyStats());
        }
        for (const tag of tags) {
            if (tag === "") {
                continue;
            }
            set.add(tag);
            let bucket = this.tagIndex.get(tag);
            if (bucket === undefined) {
                bucket = new Set();
                this.tagIndex.set(tag, bucket);
            }
            bucket.add(sessionId);
        }
        return this.tagsForSession(sessionId);
    }
    /** Remove a single `tag` from `sessionId`. Returns true when the tag was present. */
    public untagSession(sessionId: string, tag: string): boolean {
        const set = this.sessions.get(sessionId);
        if (set === undefined || !set.delete(tag)) {
            return false;
        }
        const bucket = this.tagIndex.get(tag);
        if (bucket !== undefined) {
            bucket.delete(sessionId);
            if (bucket.size === 0) {
                this.tagIndex.delete(tag);
            }
        }
        return true;
    }
    /** Return the tags attached to `sessionId` (sorted, fresh array). */
    public tagsForSession(sessionId: string): string[] {
        const set = this.sessions.get(sessionId);
        if (set === undefined) {
            return [];
        }
        return Array.from(set).toSorted();
    }
    /** Return the session ids carrying `tag` (sorted, fresh array). */
    public sessionsForTag(tag: string): string[] {
        const bucket = this.tagIndex.get(tag);
        if (bucket === undefined) {
            return [];
        }
        return Array.from(bucket).toSorted();
    }
    /** Record a single answered question for `sessionId` (creating the session when needed). */
    public recordResult(sessionId: string, correct: boolean, timeMs: number): void {
        let s = this.stats.get(sessionId);
        if (s === undefined) {
            s = emptyStats();
            this.stats.set(sessionId, s);
            if (!this.sessions.has(sessionId)) {
                this.sessions.set(sessionId, new Set());
            }
        }
        s.questionsAnswered += 1;
        if (correct) {
            s.correctAnswers += 1;
        }
        s.totalTimeMs += Math.max(0, timeMs);
    }
    /** Replace the stats for `sessionId` outright (creating the session when needed). */
    public setStats(sessionId: string, stats: SessionStats): void {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, new Set());
        }
        this.stats.set(sessionId, {questionsAnswered: stats.questionsAnswered, correctAnswers: stats.correctAnswers, totalTimeMs: stats.totalTimeMs});
    }
    /** Return the stats for `sessionId`, or undefined. */
    public statsFor(sessionId: string): SessionStats | undefined {
        const s = this.stats.get(sessionId);
        if (s === undefined) {
            return undefined;
        }
        return {questionsAnswered: s.questionsAnswered, correctAnswers: s.correctAnswers, totalTimeMs: s.totalTimeMs};
    }
    /** Aggregate stats across all sessions carrying `tag`. */
    public aggregateByTag(tag: string): TagAggregate {
        const ids = this.sessionsForTag(tag);
        let questionsAnswered = 0;
        let correctAnswers = 0;
        let totalTimeMs = 0;
        for (const id of ids) {
            const s = this.stats.get(id);
            if (s !== undefined) {
                questionsAnswered += s.questionsAnswered;
                correctAnswers += s.correctAnswers;
                totalTimeMs += s.totalTimeMs;
            }
        }
        const accuracy = questionsAnswered <= 0 ? 0 : correctAnswers / questionsAnswered;
        return {tag, sessionCount: ids.length, questionsAnswered, correctAnswers, accuracy, totalTimeMs};
    }
    /** Return all tags currently in use (sorted, fresh array). */
    public allTags(): string[] {
        return Array.from(this.tagIndex.keys()).toSorted();
    }
    /** Return true when `sessionId` is known. */
    public hasSession(sessionId: string): boolean {
        return this.sessions.has(sessionId);
    }
    /** Return the number of sessions tracked. */
    public sessionCount(): number {
        return this.sessions.size;
    }
    /** Remove a session and its tag associations. Returns true when the session existed. */
    public removeSession(sessionId: string): boolean {
        const set = this.sessions.get(sessionId);
        if (set === undefined) {
            return false;
        }
        for (const tag of set) {
            const bucket = this.tagIndex.get(tag);
            if (bucket !== undefined) {
                bucket.delete(sessionId);
                if (bucket.size === 0) {
                    this.tagIndex.delete(tag);
                }
            }
        }
        this.sessions.delete(sessionId);
        this.stats.delete(sessionId);
        return true;
    }
    /** Remove all sessions, tags, and stats. */
    public clear(): void {
        this.sessions.clear();
        this.stats.clear();
        this.tagIndex.clear();
    }
}
