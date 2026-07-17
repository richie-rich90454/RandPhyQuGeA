import {describe, it, expect} from "vitest";
import {SigFigFormatter, formatSigFigs} from "../format/SigFigFormatter";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
describe("SigFigFormatter.format", () => {
    const f = new SigFigFormatter();
    it("formats 1.2 to 3 significant figures as 1.20", () => {
        expect(f.format(1.2, 3)).toBe("1.20");
    });
    it("formats 1234 to 2 significant figures as 1200", () => {
        expect(f.format(1234, 2)).toBe("1200");
    });
    it("formats 0.0050 to 1 significant figure as 0.005", () => {
        expect(f.format(0.005, 1)).toBe("0.005");
    });
    it("formats 0.0050 to 2 significant figures as 0.0050", () => {
        expect(f.format(0.005, 2)).toBe("0.0050");
    });
    it("formats 0 to 3 significant figures as 0.00", () => {
        expect(f.format(0, 3)).toBe("0.00");
    });
    it("formats 0 to 1 significant figure as 0", () => {
        expect(f.format(0, 1)).toBe("0");
    });
    it("preserves the sign of negative values", () => {
        expect(f.format(-1.2, 3)).toBe("-1.20");
    });
    it("expands exponential notation for very small values", () => {
        expect(f.format(6.674e-11, 3)).toBe("0.0000000000667");
    });
    it("returns String for non-finite values", () => {
        expect(f.format(Number.NaN, 3)).toBe("NaN");
        expect(f.format(Number.POSITIVE_INFINITY, 3)).toBe("Infinity");
    });
    it("returns String when sigFigs is non-positive", () => {
        expect(f.format(1.2, 0)).toBe("1.2");
        expect(f.format(1.2, -1)).toBe("1.2");
    });
    it("formats a large value to 4 significant figures", () => {
        expect(f.format(299792458, 4)).toBe("299800000");
    });
});
describe("SigFigFormatter.count", () => {
    const f = new SigFigFormatter();
    it("counts 1.20 as 3 significant figures", () => {
        expect(f.count("1.20")).toBe(3);
    });
    it("counts 0.0050 as 2 significant figures", () => {
        expect(f.count("0.0050")).toBe(2);
    });
    it("counts 1200 (no decimal) as 2 significant figures", () => {
        expect(f.count("1200")).toBe(2);
    });
    it("counts 1200. (with decimal) as 4 significant figures", () => {
        expect(f.count("1200.")).toBe(4);
    });
    it("counts 1000 as 1 significant figure", () => {
        expect(f.count("1000")).toBe(1);
    });
    it("counts 0 as 1 significant figure", () => {
        expect(f.count("0")).toBe(1);
    });
    it("counts 0.00 as 2 significant figures", () => {
        expect(f.count("0.00")).toBe(2);
    });
    it("counts 1.20e3 as 3 significant figures", () => {
        expect(f.count("1.20e3")).toBe(3);
    });
    it("returns 0 for a non-numeric string", () => {
        expect(f.count("hello")).toBe(0);
        expect(f.count("")).toBe(0);
    });
    it("handles a leading + sign", () => {
        expect(f.count("+1.20")).toBe(3);
    });
});
describe("SigFigFormatter.detect", () => {
    const f = new SigFigFormatter();
    it("returns the count for a numeric string", () => {
        expect(f.detect("1.20")).toBe(3);
    });
    it("returns null for a non-numeric string", () => {
        expect(f.detect("hello")).toBeNull();
    });
});
describe("formatSigFigs convenience function", () => {
    it("formats via a shared instance", () => {
        expect(formatSigFigs(1.2, 3)).toBe("1.20");
        expect(formatSigFigs(0, 3)).toBe("0.00");
    });
});
describe("ExpressionEvaluator.formatNumeric sig-figs opt-in", () => {
    const evaluator = new ExpressionEvaluator();
    it("preserves trailing significant zeros when sigFigs is supplied", () => {
        expect(evaluator.formatNumeric(1.2, 3)).toBe("1.20");
    });
    it("formats zero to the requested sig figs", () => {
        expect(evaluator.formatNumeric(0, 3)).toBe("0.00");
    });
    it("falls back to the default behavior when sigFigs is omitted", () => {
        expect(evaluator.formatNumeric(1.2)).toBe("1.2");
        expect(evaluator.formatNumeric(5)).toBe("5");
    });
    it("falls back to the default behavior when sigFigs is non-positive", () => {
        expect(evaluator.formatNumeric(1.2, 0)).toBe("1.2");
    });
});
