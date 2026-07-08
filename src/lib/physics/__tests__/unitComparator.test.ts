import {describe, it, expect} from "vitest";
import {UnitRegistry} from "../units/UnitRegistry";
import {UnitComparator} from "../units/UnitComparator";
describe("UnitRegistry.resolve", () => {
    const reg = UnitRegistry.createDefault();
    it("resolves a base unit", () => {
        const r = reg.resolve("m");
        expect(r).not.toBeNull();
        expect(r?.factor).toBe(1);
        expect(r?.dimensions.L).toBe(1);
    });
    it("resolves a kilo-prefixed unit", () => {
        const r = reg.resolve("km");
        expect(r?.factor).toBe(1000);
        expect(r?.dimensions.L).toBe(1);
    });
    it("resolves a centi-prefixed unit", () => {
        const r = reg.resolve("cm");
        expect(r?.factor).toBe(0.01);
    });
    it("resolves kg directly as the SI base of mass", () => {
        const r = reg.resolve("kg");
        expect(r?.factor).toBe(1);
        expect(r?.dimensions.M).toBe(1);
    });
    it("resolves a milli-prefixed gram", () => {
        const r = reg.resolve("mg");
        expect(r?.factor).toBe(1e-6);
        expect(r?.dimensions.M).toBe(1);
    });
    it("resolves a milli-prefixed second", () => {
        const r = reg.resolve("ms");
        expect(r?.factor).toBe(1e-3);
        expect(r?.dimensions.T).toBe(1);
    });
    it("returns null for an unknown unit", () => {
        expect(reg.resolve("blarg")).toBeNull();
    });
    it("resolves a derived unit (newton)", () => {
        const r = reg.resolve("N");
        expect(r?.factor).toBe(1);
        expect(r?.dimensions.L).toBe(1);
        expect(r?.dimensions.M).toBe(1);
        expect(r?.dimensions.T).toBe(-2);
    });
});
describe("UnitComparator.parse", () => {
    const cmp = new UnitComparator();
    it("parses a value with a simple unit", () => {
        const p = cmp.parse("9.8 m/s");
        expect(p).not.toBeNull();
        expect(p?.value).toBe(9.8);
        expect(p?.factor).toBe(1);
        expect(p?.dimensions.L).toBe(1);
        expect(p?.dimensions.T).toBe(-1);
        expect(p?.siValue).toBe(9.8);
    });
    it("parses a value with a prefixed compound unit", () => {
        const p = cmp.parse("980 cm/s");
        expect(p?.value).toBe(980);
        expect(p?.factor).toBe(0.01);
        expect(p?.siValue).toBeCloseTo(9.8, 10);
    });
    it("parses a bare number as factor 1 with empty dimensions", () => {
        const p = cmp.parse("42");
        expect(p?.value).toBe(42);
        expect(p?.factor).toBe(1);
        expect(p?.siValue).toBe(42);
    });
    it("returns null for a non-numeric value", () => {
        expect(cmp.parse("hello m")).toBeNull();
    });
    it("returns null for an empty string", () => {
        expect(cmp.parse("")).toBeNull();
    });
});
describe("UnitComparator.compare", () => {
    const cmp = new UnitComparator();
    it("treats 9.8 m/s and 980 cm/s as equal", () => {
        expect(cmp.compare("9.8 m/s", "980 cm/s")).toBe(true);
    });
    it("treats 5 km and 5000 m as equal", () => {
        expect(cmp.compare("5 km", "5000 m")).toBe(true);
    });
    it("treats 1 kg and 1000 g as equal", () => {
        expect(cmp.compare("1 kg", "1000 g")).toBe(true);
    });
    it("treats 1 m/s^2 and 100 cm/s^2 as equal", () => {
        expect(cmp.compare("1 m/s^2", "100 cm/s^2")).toBe(true);
    });
    it("treats 10 N and 10 kg*m/s^2 as equal", () => {
        expect(cmp.compare("10 N", "10 kg*m/s^2")).toBe(true);
    });
    it("treats 10 N and 10 kg m/s^2 as equal (space separator)", () => {
        expect(cmp.compare("10 N", "10 kg m/s^2")).toBe(true);
    });
    it("treats 5 km/h and 1.389 m/s as equal within tolerance", () => {
        expect(cmp.compare("5 km/h", "1.389 m/s")).toBe(true);
    });
    it("rejects 10 N vs 10 J (different dimensions)", () => {
        expect(cmp.compare("10 N", "10 J")).toBe(false);
    });
    it("rejects 5 m vs 5 s (different dimensions)", () => {
        expect(cmp.compare("5 m", "5 s")).toBe(false);
    });
    it("accepts two bare equal numbers", () => {
        expect(cmp.compare("5", "5.0")).toBe(true);
    });
    it("falls back to exact string equality when parsing fails", () => {
        expect(cmp.compare("hello", "hello")).toBe(true);
        expect(cmp.compare("hello", "world")).toBe(false);
    });
});
describe("UnitComparator.areComparable", () => {
    const cmp = new UnitComparator();
    it("returns true for m/s and cm/s", () => {
        expect(cmp.areComparable("9.8 m/s", "980 cm/s")).toBe(true);
    });
    it("returns false for N and J", () => {
        expect(cmp.areComparable("10 N", "10 J")).toBe(false);
    });
});
