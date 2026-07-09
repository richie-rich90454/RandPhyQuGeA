/**
 * Glossary of physics terms.
 *
 * Holds definitions for common physics vocabulary organized by category
 * (mechanics, electromagnetism, thermodynamics, waves, quantum, etc.). Pure
 * reference data used by the glossary modal and the partial-credit hint
 * generator.
 */
export interface GlossaryEntry {
	/** The term being defined. */
	term: string;
	/** Definition of the term. */
	definition: string;
	/** Category for grouping (e.g. "mechanics", "waves"). */
	category: string;
	/** Optional list of related terms (cross-references). */
	related?: string[];
	/** Optional LaTeX representation of the term's symbol. */
	latex?: string;
}
/** Lookup, search, and categorical access over the standard physics glossary. */
export class Glossary {
	private readonly entries: Map<string, GlossaryEntry>;
	private readonly order: string[];
	public constructor(entries?: GlossaryEntry[]) {
		this.entries = new Map();
		this.order = [];
		const source = entries ?? Glossary.createStandard();
		for (const e of source) {
			this.register(e);
		}
	}
	/** Register a glossary entry under its term (case-insensitive key). */
	public register(entry: GlossaryEntry): void {
		const key = entry.term.toLowerCase();
		if (!this.entries.has(key)) {
			this.order.push(key);
		}
		this.entries.set(key, entry);
	}
	/** Look up an entry by term (case-insensitive). */
	public get(term: string): GlossaryEntry | undefined {
		return this.entries.get(term.toLowerCase());
	}
	/** Return all entries in registration order. */
	public getAll(): GlossaryEntry[] {
		return this.order.map(k => this.entries.get(k)).filter((e): e is GlossaryEntry => e !== undefined);
	}
	/** Return entries filtered by category. */
	public getByCategory(category: string): GlossaryEntry[] {
		return this.getAll().filter(e => e.category === category);
	}
	/** Case-insensitive substring search over term and definition. */
	public search(query: string): GlossaryEntry[] {
		const q = query.toLowerCase();
		return this.getAll().filter(e => e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q));
	}
	/** Build the standard physics glossary. */
	public static createStandard(): GlossaryEntry[] {
		return [
			{term: "Velocity", definition: "Rate of change of displacement with respect to time; a vector quantity.", category: "mechanics", related: ["Speed", "Displacement"], latex: "\\vec{v}"},
			{term: "Acceleration", definition: "Rate of change of velocity with respect to time; a vector quantity.", category: "mechanics", related: ["Velocity"], latex: "\\vec{a}"},
			{term: "Force", definition: "Any interaction that changes the motion of an object; described by Newton's second law F = ma.", category: "mechanics", related: ["Newton's Laws", "Mass"], latex: "\\vec{F}"},
			{term: "Mass", definition: "A measure of the amount of matter in an object and its resistance to acceleration.", category: "mechanics", latex: "m"},
			{term: "Momentum", definition: "The product of mass and velocity; conserved in an isolated system.", category: "mechanics", related: ["Impulse"], latex: "\\vec{p}"},
			{term: "Impulse", definition: "The product of force and the time over which it acts; equals the change in momentum.", category: "mechanics", related: ["Momentum"], latex: "\\vec{J}"},
			{term: "Energy", definition: "A scalar quantity representing the capacity to do work; conserved in an isolated system.", category: "mechanics", latex: "E"},
			{term: "Kinetic Energy", definition: "Energy possessed by an object due to its motion; E_k = 1/2 m v^2.", category: "mechanics", latex: "E_k"},
			{term: "Potential Energy", definition: "Energy stored in an object due to its position or configuration.", category: "mechanics", latex: "E_p"},
			{term: "Work", definition: "Energy transferred to or from an object by a force; W = F d cos(theta).", category: "mechanics", latex: "W"},
			{term: "Power", definition: "Rate at which work is done or energy is transferred; P = W/t.", category: "mechanics", latex: "P"},
			{term: "Torque", definition: "The rotational analog of force; tau = r F sin(theta).", category: "mechanics", latex: "\\tau"},
			{term: "Newton's Laws", definition: "Three laws describing the relationship between motion and forces.", category: "mechanics", related: ["Force"]},
			{term: "Friction", definition: "A force that opposes relative motion between surfaces in contact.", category: "mechanics", latex: "f"},
			{term: "Electric Field", definition: "A region around a charged particle where a force acts on other charges; E = F/q.", category: "electromagnetism", latex: "\\vec{E}"},
			{term: "Magnetic Field", definition: "A region where a magnetic force acts on moving charges or magnetic materials.", category: "electromagnetism", latex: "\\vec{B}"},
			{term: "Electric Potential", definition: "Electric potential energy per unit charge; V = k q/r.", category: "electromagnetism", latex: "V"},
			{term: "Capacitance", definition: "Ratio of charge stored to potential difference; C = Q/V.", category: "electromagnetism", latex: "C"},
			{term: "Current", definition: "Rate of flow of electric charge; I = dQ/dt.", category: "electromagnetism", latex: "I"},
			{term: "Resistance", definition: "Opposition to the flow of electric current; V = I R.", category: "electromagnetism", latex: "R"},
			{term: "Temperature", definition: "A measure of the average kinetic energy of particles in a substance.", category: "thermodynamics", latex: "T"},
			{term: "Heat", definition: "Energy transferred due to a temperature difference.", category: "thermodynamics", latex: "Q"},
			{term: "Entropy", definition: "A measure of disorder; the number of microstates corresponding to a macrostate.", category: "thermodynamics", latex: "S"},
			{term: "Internal Energy", definition: "Total microscopic kinetic and potential energy of a system.", category: "thermodynamics", latex: "U"},
			{term: "Wavelength", definition: "Distance between successive crests of a wave.", category: "waves", latex: "\\lambda"},
			{term: "Frequency", definition: "Number of cycles per unit time; f = 1/T.", category: "waves", latex: "f"},
			{term: "Amplitude", definition: "Maximum displacement from equilibrium in a wave or oscillation.", category: "waves", latex: "A"},
			{term: "Period", definition: "Time for one complete cycle of a repeating event.", category: "waves", latex: "T"},
			{term: "Refraction", definition: "Bending of a wave as it passes from one medium to another with different speed.", category: "waves"},
			{term: "Diffraction", definition: "Bending and spreading of waves around obstacles or through openings.", category: "waves"},
			{term: "Photon", definition: "A quantum of electromagnetic radiation; E = h f.", category: "quantum", latex: "\\gamma"},
			{term: "Quantum", definition: "The smallest discrete amount of a physical quantity, such as energy.", category: "quantum"},
			{term: "Wavefunction", definition: "A mathematical function describing the quantum state of a system.", category: "quantum", latex: "\\psi"},
			{term: "Uncertainty Principle", definition: "Position and momentum cannot both be known precisely; dx dp >= hbar/2.", category: "quantum", latex: "\\Delta x \\Delta p"},
		];
	}
}
