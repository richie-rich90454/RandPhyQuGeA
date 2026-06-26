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
	/** Format a number: integers as-is, otherwise 4 decimals with trailing zeros stripped. */
	public formatValue(value: number): string {
		if (value === Math.trunc(value)) {
			return String(Math.trunc(value));
		}
		return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
	}
}
