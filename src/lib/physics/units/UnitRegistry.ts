/**
 * Unit registry for unit-aware answer comparison.
 *
 * Holds SI base and derived units plus the SI prefix table, and resolves a
 * unit token (possibly SI-prefixed, e.g. "km", "cm", "ms", "μs") into a
 * {factor, dimensions} pair. `factor` is the multiplier to the dimension's
 * SI base unit; `dimensions` is the dimension-vector exponent map (L=length,
 * M=mass, T=time, I=current, Theta=temperature, N=amount, J=luminosity).
 */
export type DimensionKey = "L" | "M" | "T" | "I" | "Theta" | "N" | "J";
export type DimensionVector = Partial<Record<DimensionKey, number>>;
export const DIMENSION_KEYS: readonly DimensionKey[] = ["L", "M", "T", "I", "Theta", "N", "J"];
export interface UnitDefinition {
    /** Unit symbol (e.g. "m", "kg", "N", "J"). */
    symbol: string;
    /** Human-readable name. */
    name: string;
    /** Multiplier to the SI base unit of this unit's dimension. */
    factor: number;
    /** Dimension-vector exponents. */
    dimensions: DimensionVector;
}
export interface ResolvedUnit {
    /** Combined scale factor to SI base units. */
    factor: number;
    /** Combined dimension-vector exponents. */
    dimensions: DimensionVector;
}
const SI_PREFIXES: Record<string, number> = {
    Y: 1e24,
    Z: 1e21,
    E: 1e18,
    P: 1e15,
    T: 1e12,
    G: 1e9,
    M: 1e6,
    k: 1e3,
    h: 1e2,
    da: 1e1,
    d: 1e-1,
    c: 1e-2,
    m: 1e-3,
    u: 1e-6,
    "\u00B5": 1e-6,
    n: 1e-9,
    p: 1e-12,
    f: 1e-15,
    a: 1e-18,
    z: 1e-21,
    y: 1e-24,
};
/** Resolves unit tokens (including SI-prefixed forms like "km", "cm", "ms") into {factor, dimensions} pairs against the registered SI base and derived units. */
export class UnitRegistry {
    private readonly units: Map<string, UnitDefinition>;
    private readonly prefixes: Record<string, number>;
    public constructor(units?: UnitDefinition[], prefixes?: Record<string, number>) {
        this.units = new Map();
        this.prefixes = prefixes ?? SI_PREFIXES;
        if (units !== undefined) {
            for (const u of units) {
                this.register(u);
            }
        } else {
            this.registerDefaults();
        }
    }
    /** Register a unit definition under its symbol (case-sensitive). */
    public register(unit: UnitDefinition): void {
        this.units.set(unit.symbol, unit);
    }
    /** Look up a unit by exact symbol. */
    public get(symbol: string): UnitDefinition | undefined {
        return this.units.get(symbol);
    }
    /** Return all registered unit symbols. */
    public symbols(): string[] {
        return Array.from(this.units.keys());
    }
    /** Resolve a single unit token (possibly SI-prefixed) into {factor, dimensions}. Returns null when the token is unrecognized. */
    public resolve(token: string): ResolvedUnit | null {
        const direct = this.units.get(token);
        if (direct !== undefined) {
            return {factor: direct.factor, dimensions: {...direct.dimensions}};
        }
        for (const prefix of Object.keys(this.prefixes)) {
            if (token.startsWith(prefix) && token.length > prefix.length) {
                const rest = token.slice(prefix.length);
                const base = this.units.get(rest);
                if (base !== undefined) {
                    const prefixFactor = this.prefixes[prefix];
                    if (prefixFactor === undefined) {
                        continue;
                    }
                    return {factor: prefixFactor * base.factor, dimensions: {...base.dimensions}};
                }
            }
        }
        return null;
    }
    /** Build a registry pre-populated with SI base units and common derived units. */
    public static createDefault(): UnitRegistry {
        return new UnitRegistry();
    }
    private registerDefaults(): void {
        const defs: UnitDefinition[] = [
            {symbol: "m", name: "meter", factor: 1, dimensions: {L: 1}},
            {symbol: "g", name: "gram", factor: 1e-3, dimensions: {M: 1}},
            {symbol: "kg", name: "kilogram", factor: 1, dimensions: {M: 1}},
            {symbol: "s", name: "second", factor: 1, dimensions: {T: 1}},
            {symbol: "A", name: "ampere", factor: 1, dimensions: {I: 1}},
            {symbol: "K", name: "kelvin", factor: 1, dimensions: {Theta: 1}},
            {symbol: "mol", name: "mole", factor: 1, dimensions: {N: 1}},
            {symbol: "cd", name: "candela", factor: 1, dimensions: {J: 1}},
            {symbol: "min", name: "minute", factor: 60, dimensions: {T: 1}},
            {symbol: "h", name: "hour", factor: 3600, dimensions: {T: 1}},
            {symbol: "day", name: "day", factor: 86400, dimensions: {T: 1}},
            {symbol: "Hz", name: "hertz", factor: 1, dimensions: {T: -1}},
            {symbol: "N", name: "newton", factor: 1, dimensions: {L: 1, M: 1, T: -2}},
            {symbol: "J", name: "joule", factor: 1, dimensions: {L: 2, M: 1, T: -2}},
            {symbol: "W", name: "watt", factor: 1, dimensions: {L: 2, M: 1, T: -3}},
            {symbol: "Pa", name: "pascal", factor: 1, dimensions: {L: -1, M: 1, T: -2}},
            {symbol: "C", name: "coulomb", factor: 1, dimensions: {I: 1, T: 1}},
            {symbol: "V", name: "volt", factor: 1, dimensions: {L: 2, M: 1, T: -3, I: -1}},
            {symbol: "F", name: "farad", factor: 1, dimensions: {L: -2, M: -1, T: 4, I: 2}},
            {symbol: "ohm", name: "ohm", factor: 1, dimensions: {L: 2, M: 1, T: -3, I: -2}},
            {symbol: "T", name: "tesla", factor: 1, dimensions: {L: 0, M: 1, T: -2, I: -1}},
            {symbol: "Wb", name: "weber", factor: 1, dimensions: {L: 2, M: 1, T: -2, I: -1}},
            {symbol: "H", name: "henry", factor: 1, dimensions: {L: 2, M: 1, T: -2, I: -2}},
            {symbol: "lm", name: "lumen", factor: 1, dimensions: {J: 1}},
            {symbol: "lx", name: "lux", factor: 1, dimensions: {L: -2, J: 1}},
            {symbol: "eV", name: "electronvolt", factor: 1.602176634e-19, dimensions: {L: 2, M: 1, T: -2}},
        ];
        for (const d of defs) {
            this.register(d);
        }
    }
}
