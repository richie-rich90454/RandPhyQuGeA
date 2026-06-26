import {describe, it, expect} from 'vitest';
import {FormulaLibrary} from '../FormulaLibrary';
describe('FormulaLibrary', () => {
	const lib = new FormulaLibrary();
	it('getAll() returns a non-empty list of at least 20 formulas', () => {
		const all = lib.getAll();
		expect(all.length).toBeGreaterThanOrEqual(20);
	});
	it('getByTopic("kinematics") is non-empty and contains Free Fall Distance', () => {
		const result = lib.getByTopic('kinematics');
		expect(result.length).toBeGreaterThan(0);
		expect(result.map(f => f.name)).toContain('Free Fall Distance');
	});
	it('getByTopic("electricity") contains Ohm\'s Law', () => {
		const result = lib.getByTopic('electricity');
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
});
