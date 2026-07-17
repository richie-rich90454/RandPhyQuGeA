/**
 * Significant-figures formatter.
 *
 * Formats a numeric value to a requested count of significant figures and
 * counts/detects the significant figures present in a numeric string. Used by
 * the expression evaluator (opt-in) and by numeric distractor generation so
 * that trailing significant zeros are preserved (e.g. an answer of "1.20"
 * stays at 3 significant figures rather than collapsing to "1.2").
 */
export class SigFigFormatter {
    /**
     * Format `value` to exactly `sigFigs` significant figures, returning a
     * plain decimal string (exponential notation is expanded). Zero is
     * rendered with `sigFigs` digits after the decimal point (e.g.
     * `format(0, 3)` -> "0.00"). Non-finite values fall back to `String`.
     */
    public format(value: number, sigFigs: number): string {
        if (!Number.isFinite(value)) {
            return String(value);
        }
        if (!Number.isInteger(sigFigs) || sigFigs <= 0) {
            return String(value);
        }
        if (value === 0) {
            if (sigFigs === 1) {
                return "0";
            }
            return "0." + "0".repeat(sigFigs - 1);
        }
        const precision = value.toPrecision(sigFigs);
        return this.expandExponential(precision);
    }
    /**
     * Count the significant figures in a numeric string. Returns 0 when the
     * string is not a recognized finite number. Trailing zeros in an integer
     * without a decimal point are treated as non-significant (ambiguous);
     * trailing zeros after a decimal point are significant.
     */
    public count(input: string): number {
        const trimmed = input.trim();
        if (trimmed.length === 0) {
            return 0;
        }
        if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed)) {
            return 0;
        }
        let mantissa = trimmed.replace(/^[+-]/, "");
        const eMatch = mantissa.match(/[eE]/);
        if (eMatch !== null && eMatch.index !== undefined) {
            mantissa = mantissa.slice(0, eMatch.index);
        }
        const hasDecimal = mantissa.includes(".");
        const digits = mantissa.replace(".", "");
        if (/^0+$/.test(digits)) {
            if (hasDecimal) {
                const afterDecimal = mantissa.split(".")[1] ?? "";
                return afterDecimal.length;
            }
            return 1;
        }
        const strippedLeading = digits.replace(/^0+/, "");
        if (!hasDecimal) {
            return strippedLeading.replace(/0+$/, "").length;
        }
        return strippedLeading.length;
    }
    /**
     * Detect the significant-figure count of `input` and return `null` when
     * the string is not a recognized finite number (the caller can then fall
     * back to a default formatting rule).
     */
    public detect(input: string): number | null {
        const n = this.count(input);
        return n > 0 ? n : null;
    }
    /**
     * Expand a possibly-exponential numeric string (as produced by
     * `Number.prototype.toPrecision`) into a plain decimal string. Handles
     * both positive and negative exponents and preserves the sign.
     */
    private expandExponential(s: string): string {
        if (!/[eE]/.test(s)) {
            return s;
        }
        const parts = s.split(/[eE]/);
        const mantissa = parts[0] ?? "0";
        const exp = parseInt(parts[1] ?? "0", 10);
        const negative = mantissa.startsWith("-");
        const m = negative ? mantissa.slice(1) : mantissa;
        const dotIndex = m.indexOf(".");
        let intPart: string;
        let decPart: string;
        if (dotIndex >= 0) {
            intPart = m.slice(0, dotIndex);
            decPart = m.slice(dotIndex + 1);
        } else {
            intPart = m;
            decPart = "";
        }
        const digits = intPart + decPart;
        const pointPos = intPart.length + exp;
        let result: string;
        if (pointPos <= 0) {
            result = "0." + "0".repeat(-pointPos) + digits;
        } else if (pointPos >= digits.length) {
            result = digits + "0".repeat(pointPos - digits.length);
        } else {
            result = digits.slice(0, pointPos) + "." + digits.slice(pointPos);
        }
        return negative ? "-" + result : result;
    }
}
/**
 * Convenience function formatting `value` to `sigFigs` significant figures
 * using a shared {@link SigFigFormatter} instance.
 */
export function formatSigFigs(value: number, sigFigs: number): string {
    return new SigFigFormatter().format(value, sigFigs);
}
