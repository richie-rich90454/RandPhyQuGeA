import {describe, it, expect} from "vitest";
import {UnitConverter} from "../units/UnitConverter";
describe("UnitConverter.convert", () => {
    const conv = new UnitConverter();
    it("converts 5 km to 5000 m", () => {
        expect(conv.convert(5, "km", "m")).toBe(5000);
    });
    it("converts 1000 g to 1 kg", () => {
        expect(conv.convert(1000, "g", "kg")).toBe(1);
    });
    it("converts 9.8 m/s to 980 cm/s", () => {
        expect(conv.convert(9.8, "m/s", "cm/s")).toBeCloseTo(980, 10);
    });
    it("converts 1 m/s^2 to 100 cm/s^2", () => {
        expect(conv.convert(1, "m/s^2", "cm/s^2")).toBeCloseTo(100, 10);
    });
    it("converts 1 hour to 3600 seconds", () => {
        expect(conv.convert(1, "h", "s")).toBe(3600);
    });
    it("returns null for mismatched dimensions", () => {
        expect(conv.convert(5, "m", "s")).toBeNull();
    });
    it("returns null for an unknown source unit", () => {
        expect(conv.convert(5, "blarg", "m")).toBeNull();
    });
    it("returns null for an unknown target unit", () => {
        expect(conv.convert(5, "m", "blarg")).toBeNull();
    });
});
describe("UnitConverter.convertString", () => {
    const conv = new UnitConverter();
    it("converts '5 km' to meters", () => {
        expect(conv.convertString("5 km", "m")).toBe("5000 m");
    });
    it("converts '9.8 m/s' to cm/s", () => {
        expect(conv.convertString("9.8 m/s", "cm/s")).toBe("980 cm/s");
    });
    it("returns null for an unparseable input", () => {
        expect(conv.convertString("hello", "m")).toBeNull();
    });
    it("returns null for mismatched dimensions", () => {
        expect(conv.convertString("5 m", "s")).toBeNull();
    });
    it("preserves a trailing unit string in the output", () => {
        expect(conv.convertString("2 h", "s")).toBe("7200 s");
    });
});
describe("UnitConverter.listConvertible", () => {
    const conv = new UnitConverter();
    it("lists s alongside other time units (min, h, day)", () => {
        const list = conv.listConvertible("s");
        expect(list).toContain("s");
        expect(list).toContain("min");
        expect(list).toContain("h");
        expect(list).toContain("day");
    });
    it("does not list meters for a time unit", () => {
        const list = conv.listConvertible("s");
        expect(list).not.toContain("m");
    });
    it("lists m for a length unit but not seconds", () => {
        const list = conv.listConvertible("m");
        expect(list).toContain("m");
        expect(list).not.toContain("s");
    });
    it("returns an empty list for an unknown unit", () => {
        expect(conv.listConvertible("blarg")).toEqual([]);
    });
});
