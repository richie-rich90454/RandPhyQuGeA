import type {FormulaEntry} from './types';
/** Curated library of standard physics formulas organized by topic. */
export class FormulaLibrary {
	private readonly formulas: FormulaEntry[];
	public constructor(formulas?: FormulaEntry[]) {
		this.formulas = formulas ?? FormulaLibrary.createStandard();
	}
	/** Return all formulas in the library. */
	public getAll(): FormulaEntry[] {
		return [...this.formulas];
	}
	/** Return formulas filtered by topic_id. */
	public getByTopic(topicId: string): FormulaEntry[] {
		return this.formulas.filter(f => f.topic_id === topicId);
	}
	/** Search formulas by case-insensitive substring match on name or description. */
	public search(query: string): FormulaEntry[] {
		const q = query.toLowerCase();
		return this.formulas.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
	}
	/** Build the standard physics formula library. */
	public static createStandard(): FormulaEntry[] {
		return [
			// Kinematics
			{
				name: 'Constant Velocity',
				latex: 'v = \\frac{\\Delta x}{\\Delta t}',
				description: 'Velocity equals displacement divided by time',
				variables: ['v', 'x', 't'],
				topic_id: 'kinematics'
			},
			{
				name: 'Uniform Acceleration',
				latex: 'a = \\frac{v - v_0}{t}',
				description: 'Acceleration equals change in velocity divided by time',
				variables: ['a', 'v', 'v_0', 't'],
				topic_id: 'kinematics'
			},
			{
				name: 'Displacement (Uniform Acceleration)',
				latex: '\\Delta x = v_0 t + \\frac{1}{2} a t^2',
				description: 'Displacement under constant acceleration',
				variables: ['x', 'v_0', 'a', 't'],
				topic_id: 'kinematics'
			},
			{
				name: 'Velocity-Displacement Relation',
				latex: 'v^2 = v_0^2 + 2 a \\Delta x',
				description: 'Final velocity squared equals initial velocity squared plus 2aΔx',
				variables: ['v', 'v_0', 'a', 'x'],
				topic_id: 'kinematics'
			},
			{
				name: 'Free Fall Distance',
				latex: 'h = \\frac{1}{2} g t^2',
				description: 'Distance fallen from rest under gravity',
				variables: ['h', 'g', 't'],
				topic_id: 'kinematics'
			},
			// Dynamics
			{
				name: "Newton's Second Law",
				latex: 'F = m a',
				description: 'Net force equals mass times acceleration',
				variables: ['F', 'm', 'a'],
				topic_id: 'dynamics'
			},
			{
				name: 'Weight',
				latex: 'W = m g',
				description: 'Weight equals mass times gravitational acceleration',
				variables: ['W', 'm', 'g'],
				topic_id: 'dynamics'
			},
			{
				name: 'Friction Force',
				latex: 'f = \\mu N',
				description: 'Friction force equals coefficient of friction times normal force',
				variables: ['f', '\\mu', 'N'],
				topic_id: 'dynamics'
			},
			{
				name: 'Centripetal Force',
				latex: 'F_c = \\frac{m v^2}{r}',
				description: 'Centripetal force for circular motion',
				variables: ['F_c', 'm', 'v', 'r'],
				topic_id: 'dynamics'
			},
			// Energy
			{
				name: 'Kinetic Energy',
				latex: 'E_k = \\frac{1}{2} m v^2',
				description: 'Kinetic energy of a moving object',
				variables: ['E_k', 'm', 'v'],
				topic_id: 'energy'
			},
			{
				name: 'Gravitational Potential Energy',
				latex: 'E_p = m g h',
				description: "Potential energy near Earth's surface",
				variables: ['E_p', 'm', 'g', 'h'],
				topic_id: 'energy'
			},
			{
				name: 'Work',
				latex: 'W = F d \\cos\\theta',
				description: 'Work equals force times displacement times cosine of angle',
				variables: ['W', 'F', 'd', '\\theta'],
				topic_id: 'energy'
			},
			{
				name: 'Power',
				latex: 'P = \\frac{W}{t} = F v',
				description: 'Power equals work divided by time, or force times velocity',
				variables: ['P', 'W', 't', 'F', 'v'],
				topic_id: 'energy'
			},
			// Momentum
			{
				name: 'Momentum',
				latex: 'p = m v',
				description: 'Momentum equals mass times velocity',
				variables: ['p', 'm', 'v'],
				topic_id: 'momentum'
			},
			{
				name: 'Impulse',
				latex: 'J = F \\Delta t = \\Delta p',
				description: 'Impulse equals force times time, equals change in momentum',
				variables: ['J', 'F', 't', 'p'],
				topic_id: 'momentum'
			},
			// Waves
			{
				name: 'Wave Speed',
				latex: 'v = f \\lambda',
				description: 'Wave speed equals frequency times wavelength',
				variables: ['v', 'f', '\\lambda'],
				topic_id: 'waves'
			},
			{
				name: 'Period and Frequency',
				latex: 'T = \\frac{1}{f}',
				description: 'Period is the reciprocal of frequency',
				variables: ['T', 'f'],
				topic_id: 'waves'
			},
			// Electricity
			{
				name: "Ohm's Law",
				latex: 'V = I R',
				description: 'Voltage equals current times resistance',
				variables: ['V', 'I', 'R'],
				topic_id: 'electricity'
			},
			{
				name: 'Electric Power',
				latex: 'P = V I = I^2 R = \\frac{V^2}{R}',
				description: 'Electric power in terms of voltage, current, and resistance',
				variables: ['P', 'V', 'I', 'R'],
				topic_id: 'electricity'
			},
			{
				name: 'Resistance in Series',
				latex: 'R_s = R_1 + R_2 + \\dots',
				description: 'Total resistance for resistors in series',
				variables: ['R_s', 'R_1', 'R_2'],
				topic_id: 'electricity'
			},
			{
				name: 'Resistance in Parallel',
				latex: '\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\dots',
				description: 'Total resistance for resistors in parallel',
				variables: ['R_p', 'R_1', 'R_2'],
				topic_id: 'electricity'
			}
		];
	}
}
