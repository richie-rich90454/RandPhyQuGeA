import {describe, it, expect} from "vitest";
import {AdaptiveDifficulty} from "../adaptive/AdaptiveDifficulty";
describe("AdaptiveDifficulty.construct", () => {
    it("defaults to difficulty 1 with a 5-result window", () => {
        const a = new AdaptiveDifficulty();
        expect(a.current()).toBe(1);
        expect(a.windowSize()).toBe(5);
    });
    it("clamps the initial difficulty to the configured range", () => {
        const a = new AdaptiveDifficulty(99, {min: 1, max: 5});
        expect(a.current()).toBe(5);
    });
    it("clamps a below-range initial difficulty", () => {
        const a = new AdaptiveDifficulty(-3, {min: 1, max: 5});
        expect(a.current()).toBe(1);
    });
});
describe("AdaptiveDifficulty.record", () => {
    it("does not change difficulty before the window is full", () => {
        const a = new AdaptiveDifficulty(3, {windowSize: 5, upThreshold: 0.8, downThreshold: 0.5, step: 1, min: 1, max: 5});
        a.record(true);
        a.record(true);
        expect(a.current()).toBe(3);
    });
    it("increases difficulty when accuracy meets the up threshold", () => {
        const a = new AdaptiveDifficulty(2, {windowSize: 5, upThreshold: 0.8, downThreshold: 0.5, step: 1, min: 1, max: 5});
        for (let i = 0; i < 5; i++) {
            a.record(true);
        }
        expect(a.current()).toBe(3);
    });
    it("decreases difficulty when accuracy is at or below the down threshold", () => {
        const a = new AdaptiveDifficulty(3, {windowSize: 5, upThreshold: 0.8, downThreshold: 0.5, step: 1, min: 1, max: 5});
        for (let i = 0; i < 5; i++) {
            a.record(false);
        }
        expect(a.current()).toBe(2);
    });
    it("holds difficulty when accuracy is between thresholds", () => {
        const a = new AdaptiveDifficulty(3, {windowSize: 3, upThreshold: 0.8, downThreshold: 0.5, step: 1, min: 1, max: 5});
        a.record(true);
        a.record(true);
        a.record(false);
        expect(a.accuracy()).toBeCloseTo(2 / 3, 5);
        expect(a.current()).toBe(3);
    });
    it("caps difficulty at the configured max", () => {
        const a = new AdaptiveDifficulty(4, {windowSize: 2, upThreshold: 0.8, downThreshold: 0.5, step: 1, min: 1, max: 5});
        a.record(true);
        a.record(true);
        expect(a.current()).toBe(5);
        a.record(true);
        a.record(true);
        expect(a.current()).toBe(5);
    });
    it("floors difficulty at the configured min", () => {
        const a = new AdaptiveDifficulty(2, {windowSize: 2, upThreshold: 0.8, downThreshold: 0.5, step: 1, min: 1, max: 5});
        a.record(false);
        a.record(false);
        expect(a.current()).toBe(1);
        a.record(false);
        a.record(false);
        expect(a.current()).toBe(1);
    });
    it("slides the window, dropping the oldest result", () => {
        const a = new AdaptiveDifficulty(3, {windowSize: 2, upThreshold: 1, downThreshold: 0, step: 1, min: 1, max: 5});
        a.record(false);
        a.record(false);
        expect(a.current()).toBe(2);
        a.record(true);
        a.record(true);
        expect(a.accuracy()).toBe(1);
        expect(a.current()).toBe(3);
    });
});
describe("AdaptiveDifficulty.accuracy", () => {
    it("returns 0 for an empty window", () => {
        const a = new AdaptiveDifficulty();
        expect(a.accuracy()).toBe(0);
    });
    it("computes accuracy over the current window", () => {
        const a = new AdaptiveDifficulty(1, {windowSize: 4});
        a.record(true);
        a.record(false);
        a.record(true);
        a.record(true);
        expect(a.accuracy()).toBeCloseTo(0.75, 5);
    });
});
describe("AdaptiveDifficulty.reset", () => {
    it("resets difficulty and clears the window", () => {
        const a = new AdaptiveDifficulty(3, {windowSize: 2});
        a.record(true);
        a.record(true);
        a.reset(2);
        expect(a.current()).toBe(2);
        expect(a.windowCount()).toBe(0);
        expect(a.accuracy()).toBe(0);
    });
    it("defaults to the minimum when no value is given", () => {
        const a = new AdaptiveDifficulty(4, {min: 1, max: 5});
        a.reset();
        expect(a.current()).toBe(1);
    });
});
