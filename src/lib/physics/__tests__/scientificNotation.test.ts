import {describe, it, expect} from "vitest";
import {ScientificNotation} from "../format/ScientificNotation";
describe("ScientificNotation.format", () => {
    const sn = new ScientificNotation();
    it("formats a small number into plain e notation", () => {
        expect(sn.format(0.00006674)).toBe("6.674e-5");
    });
    it("formats a large number into plain e notation", () => {
        expect(sn.format(299792458)).toBe("2.99792458e8");
    });
    it("respects a sigFigs argument", () => {
        expect(sn.format(299792458, 3)).toBe("3.00e8");
    });
    it("renders zero as 0e0", () => {
        expect(sn.format(0)).toBe("0e0");
    });
    it("renders NaN as NaN", () => {
        expect(sn.format(Number.NaN)).toBe("NaN");
    });
    it("preserves the sign of negative values", () => {
        expect(sn.format(-0.00006674)).toBe("-6.674e-5");
    });
});
describe("ScientificNotation.toLatex", () => {
    const sn = new ScientificNotation();
    it("produces LaTeX for a small value", () => {
        expect(sn.toLatex(0.00006674)).toBe("{6.674 \\times 10^{-5}}");
    });
    it("produces LaTeX for a value with explicit sig figs", () => {
        expect(sn.toLatex(6.674e-11, 3)).toBe("{6.67 \\times 10^{-11}}");
    });
    it("renders zero as a plain 0", () => {
        expect(sn.toLatex(0)).toBe("0");
    });
    it("renders a positive exponent without a leading + sign", () => {
        expect(sn.toLatex(12345, 3)).toBe("{1.23 \\times 10^{4}}");
    });
});
describe("ScientificNotation.parse", () => {
    const sn = new ScientificNotation();
    it("parses a plain e-notation string", () => {
        const result = sn.parse("6.674e-5");
        expect(result).not.toBeNull();
        expect(result?.mantissa).toBe(6.674);
        expect(result?.exponent).toBe(-5);
        expect(result?.value).toBeCloseTo(0.00006674, 10);
    });
    it("parses an E-notation string", () => {
        const result = sn.parse("2.998E8");
        expect(result).not.toBeNull();
        expect(result?.mantissa).toBe(2.998);
        expect(result?.exponent).toBe(8);
        expect(result?.value).toBe(299800000);
    });
    it("parses a LaTeX times-10 string", () => {
        const result = sn.parse("{6.674 \\times 10^{-5}}");
        expect(result).not.toBeNull();
        expect(result?.mantissa).toBe(6.674);
        expect(result?.exponent).toBe(-5);
    });
    it("parses a star-10 string", () => {
        const result = sn.parse("1.5 * 10^3");
        expect(result).not.toBeNull();
        expect(result?.value).toBe(1500);
    });
    it("returns null for a plain number without an exponent", () => {
        expect(sn.parse("100")).toBeNull();
    });
    it("returns null for an empty string", () => {
        expect(sn.parse("")).toBeNull();
    });
    it("returns null for non-numeric input", () => {
        expect(sn.parse("hello")).toBeNull();
    });
});
describe("ScientificNotation.isScientificNotation", () => {
    const sn = new ScientificNotation();
    it("returns true for e-notation", () => {
        expect(sn.isScientificNotation("6.674e-5")).toBe(true);
    });
    it("returns true for LaTeX notation", () => {
        expect(sn.isScientificNotation("6.674 \\times 10^{-5}")).toBe(true);
    });
    it("returns false for a plain integer", () => {
        expect(sn.isScientificNotation("100")).toBe(false);
    });
});
describe("ScientificNotation.fromPlain", () => {
    const sn = new ScientificNotation();
    it("converts a plain numeric string to scientific notation", () => {
        expect(sn.fromPlain("0.00006674")).toBe("6.674e-5");
    });
    it("returns the input unchanged for non-numeric strings", () => {
        expect(sn.fromPlain("hello")).toBe("hello");
    });
    it("round-trips through parse", () => {
        const formatted = sn.fromPlain("299792458", 4);
        const parsed = sn.parse(formatted);
        expect(parsed).not.toBeNull();
        expect(parsed?.mantissa).toBe(2.998);
        expect(parsed?.exponent).toBe(8);
    });
});
