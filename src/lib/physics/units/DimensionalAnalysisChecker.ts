import {UnitComparator} from "./UnitComparator";
import type {DimensionVector} from "./UnitRegistry";
/**
 * Dimensional-analysis checker.
 *
 * Validates the dimensional consistency of a physics equation or expression
 * by resolving each side's compound unit (e.g. "kg*m/s^2") into a dimension
 * vector via {@link UnitComparator} and comparing the exponents. Used to
 * sanity-check student answers and template answer expressions against the
 * expected dimension before numeric grading.
 */
export interface DimensionalResult {
    /** Whether the two sides have the same dimension vector. */
    consistent: boolean;
    /** Dimension vector of the left-hand side (null when unresolvable). */
    lhs: DimensionVector | null;
    /** Dimension vector of the right-hand side (null when unresolvable). */
    rhs: DimensionVector | null;
    /** Human-readable explanation of the result. */
    message: string;
}
/** Validates dimensional consistency of equations by resolving each side's compound unit into a dimension vector and comparing exponents. */
export class DimensionalAnalysisChecker {
    private readonly comparator: UnitComparator;
    public constructor(comparator?: UnitComparator) {
        this.comparator = comparator ?? new UnitComparator();
    }
    /** Resolve a compound unit expression (e.g. "kg*m/s^2") into its dimension vector, or null when unresolvable. */
    public dimensionsOf(unitExpression: string): DimensionVector | null {
        const resolved = this.comparator.resolveCompound(unitExpression);
        return resolved === null ? null : resolved.dimensions;
    }
    /** Return `true` when `a` and `b` resolve to the same dimension vector. */
    public areSameDimension(a: string, b: string): boolean {
        const da = this.dimensionsOf(a);
        const db = this.dimensionsOf(b);
        if (da === null || db === null) {
            return false;
        }
        return this.vectorsEqual(da, db);
    }
    /** Check the dimensional consistency of two unit expressions. */
    public checkConsistency(lhs: string, rhs: string): DimensionalResult {
        const dl = this.dimensionsOf(lhs);
        const dr = this.dimensionsOf(rhs);
        if (dl === null && dr === null) {
            return {consistent: false, lhs: null, rhs: null, message: "Both sides have unresolvable units."};
        }
        if (dl === null) {
            return {consistent: false, lhs: null, rhs: dr, message: "Left-hand side has unresolvable units."};
        }
        if (dr === null) {
            return {consistent: false, lhs: dl, rhs: null, message: "Right-hand side has unresolvable units."};
        }
        const equal = this.vectorsEqual(dl, dr);
        return {
            consistent: equal,
            lhs: dl,
            rhs: dr,
            message: equal ? "Dimensions match." : "Dimensions do not match.",
        };
    }
    /** Check the dimensional consistency of an equation split on '='. Returns inconsistent when no '=' is present. */
    public checkEquation(equation: string): DimensionalResult {
        const parts = equation.split("=");
        if (parts.length !== 2) {
            return {consistent: false, lhs: null, rhs: null, message: "Equation must contain exactly one '=' sign."};
        }
        const lhs = (parts[0] ?? "").trim();
        const rhs = (parts[1] ?? "").trim();
        return this.checkConsistency(lhs, rhs);
    }
    /** Return `true` when a "value unit" string has the expected dimension vector. */
    public hasDimension(value: string, expected: DimensionVector): boolean {
        const parsed = this.comparator.parse(value);
        if (parsed === null) {
            return false;
        }
        return this.vectorsEqual(parsed.dimensions, expected);
    }
    /** Return `true` when two dimension vectors have the same exponents for every dimension key. */
    private vectorsEqual(a: DimensionVector, b: DimensionVector): boolean {
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
