import {describe, it, expect} from 'vitest';
import katex from 'katex';
import {FormulaLibrary} from '../FormulaLibrary';
const EXPECTED_TOPIC_IDS = [
	'kinematics',
	'dynamics',
	'circular-motion',
	'gravitation',
	'energy',
	'momentum',
	'torque',
	'rotational-motion',
	'shm',
	'fluids',
	'waves',
	'sound',
	'electrostatics',
	'dc-circuits'
];
function renderLatex(tex: string): boolean {
	try {
		katex.renderToString(tex, {displayMode: true, throwOnError: true});
		return true;
	} catch {
		return false;
	}
}
describe('FormulaLibrary', () => {
	const lib = new FormulaLibrary();
	it('getAll() returns a non-empty list of at least 60 formulas', () => {
		const all = lib.getAll();
		expect(all.length).toBeGreaterThanOrEqual(60);
	});
	it('getByTopic("kinematics") is non-empty and contains Free Fall Distance', () => {
		const result = lib.getByTopic('kinematics');
		expect(result.length).toBeGreaterThan(0);
		expect(result.map(f => f.name)).toContain('Free Fall Distance');
	});
	it('getByTopic("dc-circuits") contains Ohm\'s Law', () => {
		const result = lib.getByTopic('dc-circuits');
		expect(result.map(f => f.name)).toContain("Ohm's Law");
	});
	it('search("Newton") returns entries whose names contain Newton', () => {
		const result = lib.search('Newton');
		expect(result.length).toBeGreaterThan(0);
		expect(result.some(f => f.name.includes('Newton'))).toBe(true);
	});
	it('search("friction") returns the Friction Force entry', () => {
		const result = lib.search('friction');
		expect(result.length).toBeGreaterThan(0);
		expect(result.some(f => f.name.includes('Friction Force'))).toBe(true);
	});
	it('search("quantum tunneling") returns an empty list', () => {
		expect(lib.search('quantum tunneling')).toEqual([]);
	});
	it('accepts a custom formula list', () => {
		const custom = [{name: 'Custom', latex: 'x', description: 'd', variables: ['x'], topic_id: 't'}];
		const customLib = new FormulaLibrary(custom);
		expect(customLib.getAll().length).toBe(1);
		expect(customLib.getByTopic('t').length).toBe(1);
	});
	it('getByTopic returns at least 2 entries for every expected topic id', () => {
		for (const id of EXPECTED_TOPIC_IDS) {
			const entries = lib.getByTopic(id);
			expect(entries.length).toBeGreaterThanOrEqual(2);
		}
	});
	it('every formula topic_id is one of the expected topic ids', () => {
		const all = lib.getAll();
		const topicSet = new Set(EXPECTED_TOPIC_IDS);
		for (const f of all) {
			expect(f.topic_id).toBeDefined();
			expect(topicSet.has(f.topic_id ?? '')).toBe(true);
		}
	});
	it('every formula latex renders via KaTeX', () => {
		const all = lib.getAll();
		for (const f of all) {
			expect(renderLatex(f.latex)).toBe(true);
		}
	});
	it('every formula has a non-empty name, description, and variables list', () => {
		const all = lib.getAll();
		for (const f of all) {
			expect(f.name.length).toBeGreaterThan(0);
			expect(f.description.length).toBeGreaterThan(0);
			expect(f.variables.length).toBeGreaterThan(0);
		}
	});
});
