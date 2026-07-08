/**
 * Reference data for physical constants.
 *
 * Holds the standard set of physics constants (speed of light, gravitational
 * constant, Planck constant, Boltzmann constant, etc.) with their symbols,
 * values, units, and categories. Pure reference data — no MCQ/FRQ coupling.
 */
export interface PhysicalConstant {
	/** Symbol used in formulas (e.g. "c", "G", "k_B"). */
	symbol: string;
	/** Human-readable name. */
	name: string;
	/** Numeric value in SI units. */
	value: number;
	/** Unit string (SI). */
	units: string;
	/** Category for grouping (e.g. "universal", "atomic", "electromagnetic"). */
	category: string;
	/** Optional LaTeX representation of the symbol. */
	latex?: string;
	/** Optional uncertainty (1-sigma) in the same units as value. */
	uncertainty?: number;
}
export class ConstantsReference {
	private readonly constants: Map<string, PhysicalConstant>;
	private readonly order: string[];
	public constructor(constants?: PhysicalConstant[]) {
		this.constants = new Map();
		this.order = [];
		const source = constants ?? ConstantsReference.createStandard();
		for (const c of source) {
			this.register(c);
		}
	}
	/** Register a constant under its symbol (case-sensitive). */
	public register(c: PhysicalConstant): void {
		if (!this.constants.has(c.symbol)) {
			this.order.push(c.symbol);
		}
		this.constants.set(c.symbol, c);
	}
	/** Look up a constant by symbol. */
	public get(symbol: string): PhysicalConstant | undefined {
		return this.constants.get(symbol);
	}
	/** Return all constants in registration order. */
	public getAll(): PhysicalConstant[] {
		return this.order.map(s => this.constants.get(s)).filter((c): c is PhysicalConstant => c !== undefined);
	}
	/** Return constants filtered by category. */
	public getByCategory(category: string): PhysicalConstant[] {
		return this.getAll().filter(c => c.category === category);
	}
	/** Case-insensitive substring search over symbol and name. */
	public search(query: string): PhysicalConstant[] {
		const q = query.toLowerCase();
		return this.getAll().filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
	}
	/** Build the standard physics-constants reference set. */
	public static createStandard(): PhysicalConstant[] {
		return [
			{symbol: "c", name: "Speed of light in vacuum", value: 299792458, units: "m/s", category: "universal", latex: "c"},
			{symbol: "G", name: "Gravitational constant", value: 6.6743e-11, units: "m^3 kg^-1 s^-2", category: "universal", latex: "G", uncertainty: 1.5e-15},
			{symbol: "h", name: "Planck constant", value: 6.62607015e-34, units: "J*s", category: "quantum", latex: "h"},
			{symbol: "hbar", name: "Reduced Planck constant", value: 1.054571817e-34, units: "J*s", category: "quantum", latex: "\\hbar"},
			{symbol: "k_B", name: "Boltzmann constant", value: 1.380649e-23, units: "J/K", category: "thermodynamic", latex: "k_B"},
			{symbol: "N_A", name: "Avogadro constant", value: 6.02214076e23, units: "mol^-1", category: "thermodynamic", latex: "N_A"},
			{symbol: "R", name: "Molar gas constant", value: 8.314462618, units: "J mol^-1 K^-1", category: "thermodynamic", latex: "R"},
			{symbol: "e", name: "Elementary charge", value: 1.602176634e-19, units: "C", category: "electromagnetic", latex: "e"},
			{symbol: "eps0", name: "Vacuum electric permittivity", value: 8.8541878128e-12, units: "F/m", category: "electromagnetic", latex: "\\varepsilon_0"},
			{symbol: "mu0", name: "Vacuum magnetic permeability", value: 1.25663706212e-6, units: "N/A^2", category: "electromagnetic", latex: "\\mu_0"},
			{symbol: "m_e", name: "Electron mass", value: 9.1093837015e-31, units: "kg", category: "atomic", latex: "m_e"},
			{symbol: "m_p", name: "Proton mass", value: 1.67262192369e-27, units: "kg", category: "atomic", latex: "m_p"},
			{symbol: "m_n", name: "Neutron mass", value: 1.67492749804e-27, units: "kg", category: "atomic", latex: "m_n"},
			{symbol: "g", name: "Standard gravitational acceleration", value: 9.80665, units: "m/s^2", category: "terrestrial", latex: "g"},
			{symbol: "sigma", name: "Stefan-Boltzmann constant", value: 5.670374419e-8, units: "W m^-2 K^-4", category: "thermodynamic", latex: "\\sigma"},
			{symbol: "b", name: "Wien displacement constant", value: 2.897771955e-3, units: "m*K", category: "thermodynamic", latex: "b"},
			{symbol: "R_inf", name: "Rydberg constant", value: 10973731.56816, units: "m^-1", category: "atomic", latex: "R_\\infty"},
			{symbol: "a0", name: "Bohr radius", value: 5.29177210903e-11, units: "m", category: "atomic", latex: "a_0"},
			{symbol: "alpha", name: "Fine-structure constant", value: 7.2973525693e-3, units: "", category: "atomic", latex: "\\alpha"},
			{symbol: "k_e", name: "Coulomb constant", value: 8.9875517923e9, units: "N m^2 C^-2", category: "electromagnetic", latex: "k_e"},
		];
	}
}
