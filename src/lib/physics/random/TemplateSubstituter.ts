/** Replaces {var} tokens in templates and formats numeric values. */
export class TemplateSubstituter {
	/** Replace {var} tokens with formatted values. Unknown tokens are left as-is. */
	public substitute(template: string, variables: Record<string, unknown>): string {
		return template.replace(/\{(\w+)\}/g, (match, name: string) => {
			const value = variables[name];
			if (value === undefined) {
				return match;
			}
			if (typeof value === 'number') {
				return this.formatValue(value);
			}
			return String(value);
		});
	}
	/** Format a number: integers as-is, otherwise 4 decimals with trailing zeros stripped. Uses LaTeX scientific notation for very small or very large magnitudes. */
	public formatValue(value: number): string {
		if (value === Math.trunc(value) && Math.abs(value) < 1e6) {
			return String(Math.trunc(value));
		}
		const absValue = Math.abs(value);
		if (absValue > 0 && (absValue < 1e-4 || absValue >= 1e6)) {
			return this.toLatexScientific(value);
		}
		return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
	}
	/** Convert a number to LaTeX scientific notation, e.g. 6.674e-7 -> {6.674 \times 10^{-7}} (wrapped in braces to prevent double superscript when raised to a power). */
	public toLatexScientific(value: number): string {
		const exp = value.toExponential(4);
		const match = exp.match(/^(-?\d+(?:\.\d+)?)e([+-]?\d+)$/);
		if (match) {
			const mantissaStr = match[1] ?? '';
			const mantissa = mantissaStr.replace(/0+$/, '').replace(/\.$/, '');
			const power = parseInt(match[2] ?? '0', 10);
			return `{${mantissa} \\times 10^{${power}}}`;
		}
		return exp;
	}
}
