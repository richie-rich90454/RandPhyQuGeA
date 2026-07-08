import {describe, it, expect} from "vitest";
import {HintGenerator} from "../hints/HintGenerator";
describe("HintGenerator.generate", () => {
    const gen = new HintGenerator();
    it("returns an empty list for an empty context", () => {
        expect(gen.generate({})).toEqual([]);
    });
    it("produces a formula hint from a formula name", () => {
        const hints = gen.generate({formulaName: "Newton's Second Law"});
        expect(hints.length).toBe(1);
        expect(hints[0]?.kind).toBe("formula");
        expect(hints[0]?.text).toContain("Newton's Second Law");
        expect(hints[0]?.level).toBe(1);
    });
    it("falls back to formula latex when no name is given", () => {
        const hints = gen.generate({formulaLatex: "F = m a"});
        expect(hints[0]?.kind).toBe("formula");
        expect(hints[0]?.text).toContain("F = m a");
    });
    it("prefers the formula name over the latex", () => {
        const hints = gen.generate({formulaName: "Weight", formulaLatex: "W = m g"});
        expect(hints.length).toBe(1);
        expect(hints[0]?.text).toContain("Weight");
    });
    it("includes a variables hint when variables are present", () => {
        const hints = gen.generate({formulaName: "F", variables: {m: 5, a: 2}});
        expect(hints.length).toBe(2);
        expect(hints[1]?.kind).toBe("variables");
        expect(hints[1]?.text).toContain("m = 5");
        expect(hints[1]?.text).toContain("a = 2");
    });
    it("omits the variables hint when the variables map is empty", () => {
        const hints = gen.generate({formulaName: "F", variables: {}});
        expect(hints.length).toBe(1);
    });
    it("includes a step hint per solution step", () => {
        const hints = gen.generate({solutionSteps: ["step one", "step two"]});
        expect(hints.length).toBe(2);
        expect(hints[0]?.kind).toBe("step");
        expect(hints[0]?.text).toBe("step one");
        expect(hints[1]?.text).toBe("step two");
    });
    it("includes a unit hint and an answer hint in order", () => {
        const hints = gen.generate({answerUnits: "m/s", correctAnswer: "5"});
        expect(hints[0]?.kind).toBe("unit");
        expect(hints[1]?.kind).toBe("answer");
        expect(hints[1]?.text).toContain("5");
    });
    it("assigns strictly increasing levels across kinds", () => {
        const hints = gen.generate({formulaName: "F", variables: {m: 1}, solutionSteps: ["s1"], answerUnits: "N", correctAnswer: "1"});
        const levels = hints.map(h => h.level);
        for (let i = 1; i < levels.length; i++) {
            expect(levels[i]).toBeGreaterThan(levels[i - 1] ?? 0);
        }
    });
    it("caps hints at maxLevel", () => {
        const hints = gen.generate({formulaName: "F", variables: {m: 1}, correctAnswer: "1"}, 1);
        expect(hints.length).toBe(1);
        expect(hints[0]?.level).toBe(1);
    });
});
describe("HintGenerator.nextHint", () => {
    const gen = new HintGenerator();
    const ctx = {formulaName: "F", variables: {m: 1}, correctAnswer: "1"};
    it("returns the first hint when nothing is revealed", () => {
        const hint = gen.nextHint(ctx, []);
        expect(hint?.level).toBe(1);
        expect(hint?.kind).toBe("formula");
    });
    it("returns the next hint after the revealed level", () => {
        const hint = gen.nextHint(ctx, [1]);
        expect(hint?.level).toBe(2);
        expect(hint?.kind).toBe("variables");
    });
    it("returns null when all hints are revealed", () => {
        expect(gen.nextHint(ctx, [1, 2, 3])).toBeNull();
    });
});
describe("HintGenerator.hasMoreHints", () => {
    const gen = new HintGenerator();
    const ctx = {formulaName: "F", correctAnswer: "1"};
    it("returns true when hints remain", () => {
        expect(gen.hasMoreHints(ctx, [])).toBe(true);
    });
    it("returns false when all hints are revealed", () => {
        expect(gen.hasMoreHints(ctx, [1, 2])).toBe(false);
    });
});
