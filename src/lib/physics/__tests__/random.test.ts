import {describe, it, expect} from 'vitest';
import {UniformRandomGenerator, SeededRandomGenerator, TemplateSubstituter, IntVariableHandler, DoubleVariableHandler, EnumVariableHandler, VariableGenerator, VariableTypeRegistry} from '../random';
import type {VariableDefinition} from '../types';
import type {RandomGenerator} from '../contracts';
describe('UniformRandomGenerator', () => {
	it('generates ints within [1,10] over 100 iterations', () => {
		const rng = new UniformRandomGenerator();
		for (let i = 0; i < 100; i++) {
			const v = rng.nextInt(1, 10);
			expect(v).toBeGreaterThanOrEqual(1);
			expect(v).toBeLessThanOrEqual(10);
		}
	});
	it('returns min when min==max for nextInt', () => {
		const rng = new UniformRandomGenerator();
		expect(rng.nextInt(5, 5)).toBe(5);
	});
	it('returns min when min>max for nextInt', () => {
		const rng = new UniformRandomGenerator();
		expect(rng.nextInt(10, 5)).toBe(10);
	});
	it('generates doubles within [0,10) over 100 iterations', () => {
		const rng = new UniformRandomGenerator();
		for (let i = 0; i < 100; i++) {
			const v = rng.nextDouble(0, 10);
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(10);
		}
	});
	it('returns min when min==max for nextDouble', () => {
		const rng = new UniformRandomGenerator();
		expect(rng.nextDouble(5, 5)).toBe(5);
	});
	it('picks an element from a non-empty array and throws on empty', () => {
		const rng = new UniformRandomGenerator();
		const items = ['a', 'b', 'c'];
		expect(items).toContain(rng.pick(items));
		expect(() => rng.pick([])).toThrow('Cannot pick from an empty array');
	});
	it('shuffles an array preserving the element set', () => {
		const rng = new UniformRandomGenerator();
		const items = [1, 2, 3, 4, 5];
		const shuffled = rng.shuffle([...items]);
		expect(shuffled.sort()).toEqual(items);
	});
});
describe('SeededRandomGenerator', () => {
	it('produces identical sequences for the same seed', () => {
		const a = new SeededRandomGenerator(42);
		const b = new SeededRandomGenerator(42);
		const seqA = [a.next(), a.next(), a.next(), a.next(), a.next()];
		const seqB = [b.next(), b.next(), b.next(), b.next(), b.next()];
		expect(seqA).toEqual(seqB);
	});
	it('returns min when min>=max', () => {
		const rng = new SeededRandomGenerator(7);
		expect(rng.nextInt(3, 3)).toBe(3);
		expect(rng.nextDouble(3, 3)).toBe(3);
	});
});
describe('Variable type handlers', () => {
	it('IntVariableHandler generates ints within [1,100]', () => {
		const handler = new IntVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'x', var_type: 'int', min: 1, max: 100};
		for (let i = 0; i < 50; i++) {
			const v = handler.generate(def, rng) as number;
			expect(v).toBeGreaterThanOrEqual(1);
			expect(v).toBeLessThanOrEqual(100);
		}
	});
	it('IntVariableHandler falls back to 0/100 when min/max undefined', () => {
		const handler = new IntVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'x', var_type: 'int'};
		const v = handler.generate(def, rng) as number;
		expect(v).toBeGreaterThanOrEqual(0);
		expect(v).toBeLessThanOrEqual(100);
	});
	it('DoubleVariableHandler generates stepped values in {0,0.5,...,10}', () => {
		const handler = new DoubleVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'x', var_type: 'double', min: 0, max: 10, step: 0.5};
		for (let i = 0; i < 50; i++) {
			const v = handler.generate(def, rng) as number;
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThanOrEqual(10);
			expect((v * 2) % 1).toBeCloseTo(0, 10);
		}
	});
	it('DoubleVariableHandler returns min when step is zero', () => {
		const handler = new DoubleVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'x', var_type: 'double', min: 3, max: 10, step: 0};
		expect(handler.generate(def, rng)).toBe(3);
	});
	it('DoubleVariableHandler returns min when steps<=0', () => {
		const handler = new DoubleVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'x', var_type: 'double', min: 10, max: 3, step: 1};
		expect(handler.generate(def, rng)).toBe(10);
	});
	it('EnumVariableHandler picks from the value set', () => {
		const handler = new EnumVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'd', var_type: 'enum', enum_values: ['1', '2', '3']};
		const allowed = [1, 2, 3];
		for (let i = 0; i < 50; i++) {
			expect(allowed).toContain(handler.generate(def, rng));
		}
	});
	it('EnumVariableHandler returns 0 for an empty set', () => {
		const handler = new EnumVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'd', var_type: 'enum', enum_values: []};
		expect(handler.generate(def, rng)).toBe(0);
	});
	it('EnumVariableHandler returns 0 for non-numeric picked values', () => {
		const handler = new EnumVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'd', var_type: 'enum', enum_values: ['North', 'South']};
		expect(handler.generate(def, rng)).toBe(0);
	});
});
describe('VariableGenerator', () => {
	it('generates a value map and defaults unknown types to 0', () => {
		const gen = new VariableGenerator();
		const rng = new SeededRandomGenerator(1);
		const defs: VariableDefinition[] = [
			{name: 'x', var_type: 'int', min: 1, max: 10},
			{name: 'y', var_type: 'bogus'}
		];
		const vars = gen.generate(defs, rng);
		expect(vars.x).toBeGreaterThanOrEqual(1);
		expect(vars.y).toBe(0);
	});
});
describe('VariableTypeRegistry', () => {
	it('registers and retrieves handlers (open-closed)', () => {
		const registry = new VariableTypeRegistry();
		const custom = {type: 'custom', generate: () => 99};
		registry.register(custom);
		expect(registry.get('custom')).toBe(custom);
		expect(registry.get('missing')).toBeUndefined();
	});
});
describe('TemplateSubstituter', () => {
	const substituter = new TemplateSubstituter();
	it('substitutes {v0},{v},{t} with formatted values', () => {
		expect(substituter.substitute('A car {v0} to {v} in {t}', {v0: 5, v: 10, t: 2})).toBe('A car 5 to 10 in 2');
	});
	it('leaves unknown variable tokens as-is', () => {
		expect(substituter.substitute('Unknown {z}', {x: 1})).toBe('Unknown {z}');
	});
	it('substitutes multiple occurrences of the same variable', () => {
		expect(substituter.substitute('{x} plus {x}', {x: 3})).toBe('3 plus 3');
	});
	it('formats numeric values stripping trailing zeros', () => {
		expect(substituter.formatValue(3.14)).toBe('3.14');
		expect(substituter.formatValue(5)).toBe('5');
		expect(substituter.formatValue(2.5)).toBe('2.5');
	});
	it('substitutes string variable values verbatim', () => {
		expect(substituter.substitute('dir={d}', {d: 'North'})).toBe('dir=North');
	});
});
describe('Random handler edge cases', () => {
	it('shuffle leaves an single-element array and an empty array unchanged', () => {
		const rng = new UniformRandomGenerator();
		expect(rng.shuffle([])).toEqual([]);
		expect(rng.shuffle([42])).toEqual([42]);
	});
	it('DoubleVariableHandler clamps to max when float drift pushes the stepped value past max', () => {
		const handler = new DoubleVariableHandler();
		const maxStepRandom: RandomGenerator = {
			next: () => 0,
			nextInt: (_min: number, max: number) => max,
			nextDouble: (min: number, max: number) => (min < max ? min : max),
			pick: <T>(items: T[]) => items[0] as T,
			shuffle: <T>(items: T[]) => items
		};
		const def: VariableDefinition = {name: 'x', var_type: 'double', min: 0, max: 3, step: 0.6};
		expect(handler.generate(def, maxStepRandom)).toBe(3);
	});
	it('DoubleVariableHandler falls back to 0/100/1 defaults when min/max/step are absent', () => {
		const handler = new DoubleVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'x', var_type: 'double'};
		const v = handler.generate(def, rng) as number;
		expect(v).toBeGreaterThanOrEqual(0);
		expect(v).toBeLessThanOrEqual(100);
	});
	it('IntVariableHandler truncates non-integer min/max bounds', () => {
		const handler = new IntVariableHandler();
		const rng = new SeededRandomGenerator(1);
		const def: VariableDefinition = {name: 'x', var_type: 'int', min: 1.9, max: 5.7};
		for (let i = 0; i < 20; i++) {
			const v = handler.generate(def, rng) as number;
			expect(v).toBeGreaterThanOrEqual(1);
			expect(v).toBeLessThanOrEqual(5);
		}
	});
});
