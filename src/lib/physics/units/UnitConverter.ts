import {UnitComparator} from "./UnitComparator";
import {UnitRegistry} from "./UnitRegistry";
/**
 * Unit converter.
 *
 * Converts a numeric value from one unit to another (e.g. 5 km -> 5000 m,
 * 9.8 m/s -> 980 cm/s) using the {@link UnitRegistry} scale factors. Both
 * units must resolve to the same dimension vector; otherwise the conversion
 * returns null. Pure-TS, no DOM dependencies.
 */
export class UnitConverter {
	private readonly comparator: UnitComparator;
	private readonly registry: UnitRegistry;
	public constructor(registry?: UnitRegistry, comparator?: UnitComparator) {
		this.registry = registry ?? UnitRegistry.createDefault();
		this.comparator = comparator ?? new UnitComparator(this.registry);
	}
	/**
	 * Convert `value` from unit `from` to unit `to`. Returns the converted
	 * numeric value, or `null` when either unit is unresolvable or the
	 * dimensions do not match.
	 */
	public convert(value: number, from: string, to: string): number | null {
		const fromResolved = this.comparator.resolveCompound(from);
		const toResolved = this.comparator.resolveCompound(to);
		if (fromResolved === null || toResolved === null) {
			return null;
		}
		if (!this.sameDimensions(fromResolved.dimensions, toResolved.dimensions)) {
			return null;
		}
		const siValue = value * fromResolved.factor;
		return siValue / toResolved.factor;
	}
	/**
	 * Convert a "value unit" string to a target unit, returning a formatted
	 * "value unit" string. Returns `null` when the input or target unit is
	 * unresolvable, or the dimensions do not match.
	 */
	public convertString(input: string, to: string): string | null {
		const parsed = this.comparator.parse(input);
		if (parsed === null) {
			return null;
		}
		const toResolved = this.comparator.resolveCompound(to);
		if (toResolved === null) {
			return null;
		}
		if (!this.sameDimensions(parsed.dimensions, toResolved.dimensions)) {
			return null;
		}
		const converted = parsed.siValue / toResolved.factor;
		return `${this.formatNumber(converted)} ${to}`;
	}
	/**
	 * Return the list of registered unit symbols that share the same
	 * dimension as `from` (including `from` itself). Used to populate a
	 * "convert to" dropdown in the unit-converter modal.
	 */
	public listConvertible(from: string): string[] {
		const fromResolved = this.comparator.resolveCompound(from);
		if (fromResolved === null) {
			return [];
		}
		const result: string[] = [];
		for (const symbol of this.registry.symbols()) {
			const resolved = this.registry.resolve(symbol);
			if (resolved === null) {
				continue;
			}
			if (this.sameDimensions(resolved.dimensions, fromResolved.dimensions)) {
				result.push(symbol);
			}
		}
		return result;
	}
	/** Format a converted number: integers as-is, otherwise up to 6 decimals with trailing zeros stripped. */
	private formatNumber(value: number): string {
		if (value === Math.trunc(value) && Math.abs(value) < 1e15) {
			return String(Math.trunc(value));
		}
		return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
	}
	/** Return `true` when two dimension vectors have the same exponents for every dimension key. */
	private sameDimensions(a: Record<string, number | undefined>, b: Record<string, number | undefined>): boolean {
		const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
		for (const k of keys) {
			const av = a[k] ?? 0;
			const bv = b[k] ?? 0;
			if (av !== bv) {
				return false;
			}
		}
		return true;
	}
}
