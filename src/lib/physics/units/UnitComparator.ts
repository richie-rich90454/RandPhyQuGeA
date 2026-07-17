import {UnitRegistry} from "./UnitRegistry";
import type {DimensionVector, ResolvedUnit} from "./UnitRegistry";
/**
 * Unit-aware answer comparator.
 *
 * Parses a "value unit" string (e.g. "9.8 m/s", "980 cm/s", "5 km/h",
 * "1 kg·m/s^2"), resolves the compound unit into a scale factor and
 * dimension vector via {@link UnitRegistry}, and compares two answers by
 * converting both to SI base units. Two answers are equal when their
 * dimension vectors match and their SI-converted values agree within a
 * relative tolerance.
 */
export interface ParsedValueUnit {
    /** The leading numeric value. */
    value: number;
    /** Resolved scale factor to SI base units. */
    factor: number;
    /** Resolved dimension-vector exponents. */
    dimensions: DimensionVector;
    /** The SI-converted scalar (value * factor). */
    siValue: number;
}
/** Parses "value unit" strings, resolves compound units to SI base units, and compares two answers by dimension vector and SI-converted value within a relative tolerance. */
export class UnitComparator {
    private readonly registry: UnitRegistry;
    private readonly defaultTolerance: number;
    public constructor(registry?: UnitRegistry, defaultTolerance?: number) {
        this.registry = registry ?? UnitRegistry.createDefault();
        this.defaultTolerance = defaultTolerance ?? 1e-4;
    }
    /**
     * Parse a "value unit" string into a {@link ParsedValueUnit}. Returns
     * `null` when the value is missing/non-numeric or the unit cannot be
     * resolved. A bare number (no unit) parses with factor 1 and an empty
     * dimension vector.
     */
    public parse(input: string): ParsedValueUnit | null {
        const trimmed = input.trim();
        if (trimmed.length === 0) {
            return null;
        }
        const match = trimmed.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*(.*)$/);
        if (match === null) {
            return null;
        }
        const value = Number(match[1] ?? "");
        if (!Number.isFinite(value)) {
            return null;
        }
        const unitStr = (match[2] ?? "").trim();
        if (unitStr.length === 0) {
            return {value, factor: 1, dimensions: {}, siValue: value};
        }
        const resolved = this.resolveCompound(unitStr);
        if (resolved === null) {
            return null;
        }
        return {value, factor: resolved.factor, dimensions: resolved.dimensions, siValue: value * resolved.factor};
    }
    /**
     * Return `true` when `a` and `b` parse to the same dimension vector (so
     * they are interconvertible), regardless of their numeric values.
     */
    public areComparable(a: string, b: string): boolean {
        const pa = this.parse(a);
        const pb = this.parse(b);
        if (pa === null || pb === null) {
            return false;
        }
        return this.dimensionsEqual(pa.dimensions, pb.dimensions);
    }
    /**
     * Compare two "value unit" strings. Returns `true` when both parse, their
     * dimension vectors match, and their SI-converted values agree within
     * `tolerance` (relative, default 1e-4). When either side fails to parse,
     * falls back to exact trimmed string equality.
     */
    public compare(a: string, b: string, tolerance?: number): boolean {
        const pa = this.parse(a);
        const pb = this.parse(b);
        if (pa === null || pb === null) {
            return a.trim() === b.trim();
        }
        if (!this.dimensionsEqual(pa.dimensions, pb.dimensions)) {
            return false;
        }
        const tol = tolerance ?? this.defaultTolerance;
        if (pb.siValue === 0) {
            return Math.abs(pa.siValue) < 1e-9;
        }
        const relativeError = Math.abs(pa.siValue - pb.siValue) / Math.abs(pb.siValue);
        return relativeError < tol;
    }
    /** Resolve a compound unit string (e.g. "m/s^2", "kg·m/s^2", "km/h") into {factor, dimensions}. */
    public resolveCompound(unitStr: string): ResolvedUnit | null {
        const slashParts = unitStr.split("/");
        const numerator = slashParts[0] ?? "";
        const denominatorParts = slashParts.slice(1);
        let factor = 1;
        const dimensions: DimensionVector = {};
        const numResult = this.resolveTermGroup(numerator, 1);
        if (numResult === null) {
            return null;
        }
        factor *= numResult.factor;
        this.mergeDimensions(dimensions, numResult.dimensions, 1);
        for (const denom of denominatorParts) {
            const denomResult = this.resolveTermGroup(denom, -1);
            if (denomResult === null) {
                return null;
            }
            factor *= denomResult.factor;
            this.mergeDimensions(dimensions, denomResult.dimensions, 1);
        }
        return {factor, dimensions};
    }
    /** Resolve a group of "token^exp" terms (separated by ·, *, or whitespace) with a sign multiplier on the exponent. */
    private resolveTermGroup(group: string, sign: number): ResolvedUnit | null {
        const trimmed = group.trim();
        if (trimmed.length === 0) {
            return {factor: 1, dimensions: {}};
        }
        const terms = trimmed.split(/[·*]\s*|\s+/);
        let factor = 1;
        const dimensions: DimensionVector = {};
        for (const term of terms) {
            const t = term.trim();
            if (t.length === 0) {
                continue;
            }
            const caretIdx = t.indexOf("^");
            let symbol: string;
            let exp: number;
            if (caretIdx >= 0) {
                symbol = t.slice(0, caretIdx);
                exp = Number(t.slice(caretIdx + 1));
                if (!Number.isFinite(exp)) {
                    return null;
                }
            } else {
                symbol = t;
                exp = 1;
            }
            const resolved = this.registry.resolve(symbol);
            if (resolved === null) {
                return null;
            }
            factor *= Math.pow(resolved.factor, sign * exp);
            this.mergeDimensions(dimensions, resolved.dimensions, sign * exp);
        }
        return {factor, dimensions};
    }
    /** Merge `src` dimensions into `dest`, multiplying each exponent by `multiplier`. */
    private mergeDimensions(dest: DimensionVector, src: DimensionVector, multiplier: number): void {
        for (const key of Object.keys(src) as Array<keyof DimensionVector>) {
            const v = src[key];
            if (v === undefined) {
                continue;
            }
            const current = dest[key] ?? 0;
            const next = current + v * multiplier;
            if (next === 0) {
                delete dest[key];
            } else {
                dest[key] = next;
            }
        }
    }
    /** Return `true` when two dimension vectors have the same exponents for every dimension key. */
    private dimensionsEqual(a: DimensionVector, b: DimensionVector): boolean {
        const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
        for (const k of keys) {
            const ka = k as keyof DimensionVector;
            const av = a[ka] ?? 0;
            const bv = b[ka] ?? 0;
            if (av !== bv) {
                return false;
            }
        }
        return true;
    }
}
