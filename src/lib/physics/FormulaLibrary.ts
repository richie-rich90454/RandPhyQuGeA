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
				description: 'Final velocity squared equals initial velocity squared plus 2a times displacement',
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
			{
				name: 'Projectile Range',
				latex: 'R = \\frac{v_0^2 \\sin(2\\theta)}{g}',
				description: 'Horizontal range of a projectile launched at angle theta',
				variables: ['R', 'v_0', '\\theta', 'g'],
				topic_id: 'kinematics'
			},
			{
				name: 'Projectile Maximum Height',
				latex: 'H = \\frac{v_0^2 \\sin^2\\theta}{2g}',
				description: 'Maximum height reached by a projectile',
				variables: ['H', 'v_0', '\\theta', 'g'],
				topic_id: 'kinematics'
			},
			{
				name: 'Time of Flight',
				latex: 'T = \\frac{2 v_0 \\sin\\theta}{g}',
				description: 'Total time a projectile stays in the air',
				variables: ['T', 'v_0', '\\theta', 'g'],
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
				name: 'Normal Force on Incline',
				latex: 'N = m g \\cos\\theta',
				description: 'Normal force on a block resting on an inclined plane',
				variables: ['N', 'm', 'g', '\\theta'],
				topic_id: 'dynamics'
			},
			{
				name: 'Net Force on Incline',
				latex: 'F = m g \\sin\\theta - \\mu m g \\cos\\theta',
				description: 'Net force along an inclined plane with friction',
				variables: ['F', 'm', 'g', '\\theta', '\\mu'],
				topic_id: 'dynamics'
			},
			{
				name: "Newton's Third Law",
				latex: 'F_{12} = -F_{21}',
				description: 'For every action there is an equal and opposite reaction',
				variables: ['F_{12}', 'F_{21}'],
				topic_id: 'dynamics'
			},
			{
				name: 'Drag Force',
				latex: 'F = \\frac{1}{2} \\rho v^2 C_d A',
				description: 'Air resistance force proportional to velocity squared',
				variables: ['F', '\\rho', 'v', 'C_d', 'A'],
				topic_id: 'dynamics'
			},
			// Circular Motion
			{
				name: 'Centripetal Acceleration',
				latex: 'a_c = \\frac{v^2}{r}',
				description: 'Acceleration directed toward the center of a circular path',
				variables: ['a_c', 'v', 'r'],
				topic_id: 'circular-motion'
			},
			{
				name: 'Centripetal Force',
				latex: 'F_c = \\frac{m v^2}{r}',
				description: 'Centripetal force required for circular motion',
				variables: ['F_c', 'm', 'v', 'r'],
				topic_id: 'circular-motion'
			},
			{
				name: 'Period of Circular Motion',
				latex: 'T = \\frac{2\\pi r}{v}',
				description: 'Period of one revolution in uniform circular motion',
				variables: ['T', 'r', 'v'],
				topic_id: 'circular-motion'
			},
			{
				name: 'Banked Curve',
				latex: '\\tan\\theta = \\frac{v^2}{r g}',
				description: 'Banking angle for a curve negotiated without friction',
				variables: ['\\theta', 'v', 'r', 'g'],
				topic_id: 'circular-motion'
			},
			{
				name: 'Conical Pendulum',
				latex: '\\tan\\theta = \\frac{v^2}{r g}',
				description: 'Angle of a conical pendulum in terms of speed and radius',
				variables: ['\\theta', 'v', 'r', 'g'],
				topic_id: 'circular-motion'
			},
			// Gravitation
			{
				name: "Newton's Law of Gravitation",
				latex: 'F = \\frac{G m_1 m_2}{r^2}',
				description: 'Gravitational attraction between two point masses',
				variables: ['F', 'G', 'm_1', 'm_2', 'r'],
				topic_id: 'gravitation'
			},
			{
				name: 'Gravitational Field',
				latex: 'g = \\frac{G M}{r^2}',
				description: 'Gravitational field strength due to a mass M',
				variables: ['g', 'G', 'M', 'r'],
				topic_id: 'gravitation'
			},
			{
				name: 'Orbital Velocity',
				latex: 'v = \\sqrt{\\frac{G M}{r}}',
				description: 'Speed required for a circular orbit of radius r',
				variables: ['v', 'G', 'M', 'r'],
				topic_id: 'gravitation'
			},
			{
				name: 'Orbital Period',
				latex: 'T = 2\\pi \\sqrt{\\frac{r^3}{G M}}',
				description: 'Period of a circular orbit around a central mass',
				variables: ['T', 'r', 'G', 'M'],
				topic_id: 'gravitation'
			},
			{
				name: 'Gravitational Potential Energy',
				latex: 'U = -\\frac{G m_1 m_2}{r}',
				description: 'Gravitational potential energy of two masses separated by r',
				variables: ['U', 'G', 'm_1', 'm_2', 'r'],
				topic_id: 'gravitation'
			},
			{
				name: "Kepler's Third Law",
				latex: 'T^2 \\propto r^3',
				description: 'The square of the orbital period is proportional to the cube of the radius',
				variables: ['T', 'r'],
				topic_id: 'gravitation'
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
				name: 'Spring Potential Energy',
				latex: 'E_s = \\frac{1}{2} k x^2',
				description: 'Elastic potential energy stored in a spring',
				variables: ['E_s', 'k', 'x'],
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
				name: 'Work-Energy Theorem',
				latex: 'W = \\Delta E_k',
				description: 'Net work equals change in kinetic energy',
				variables: ['W', 'E_k'],
				topic_id: 'energy'
			},
			{
				name: 'Power (Work over Time)',
				latex: 'P = \\frac{W}{t}',
				description: 'Power equals work divided by time',
				variables: ['P', 'W', 't'],
				topic_id: 'energy'
			},
			{
				name: 'Power (Force times Velocity)',
				latex: 'P = F v',
				description: 'Power equals force times velocity',
				variables: ['P', 'F', 'v'],
				topic_id: 'energy'
			},
			{
				name: 'Conservation of Energy',
				latex: 'E_{k,i} + E_{p,i} = E_{k,f} + E_{p,f}',
				description: 'Total mechanical energy is conserved in absence of non-conservative forces',
				variables: ['E_k', 'E_p'],
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
			{
				name: 'Conservation of Momentum',
				latex: 'm_1 v_{1i} + m_2 v_{2i} = m_1 v_{1f} + m_2 v_{2f}',
				description: 'Total momentum is conserved in an isolated system',
				variables: ['m_1', 'v_1', 'm_2', 'v_2'],
				topic_id: 'momentum'
			},
			{
				name: 'Elastic Collision (1D)',
				latex: 'v_{1f} = \\frac{m_1 - m_2}{m_1 + m_2} v_{1i}',
				description: 'Final velocity of mass m1 after a one-dimensional elastic collision',
				variables: ['v_{1f}', 'm_1', 'm_2', 'v_{1i}'],
				topic_id: 'momentum'
			},
			{
				name: 'Center of Mass',
				latex: 'x_{cm} = \\frac{m_1 x_1 + m_2 x_2}{m_1 + m_2}',
				description: 'Center of mass position for two point masses',
				variables: ['x_{cm}', 'm_1', 'x_1', 'm_2', 'x_2'],
				topic_id: 'momentum'
			},
			// Torque
			{
				name: 'Torque',
				latex: '\\tau = r F \\sin\\theta',
				description: 'Torque equals lever arm times force times sine of angle',
				variables: ['\\tau', 'r', 'F', '\\theta'],
				topic_id: 'torque'
			},
			{
				name: 'Rotational Equilibrium',
				latex: '\\sum \\tau = 0',
				description: 'Net torque is zero for a body in rotational equilibrium',
				variables: ['\\tau'],
				topic_id: 'torque'
			},
			{
				name: 'Torque (Vector Form)',
				latex: '\\vec{\\tau} = \\vec{r} \\times \\vec{F}',
				description: 'Torque as the cross product of position and force vectors',
				variables: ['\\tau', 'r', 'F'],
				topic_id: 'torque'
			},
			{
				name: 'Moment of a Couple',
				latex: 'M = F d',
				description: 'Moment produced by a pair of equal and opposite forces',
				variables: ['M', 'F', 'd'],
				topic_id: 'torque'
			},
			// Rotational Motion
			{
				name: 'Angular Velocity',
				latex: '\\omega = \\frac{\\Delta \\theta}{\\Delta t}',
				description: 'Rate of change of angular displacement',
				variables: ['\\omega', '\\theta', 't'],
				topic_id: 'rotational-motion'
			},
			{
				name: 'Angular Acceleration',
				latex: '\\alpha = \\frac{\\Delta \\omega}{\\Delta t}',
				description: 'Rate of change of angular velocity',
				variables: ['\\alpha', '\\omega', 't'],
				topic_id: 'rotational-motion'
			},
			{
				name: 'Angular Displacement',
				latex: '\\theta = \\omega_0 t + \\frac{1}{2} \\alpha t^2',
				description: 'Angular displacement under constant angular acceleration',
				variables: ['\\theta', '\\omega_0', '\\alpha', 't'],
				topic_id: 'rotational-motion'
			},
			{
				name: 'Moment of Inertia (Point Mass)',
				latex: 'I = m r^2',
				description: 'Moment of inertia of a point mass at distance r from the axis',
				variables: ['I', 'm', 'r'],
				topic_id: 'rotational-motion'
			},
			{
				name: 'Moment of Inertia (Rod, Center)',
				latex: 'I = \\frac{1}{12} m L^2',
				description: 'Moment of inertia of a uniform rod about its center',
				variables: ['I', 'm', 'L'],
				topic_id: 'rotational-motion'
			},
			{
				name: 'Moment of Inertia (Disc)',
				latex: 'I = \\frac{1}{2} m R^2',
				description: 'Moment of inertia of a uniform disc about its central axis',
				variables: ['I', 'm', 'R'],
				topic_id: 'rotational-motion'
			},
			{
				name: 'Rotational Kinetic Energy',
				latex: 'E_k = \\frac{1}{2} I \\omega^2',
				description: 'Kinetic energy of a rotating rigid body',
				variables: ['E_k', 'I', '\\omega'],
				topic_id: 'rotational-motion'
			},
			{
				name: 'Angular Momentum',
				latex: 'L = I \\omega',
				description: 'Angular momentum equals moment of inertia times angular velocity',
				variables: ['L', 'I', '\\omega'],
				topic_id: 'rotational-motion'
			},
			{
				name: "Newton's Second Law (Rotation)",
				latex: '\\tau = I \\alpha',
				description: 'Net torque equals moment of inertia times angular acceleration',
				variables: ['\\tau', 'I', '\\alpha'],
				topic_id: 'rotational-motion'
			},
			// Simple Harmonic Motion
			{
				name: "Hooke's Law",
				latex: 'F = -k x',
				description: 'Restoring force of a spring is proportional to displacement',
				variables: ['F', 'k', 'x'],
				topic_id: 'shm'
			},
			{
				name: 'Spring Period',
				latex: 'T = 2\\pi \\sqrt{\\frac{m}{k}}',
				description: 'Period of oscillation of a mass on a spring',
				variables: ['T', 'm', 'k'],
				topic_id: 'shm'
			},
			{
				name: 'Pendulum Period',
				latex: 'T = 2\\pi \\sqrt{\\frac{L}{g}}',
				description: 'Period of a simple pendulum for small angles',
				variables: ['T', 'L', 'g'],
				topic_id: 'shm'
			},
			{
				name: 'Spring Frequency',
				latex: 'f = \\frac{1}{2\\pi} \\sqrt{\\frac{k}{m}}',
				description: 'Natural frequency of a mass-spring system',
				variables: ['f', 'k', 'm'],
				topic_id: 'shm'
			},
			{
				name: 'Max Velocity (SHM)',
				latex: 'v_{\\max} = A \\omega',
				description: 'Maximum velocity in simple harmonic motion',
				variables: ['v', 'A', '\\omega'],
				topic_id: 'shm'
			},
			{
				name: 'Max Acceleration (SHM)',
				latex: 'a_{\\max} = A \\omega^2',
				description: 'Maximum acceleration in simple harmonic motion',
				variables: ['a', 'A', '\\omega'],
				topic_id: 'shm'
			},
			{
				name: 'SHM Total Energy',
				latex: 'E = \\frac{1}{2} k A^2',
				description: 'Total mechanical energy of a simple harmonic oscillator',
				variables: ['E', 'k', 'A'],
				topic_id: 'shm'
			},
			{
				name: 'SHM Position',
				latex: 'x(t) = A \\cos(\\omega t)',
				description: 'Position as a function of time in simple harmonic motion',
				variables: ['x', 'A', '\\omega', 't'],
				topic_id: 'shm'
			},
			// Fluids
			{
				name: 'Pressure',
				latex: 'P = \\frac{F}{A}',
				description: 'Pressure equals force divided by area',
				variables: ['P', 'F', 'A'],
				topic_id: 'fluids'
			},
			{
				name: 'Hydrostatic Pressure',
				latex: 'P = \\rho g h',
				description: 'Pressure at a depth h in a fluid of density rho',
				variables: ['P', '\\rho', 'g', 'h'],
				topic_id: 'fluids'
			},
			{
				name: 'Buoyant Force',
				latex: 'F_b = \\rho V g',
				description: 'Buoyant force equals weight of displaced fluid',
				variables: ['F_b', '\\rho', 'V', 'g'],
				topic_id: 'fluids'
			},
			{
				name: 'Continuity Equation',
				latex: 'A_1 v_1 = A_2 v_2',
				description: 'Conservation of mass for incompressible fluid flow',
				variables: ['A_1', 'v_1', 'A_2', 'v_2'],
				topic_id: 'fluids'
			},
			{
				name: "Bernoulli's Equation",
				latex: 'P + \\frac{1}{2} \\rho v^2 + \\rho g h = \\text{const}',
				description: 'Conservation of energy for steady incompressible fluid flow',
				variables: ['P', '\\rho', 'v', 'g', 'h'],
				topic_id: 'fluids'
			},
			{
				name: 'Density',
				latex: '\\rho = \\frac{m}{V}',
				description: 'Density equals mass divided by volume',
				variables: ['\\rho', 'm', 'V'],
				topic_id: 'fluids'
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
			{
				name: 'Angular Frequency',
				latex: '\\omega = 2\\pi f',
				description: 'Angular frequency in terms of ordinary frequency',
				variables: ['\\omega', 'f'],
				topic_id: 'waves'
			},
			{
				name: 'Wave Number',
				latex: 'k = \\frac{2\\pi}{\\lambda}',
				description: 'Wave number in terms of wavelength',
				variables: ['k', '\\lambda'],
				topic_id: 'waves'
			},
			{
				name: 'Wave Equation',
				latex: 'y = A \\sin(k x - \\omega t)',
				description: 'Displacement of a traveling sinusoidal wave',
				variables: ['y', 'A', 'k', 'x', '\\omega', 't'],
				topic_id: 'waves'
			},
			{
				name: 'Superposition',
				latex: 'y = y_1 + y_2',
				description: 'Resultant displacement when two waves overlap',
				variables: ['y', 'y_1', 'y_2'],
				topic_id: 'waves'
			},
			{
				name: 'Constructive Interference',
				latex: '\\Delta x = m \\lambda',
				description: 'Path difference for constructive interference',
				variables: ['x', 'm', '\\lambda'],
				topic_id: 'waves'
			},
			{
				name: 'Destructive Interference',
				latex: '\\Delta x = (m + \\frac{1}{2}) \\lambda',
				description: 'Path difference for destructive interference',
				variables: ['x', 'm', '\\lambda'],
				topic_id: 'waves'
			},
			// Sound
			{
				name: 'Intensity',
				latex: 'I = \\frac{P}{A}',
				description: 'Sound intensity equals power per unit area',
				variables: ['I', 'P', 'A'],
				topic_id: 'sound'
			},
			{
				name: 'Intensity Level',
				latex: '\\beta = 10 \\log\\frac{I}{I_0}',
				description: 'Sound intensity level in decibels',
				variables: ['\\beta', 'I', 'I_0'],
				topic_id: 'sound'
			},
			{
				name: 'Doppler Effect',
				latex: "f' = f \\frac{v \\pm v_o}{v \\mp v_s}",
				description: 'Observed frequency when source or observer is moving',
				variables: ["f'", 'f', 'v', 'v_o', 'v_s'],
				topic_id: 'sound'
			},
			{
				name: 'Beat Frequency',
				latex: 'f_{\\text{beat}} = |f_1 - f_2|',
				description: 'Beat frequency from two slightly different frequencies',
				variables: ['f_{beat}', 'f_1', 'f_2'],
				topic_id: 'sound'
			},
			{
				name: 'Speed of Sound in Air',
				latex: 'v \\approx 331 + 0.6 T',
				description: 'Approximate speed of sound in air as a function of temperature',
				variables: ['v', 'T'],
				topic_id: 'sound'
			},
			// Electrostatics
			{
				name: "Coulomb's Law",
				latex: 'F = \\frac{k q_1 q_2}{r^2}',
				description: 'Electrostatic force between two point charges',
				variables: ['F', 'k', 'q_1', 'q_2', 'r'],
				topic_id: 'electrostatics'
			},
			{
				name: 'Electric Field (Point Charge)',
				latex: 'E = \\frac{k q}{r^2}',
				description: 'Electric field due to a point charge',
				variables: ['E', 'k', 'q', 'r'],
				topic_id: 'electrostatics'
			},
			{
				name: 'Electric Field from Force',
				latex: 'E = \\frac{F}{q}',
				description: 'Electric field equals force per unit charge',
				variables: ['E', 'F', 'q'],
				topic_id: 'electrostatics'
			},
			{
				name: 'Electric Potential',
				latex: 'V = \\frac{k q}{r}',
				description: 'Electric potential due to a point charge',
				variables: ['V', 'k', 'q', 'r'],
				topic_id: 'electrostatics'
			},
			{
				name: 'Electric Potential Energy',
				latex: 'U = \\frac{k q_1 q_2}{r}',
				description: 'Potential energy of two point charges',
				variables: ['U', 'k', 'q_1', 'q_2', 'r'],
				topic_id: 'electrostatics'
			},
			{
				name: 'Capacitance',
				latex: 'C = \\frac{Q}{V}',
				description: 'Capacitance equals charge divided by potential difference',
				variables: ['C', 'Q', 'V'],
				topic_id: 'electrostatics'
			},
			{
				name: 'Parallel Plate Capacitor',
				latex: 'C = \\frac{\\varepsilon_0 A}{d}',
				description: 'Capacitance of a parallel plate capacitor',
				variables: ['C', '\\varepsilon_0', 'A', 'd'],
				topic_id: 'electrostatics'
			},
			{
				name: 'Energy Stored in Capacitor',
				latex: 'U = \\frac{1}{2} C V^2',
				description: 'Energy stored in a charged capacitor',
				variables: ['U', 'C', 'V'],
				topic_id: 'electrostatics'
			},
			// DC Circuits
			{
				name: "Ohm's Law",
				latex: 'V = I R',
				description: 'Voltage equals current times resistance',
				variables: ['V', 'I', 'R'],
				topic_id: 'dc-circuits'
			},
			{
				name: 'Electric Power',
				latex: 'P = V I = I^2 R = \\frac{V^2}{R}',
				description: 'Electric power in terms of voltage, current, and resistance',
				variables: ['P', 'V', 'I', 'R'],
				topic_id: 'dc-circuits'
			},
			{
				name: 'Resistance in Series',
				latex: 'R_s = R_1 + R_2 + \\dots',
				description: 'Total resistance for resistors in series',
				variables: ['R_s', 'R_1', 'R_2'],
				topic_id: 'dc-circuits'
			},
			{
				name: 'Resistance in Parallel',
				latex: '\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\dots',
				description: 'Total resistance for resistors in parallel',
				variables: ['R_p', 'R_1', 'R_2'],
				topic_id: 'dc-circuits'
			},
			{
				name: "Kirchhoff's Voltage Law",
				latex: '\\sum V = 0',
				description: 'Sum of voltages around a closed loop is zero',
				variables: ['V'],
				topic_id: 'dc-circuits'
			},
			{
				name: "Kirchhoff's Current Law",
				latex: '\\sum I_{\\text{in}} = \\sum I_{\\text{out}}',
				description: 'Sum of currents entering a junction equals sum leaving',
				variables: ['I'],
				topic_id: 'dc-circuits'
			}
		];
	}
}
