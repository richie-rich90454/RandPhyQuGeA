/**
 * Scientific-notation formatter and parser.
 *
 * Formats numbers into scientific notation (plain `e` form or LaTeX
 * `\times 10^{n}` form) and parses scientific-notation strings back into a
 * {mantissa, exponent, value} triple. Used by the answer pipeline so that
 * very large or very small magnitudes can be displayed and compared in a
 * normalized scientific form independent of the user's locale.
 */
export interface ScientificValue {
	/** Significand / mantissa (e.g. 6.674 for 6.674e-11). */
	mantissa: number;
	/** Power-of-ten exponent (e.g. -11 for 6.674e-11). */
	exponent: number;
	/** The reconstructed numeric value (mantissa * 10^exponent). */
	value: number;
}
export class ScientificNotation {
	/**
	 * Format `value` into plain scientific notation (`mantissa e exponent`),
	 * e.g. `format(0.00006674)` -> "6.674e-5". When `sigFigs` is supplied the
	 * mantissa is rendered to exactly that many significant figures. Zero is
	 * rendered as "0e0". Non-finite values fall back to `String`.
	 */
	public format(value: number, sigFigs?: number): string {
		if (!Number.isFinite(value)) {
			return String(value);
		}
		if (value === 0) {
			return "0e0";
		}
		const fractionDigits = sigFigs !== undefined && sigFigs > 0 ? sigFigs - 1 : undefined;
		const exp = value.toExponential(fractionDigits);
		return this.normalizeExponent(exp);
	}
	/**
	 * Format `value` into LaTeX scientific notation, e.g.
	 * `toLatex(0.00006674)` -> "6.674 \\times 10^{-5}". The mantissa is
	 * wrapped in braces when raised as a power to prevent double-superscript
	 * rendering issues in KaTeX.
	 */
	public toLatex(value: number, sigFigs?: number): string {
		if (!Number.isFinite(value)) {
			return String(value);
		}
		if (value === 0) {
			return "0";
		}
		const plain = this.format(value, sigFigs);
		const parsed = this.parse(plain);
		if (parsed === null) {
			return String(value);
		}
		const mantissaStr = this.trimMantissa(String(parsed.mantissa));
		return `{${mantissaStr} \\times 10^{${parsed.exponent}}}`;
	}
	/**
	 * Parse a scientific-notation string (`mantissa e exponent` or
	 * `mantissaEexponent`, optionally LaTeX `\\times 10^{n}`) into a
	 * {@link ScientificValue}. Returns `null` when the input is not a
	 * recognized scientific-notation string.
	 */
	public parse(input: string): ScientificValue | null {
		const trimmed = input.trim();
		if (trimmed.length === 0) {
			return null;
		}
		const normalized = this.stripLatex(trimmed);
		const match = normalized.match(/^([+-]?\d+(?:\.\d+)?)[eE]([+-]?\d+)$/);
		if (match === null) {
			return null;
		}
		const mantissa = Number(match[1] ?? "");
		const exponent = parseInt(match[2] ?? "0", 10);
		if (!Number.isFinite(mantissa) || !Number.isFinite(exponent)) {
			return null;
		}
		const value = mantissa * Math.pow(10, exponent);
		return {mantissa, exponent, value};
	}
	/**
	 * Return `true` when `input` is a recognized scientific-notation string
	 * (plain or LaTeX form).
	 */
	public isScientificNotation(input: string): boolean {
		return this.parse(input) !== null;
	}
	/**
	 * Convert a plain numeric string (e.g. "0.00006674") into scientific
	 * notation when its magnitude warrants it; returns the input unchanged
	 * when it is not a finite number. Used to normalize user input before
	 * comparison.
	 */
	public fromPlain(input: string, sigFigs?: number): string {
		const value = Number(input.trim());
		if (!Number.isFinite(value)) {
			return input;
		}
		return this.format(value, sigFigs);
	}
	/**
	 * Strip a LaTeX `\\times 10^{n}` wrapper back into plain `e n` form so
	 * the regex parser can match it. Also accepts `* 10^n` and `x 10^n`.
	 */
	private stripLatex(input: string): string {
		let s = input.trim();
		if (s.startsWith("{") && s.endsWith("}")) {
			s = s.slice(1, -1).trim();
		}
		const match = s.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:\\times|x|\*)\s*10\^\{?([+-]?\d+)\}?$/);
		if (match === null) {
			return input;
		}
		const mantissa = match[1] ?? "";
		const exponent = match[2] ?? "0";
		return `${mantissa}e${exponent}`;
	}
	/**
	 * Normalize a toExponential string by stripping a leading `+` from the
	 * exponent and any trailing zeros from the mantissa (e.g. "6.6740e-05"
	 * -> "6.674e-5") while preserving significant-figure precision when
	 * `sigFigs` was explicitly requested.
	 */
	private normalizeExponent(exp: string): string {
		const match = exp.match(/^(-?\d+(?:\.\d+)?)[eE]([+-]?\d+)$/);
		if (match === null) {
			return exp;
		}
		const mantissa = match[1] ?? "";
		const exponent = match[2] ?? "0";
		const strippedExponent = exponent.replace(/^\+/, "");
		return `${mantissa}e${strippedExponent}`;
	}
	/**
	 * Strip trailing zeros from a mantissa string ("6.6740" -> "6.674") while
	 * keeping at least one digit and preserving the sign.
	 */
	private trimMantissa(mantissa: string): string {
		if (!mantissa.includes(".")) {
			return mantissa;
		}
		return mantissa.replace(/0+$/, "").replace(/\.$/, "");
	}
}
