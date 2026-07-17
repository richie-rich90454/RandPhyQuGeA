import {describe, it, expect} from "vitest";
import {LocalLeaderboard} from "../gamification/LocalLeaderboard";
import type {LeaderboardEntry} from "../gamification/LocalLeaderboard";
function entry(name: string, score: number, timestamp: number, scope?: string): LeaderboardEntry {
    return {name, score, timestamp, scope};
}
describe("LocalLeaderboard.add and ordering", () => {
    it("sorts entries descending by score", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 10, 1));
        lb.add(entry("b", 50, 2));
        lb.add(entry("c", 30, 3));
        expect(lb.all().map(e => e.score)).toEqual([50, 30, 10]);
    });
    it("breaks score ties by earliest timestamp first", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("late", 50, 5));
        lb.add(entry("early", 50, 1));
        lb.add(entry("mid", 50, 3));
        expect(lb.all().map(e => e.name)).toEqual(["early", "mid", "late"]);
    });
    it("returns the 1-based rank of the added entry", () => {
        const lb = new LocalLeaderboard(10);
        expect(lb.add(entry("a", 10, 1))).toBe(1);
        expect(lb.add(entry("b", 50, 2))).toBe(1);
        expect(lb.add(entry("c", 30, 3))).toBe(2);
    });
});
describe("LocalLeaderboard capacity", () => {
    it("drops the lowest entry when over capacity and returns -1 for it", () => {
        const lb = new LocalLeaderboard(2);
        lb.add(entry("a", 10, 1));
        lb.add(entry("b", 20, 2));
        const rank = lb.add(entry("c", 5, 3));
        expect(rank).toBe(-1);
        expect(lb.count()).toBe(2);
        expect(lb.all().map(e => e.score)).toEqual([20, 10]);
    });
    it("keeps a higher score that displaces the lowest", () => {
        const lb = new LocalLeaderboard(2);
        lb.add(entry("a", 10, 1));
        lb.add(entry("b", 20, 2));
        expect(lb.add(entry("c", 25, 3))).toBe(1);
        expect(lb.all().map(e => e.score)).toEqual([25, 20]);
    });
    it("capacity returns the configured max", () => {
        expect(new LocalLeaderboard(7).capacity()).toBe(7);
    });
});
describe("LocalLeaderboard.top", () => {
    it("returns the top n entries", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 10, 1));
        lb.add(entry("b", 50, 2));
        lb.add(entry("c", 30, 3));
        expect(lb.top(2).map(e => e.score)).toEqual([50, 30]);
    });
    it("returns fewer when n exceeds the count", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 10, 1));
        expect(lb.top(5).length).toBe(1);
    });
    it("treats non-positive n as empty", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 10, 1));
        expect(lb.top(0)).toEqual([]);
        expect(lb.top(-1)).toEqual([]);
    });
});
describe("LocalLeaderboard.rankAtIndex", () => {
    it("returns 1-based rank for a valid index", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 10, 1));
        lb.add(entry("b", 50, 2));
        expect(lb.rankAtIndex(0)).toBe(1);
        expect(lb.rankAtIndex(1)).toBe(2);
    });
    it("returns -1 for an out-of-range index", () => {
        const lb = new LocalLeaderboard(10);
        expect(lb.rankAtIndex(0)).toBe(-1);
        lb.add(entry("a", 10, 1));
        expect(lb.rankAtIndex(5)).toBe(-1);
    });
});
describe("LocalLeaderboard.rankOfScore and percentile", () => {
    it("rankOfScore returns 1 for the best score on an empty board", () => {
        expect(new LocalLeaderboard(10).rankOfScore(999)).toBe(1);
    });
    it("rankOfScore places a new score correctly with ties sharing the better rank", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 50, 1));
        lb.add(entry("b", 30, 2));
        expect(lb.rankOfScore(60)).toBe(1);
        expect(lb.rankOfScore(50)).toBe(1);
        expect(lb.rankOfScore(40)).toBe(2);
        expect(lb.rankOfScore(30)).toBe(2);
        expect(lb.rankOfScore(10)).toBe(3);
    });
    it("percentile is 100 on an empty board", () => {
        expect(new LocalLeaderboard(10).percentile(0)).toBe(100);
    });
    it("percentile reflects the share of entries the score beats", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 10, 1));
        lb.add(entry("b", 20, 2));
        lb.add(entry("c", 30, 3));
        expect(lb.percentile(35)).toBe(100);
        expect(lb.percentile(25)).toBeCloseTo(66.66, 1);
        expect(lb.percentile(15)).toBeCloseTo(33.33, 1);
        expect(lb.percentile(5)).toBe(0);
    });
});
describe("LocalLeaderboard.forScope", () => {
    it("returns only entries matching the scope in rank order", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 10, 1, "mechanics"));
        lb.add(entry("b", 50, 2, "optics"));
        lb.add(entry("c", 30, 3, "mechanics"));
        expect(lb.forScope("mechanics").map(e => e.name)).toEqual(["c", "a"]);
    });
});
describe("LocalLeaderboard.clear / count", () => {
    it("clear removes all entries", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 10, 1));
        lb.add(entry("b", 20, 2));
        lb.clear();
        expect(lb.count()).toBe(0);
        expect(lb.all()).toEqual([]);
    });
});
describe("LocalLeaderboard.add tie-break (task 5.71)", () => {
    it("tied entries share the better rank", () => {
        const lb = new LocalLeaderboard(10);
        expect(lb.add(entry("a", 50, 1))).toBe(1);
        expect(lb.add(entry("b", 50, 2))).toBe(1);
    });
    it("the entry after a tie gets the correct skipping rank", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 50, 1));
        lb.add(entry("b", 50, 2));
        expect(lb.add(entry("c", 30, 3))).toBe(3);
    });
    it("three-way tie shares rank 1", () => {
        const lb = new LocalLeaderboard(10);
        expect(lb.add(entry("a", 50, 1))).toBe(1);
        expect(lb.add(entry("b", 50, 2))).toBe(1);
        expect(lb.add(entry("c", 50, 3))).toBe(1);
    });
    it("non-tied entries still get sequential ranks", () => {
        const lb = new LocalLeaderboard(10);
        expect(lb.add(entry("a", 50, 1))).toBe(1);
        expect(lb.add(entry("b", 30, 2))).toBe(2);
        expect(lb.add(entry("c", 10, 3))).toBe(3);
    });
    it("tie at a lower score shares the correct rank", () => {
        const lb = new LocalLeaderboard(10);
        lb.add(entry("a", 100, 1));
        lb.add(entry("b", 50, 2));
        expect(lb.add(entry("c", 50, 3))).toBe(2);
        expect(lb.add(entry("d", 30, 4))).toBe(4);
    });
});
