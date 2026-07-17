/**
 * Local leaderboard.
 *
 * Stores score entries for a practice scope, keeps them sorted descending
 * (ties broken by earliest timestamp), supports top-N retrieval, rank, and
 * percentile queries. Pure-TS, no storage dependencies.
 */
/** A single leaderboard score entry. */
export interface LeaderboardEntry {
    /** Display name of the scorer. */
    readonly name: string;
    /** Numeric score (higher is better). */
    readonly score: number;
    /** Epoch milliseconds when the score was recorded. */
    readonly timestamp: number;
    /** Optional scope key (e.g. topic id or 'global'); undefined means unscoped. */
    readonly scope?: string;
}
/** Comparator: higher score first; ties broken by earlier timestamp. */
function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
    if (a.score !== b.score) {
        return b.score - a.score;
    }
    return a.timestamp - b.timestamp;
}
/** Maintains a bounded, sorted collection of leaderboard entries. */
export class LocalLeaderboard {
    private entries: LeaderboardEntry[];
    private readonly maxSize: number;
    /** Construct an empty leaderboard capped at `maxSize` entries (default 50). */
    public constructor(maxSize: number = 50) {
        this.entries = [];
        this.maxSize = Math.max(1, Math.floor(maxSize));
    }
    /** Add `entry` and re-sort. Returns the 1-based rank of the entry (ties share the better rank), or -1 when it did not make the cut (was dropped to enforce the cap). */
    public add(entry: LeaderboardEntry): number {
        this.entries.push(entry);
        this.entries.sort(compareEntries);
        if (this.entries.length > this.maxSize) {
            const dropped = this.entries.splice(this.maxSize);
            const wasDropped = dropped.some(e => e === entry);
            if (wasDropped) {
                return -1;
            }
        }
        return this.rankOfScore(entry.score);
    }
    /** Return the top `n` entries (1-based ordering; fewer when the board is smaller). */
    public top(n: number): LeaderboardEntry[] {
        const count = Math.max(0, Math.floor(n));
        return this.entries.slice(0, count);
    }
    /** Return all entries in rank order (a fresh copy). */
    public all(): LeaderboardEntry[] {
        return this.entries.slice();
    }
    /** Return the 1-based rank of the entry at `index`, or -1 when out of range. */
    public rankAtIndex(index: number): number {
        if (index < 0 || index >= this.entries.length) {
            return -1;
        }
        return index + 1;
    }
    /** Return the 1-based rank `score` would receive (1 = best). Returns 1 for an empty board. */
    public rankOfScore(score: number): number {
        let rank = 1;
        for (const e of this.entries) {
            if (e.score > score) {
                rank += 1;
            } else if (e.score === score) {
                // ties share the better rank; do not increment
            } else {
                break;
            }
        }
        return rank;
    }
    /** Return the percentile ([0,100]) of `score` (100 = best, beats everyone; 0 = worst). 100 for an empty board. */
    public percentile(score: number): number {
        if (this.entries.length === 0) {
            return 100;
        }
        let below = 0;
        for (const e of this.entries) {
            if (e.score < score) {
                below += 1;
            }
        }
        return (below / this.entries.length) * 100;
    }
    /** Return entries matching `scope` in rank order (a fresh array). */
    public forScope(scope: string): LeaderboardEntry[] {
        return this.entries.filter(e => e.scope === scope);
    }
    /** Return the number of stored entries. */
    public count(): number {
        return this.entries.length;
    }
    /** Return the configured maximum size. */
    public capacity(): number {
        return this.maxSize;
    }
    /** Remove all entries. */
    public clear(): void {
        this.entries = [];
    }
    /** Find the 1-based rank of a specific entry reference, or -1 when not present. */
    private rankOfIndex(target: LeaderboardEntry): number {
        const idx = this.entries.indexOf(target);
        return idx < 0 ? -1 : idx + 1;
    }
}
