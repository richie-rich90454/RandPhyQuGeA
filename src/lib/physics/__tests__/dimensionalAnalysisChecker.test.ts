import {describe, it, expect} from "vitest";
import {DimensionalAnalysisChecker} from "../units/DimensionalAnalysisChecker";
describe("DimensionalAnalysisChecker.dimensionsOf", () => {
    const checker = new DimensionalAnalysisChecker();
    it("resolves m/s to {L:1, T:-1}", () => {
        const d = checker.dimensionsOf("m/s");
        expect(d?.L).toBe(1);
        expect(d?.T).toBe(-1);
    });
    it("resolves kg*m/s^2 to {L:1, M:1, T:-2}", () => {
        const d = checker.dimensionsOf("kg*m/s^2");
        expect(d?.L).toBe(1);
        expect(d?.M).toBe(1);
        expect(d?.T).toBe(-2);
    });
    it("returns null for an unresolvable unit", () => {
        expect(checker.dimensionsOf("blarg")).toBeNull();
    });
});
describe("DimensionalAnalysisChecker.areSameDimension", () => {
    const checker = new DimensionalAnalysisChecker();
    it("returns true for N and kg*m/s^2", () => {
        expect(checker.areSameDimension("N", "kg*m/s^2")).toBe(true);
    });
    it("returns true for J and kg*m^2/s^2", () => {
        expect(checker.areSameDimension("J", "kg*m^2/s^2")).toBe(true);
    });
    it("returns false for N and J", () => {
        expect(checker.areSameDimension("N", "J")).toBe(false);
    });
    it("returns false when one side is unresolvable", () => {
        expect(checker.areSameDimension("N", "blarg")).toBe(false);
    });
});
describe("DimensionalAnalysisChecker.checkConsistency", () => {
    const checker = new DimensionalAnalysisChecker();
    it("marks a consistent equation as consistent", () => {
        const result = checker.checkConsistency("N", "kg*m/s^2");
        expect(result.consistent).toBe(true);
        expect(result.lhs?.L).toBe(1);
        expect(result.rhs?.L).toBe(1);
    });
    it("marks an inconsistent equation as inconsistent", () => {
        const result = checker.checkConsistency("N", "J");
        expect(result.consistent).toBe(false);
    });
    it("reports a message when the left side is unresolvable", () => {
        const result = checker.checkConsistency("blarg", "N");
        expect(result.consistent).toBe(false);
        expect(result.message).toContain("Left-hand side");
    });
    it("reports a message when both sides are unresolvable", () => {
        const result = checker.checkConsistency("blarg", "blarg");
        expect(result.consistent).toBe(false);
        expect(result.message).toContain("Both sides");
    });
});
describe("DimensionalAnalysisChecker.checkEquation", () => {
    const checker = new DimensionalAnalysisChecker();
    it("checks F = kg*m/s^2 as consistent", () => {
        expect(checker.checkEquation("N = kg*m/s^2").consistent).toBe(true);
    });
    it("checks N = J as inconsistent", () => {
        expect(checker.checkEquation("N = J").consistent).toBe(false);
    });
    it("returns inconsistent for an equation without an = sign", () => {
        const result = checker.checkEquation("N kg*m/s^2");
        expect(result.consistent).toBe(false);
        expect(result.message).toContain("exactly one");
    });
});
describe("DimensionalAnalysisChecker.hasDimension", () => {
    const checker = new DimensionalAnalysisChecker();
    it("confirms 9.8 m/s has dimension {L:1, T:-1}", () => {
        expect(checker.hasDimension("9.8 m/s", {L: 1, T: -1})).toBe(true);
    });
    it("rejects 9.8 m/s for dimension {L:1}", () => {
        expect(checker.hasDimension("9.8 m/s", {L: 1})).toBe(false);
    });
    it("returns false for an unparseable value", () => {
        expect(checker.hasDimension("hello", {L: 1})).toBe(false);
    });
});
