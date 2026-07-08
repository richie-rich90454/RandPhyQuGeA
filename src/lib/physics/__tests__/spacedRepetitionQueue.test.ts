import {describe, it, expect} from "vitest";
import {SpacedRepetitionQueue} from "../spaced/SpacedRepetitionQueue";
describe("SpacedRepetitionQueue.register", () => {
    it("registers an item with default values due now", () => {
        const q = new SpacedRepetitionQueue();
        const item = q.register("kinematics", 1000);
        expect(item.key).toBe("kinematics");
        expect(item.repetitions).toBe(0);
        expect(item.interval).toBe(1);
        expect(item.ease).toBe(2.5);
        expect(item.due).toBe(1000);
    });
    it("get returns the registered item", () => {
        const q = new SpacedRepetitionQueue();
        q.register("dynamics", 100);
        expect(q.get("dynamics")?.key).toBe("dynamics");
    });
    it("get returns undefined for an unknown key", () => {
        const q = new SpacedRepetitionQueue();
        expect(q.get("nope")).toBeUndefined();
    });
    it("size reflects registered items", () => {
        const q = new SpacedRepetitionQueue();
        q.register("a");
        q.register("b");
        expect(q.size()).toBe(2);
    });
});
describe("SpacedRepetitionQueue.review", () => {
    it("first successful review (quality 5) sets reps=1, interval=1, due=now+1day", () => {
        const q = new SpacedRepetitionQueue(1000);
        const result = q.review("t1", 5, 100);
        expect(result.success).toBe(true);
        expect(result.item.repetitions).toBe(1);
        expect(result.interval).toBe(1);
        expect(result.item.due).toBe(100 + 1000);
    });
    it("second successful review sets interval=6", () => {
        const q = new SpacedRepetitionQueue(1000);
        q.review("t1", 5, 100);
        const result = q.review("t1", 5, 200);
        expect(result.item.repetitions).toBe(2);
        expect(result.interval).toBe(6);
        expect(result.item.due).toBe(200 + 6 * 1000);
    });
    it("third successful review multiplies interval by ease", () => {
        const q = new SpacedRepetitionQueue(1000);
        q.review("t1", 5, 100);
        q.review("t1", 5, 200);
        const beforeThird = q.get("t1");
        const beforeInterval = beforeThird?.interval ?? 1;
        const beforeEase = beforeThird?.ease ?? 2.5;
        const result = q.review("t1", 5, 300);
        expect(result.item.repetitions).toBe(3);
        expect(result.interval).toBe(Math.round(beforeInterval * beforeEase));
    });
    it("failed review (quality 2) resets reps to 0 and interval to 1", () => {
        const q = new SpacedRepetitionQueue(1000);
        q.review("t1", 5, 100);
        q.review("t1", 5, 200);
        const result = q.review("t1", 2, 300);
        expect(result.success).toBe(false);
        expect(result.item.repetitions).toBe(0);
        expect(result.interval).toBe(1);
    });
    it("ease increases on quality 5", () => {
        const q = new SpacedRepetitionQueue(1000);
        const before = q.get("t1")?.ease ?? 2.5;
        q.register("t1", 100);
        q.review("t1", 5, 100);
        expect(q.get("t1")?.ease).toBeGreaterThan(before);
    });
    it("ease never drops below 1.3", () => {
        const q = new SpacedRepetitionQueue(1000);
        q.register("t1", 100);
        for (let i = 0; i < 20; i++) {
            q.review("t1", 0, 100 + i);
        }
        expect(q.get("t1")?.ease).toBeGreaterThanOrEqual(1.3);
    });
    it("clamps quality above 5 to 5", () => {
        const q = new SpacedRepetitionQueue(1000);
        const result = q.review("t1", 99, 100);
        expect(result.success).toBe(true);
        expect(result.item.lastQuality).toBe(5);
    });
    it("clamps quality below 0 to 0", () => {
        const q = new SpacedRepetitionQueue(1000);
        const result = q.review("t1", -7, 100);
        expect(result.success).toBe(false);
        expect(result.item.lastQuality).toBe(0);
    });
    it("registers an unknown item on review", () => {
        const q = new SpacedRepetitionQueue(1000);
        const result = q.review("auto", 5, 100);
        expect(q.get("auto")).toBeDefined();
        expect(result.item.key).toBe("auto");
    });
});
describe("SpacedRepetitionQueue.getDue", () => {
    it("returns only items due at or before now, sorted ascending", () => {
        const q = new SpacedRepetitionQueue(1000);
        q.register("a", 0);
        q.register("b", 0);
        q.register("c", 0);
        q.review("a", 5, 0);
        q.review("b", 4, 10);
        q.review("c", 5, 5);
        const due = q.getDue(2000);
        const keys = due.map(i => i.key);
        expect(keys).toContain("a");
        expect(keys).toContain("c");
        expect(keys).toContain("b");
        const aIdx = keys.indexOf("a");
        const cIdx = keys.indexOf("c");
        const bIdx = keys.indexOf("b");
        expect(aIdx).toBeLessThanOrEqual(cIdx);
        expect(cIdx).toBeLessThanOrEqual(bIdx);
    });
    it("returns empty when nothing is due", () => {
        const q = new SpacedRepetitionQueue(1000);
        q.register("a", 1000);
        q.review("a", 5, 1000);
        expect(q.getDue(500)).toEqual([]);
    });
});
describe("SpacedRepetitionQueue.remove", () => {
    it("removes an item and returns true", () => {
        const q = new SpacedRepetitionQueue();
        q.register("a");
        expect(q.remove("a")).toBe(true);
        expect(q.get("a")).toBeUndefined();
    });
    it("returns false for an unknown key", () => {
        const q = new SpacedRepetitionQueue();
        expect(q.remove("nope")).toBe(false);
    });
});
describe("SpacedRepetitionQueue.stats", () => {
    it("reports total, due, and learned counts", () => {
        const q = new SpacedRepetitionQueue(1000);
        q.register("a", 0);
        q.register("b", 0);
        q.register("c", 0);
        q.review("a", 5, 0);
        q.review("b", 2, 0);
        const stats = q.stats(2000);
        expect(stats.total).toBe(3);
        expect(stats.learned).toBe(1);
        expect(stats.due).toBe(3);
    });
});
