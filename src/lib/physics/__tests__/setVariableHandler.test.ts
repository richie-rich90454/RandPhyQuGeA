import {describe, it, expect} from "vitest";
import {SetVariableHandler, EnumVariableHandler, BoolVariableHandler, VariableGenerator, VariableTypeRegistry, SeededRandomGenerator} from "../random";
import type {VariableDefinition} from "../types";
import type {RandomGenerator} from "../contracts";
class StubRandom implements RandomGenerator {
	public next(): number {
		return 0;
	}
	public nextInt(min: number, max: number): number {
		return Math.max(min, Math.min(max, 0));
	}
	public nextDouble(min: number, _max: number): number {
		return min;
	}
	public pick<T>(items: T[]): T {
		return items[0]!;
	}
	public shuffle<T>(items: T[]): T[] {
		return [...items];
	}
}
describe("SetVariableHandler", () => {
	it("picks a value from enum_values and returns it verbatim as a string", () => {
		const handler = new SetVariableHandler();
		const def: VariableDefinition = {name: "unit", var_type: "set", enum_values: ["N", "J", "W"]};
		expect(handler.generate(def, new StubRandom())).toBe("N");
	});
	it("returns non-numeric values without coercing to 0 (unlike enum)", () => {
		const setHandler = new SetVariableHandler();
		const enumHandler = new EnumVariableHandler();
		const def: VariableDefinition = {name: "dir", var_type: "set", enum_values: ["North", "South"]};
		expect(setHandler.generate(def, new StubRandom())).toBe("North");
		expect(enumHandler.generate(def, new StubRandom())).toBe(0);
	});
	it("returns an empty string when enum_values is absent", () => {
		const handler = new SetVariableHandler();
		const def: VariableDefinition = {name: "s", var_type: "set"};
		expect(handler.generate(def, new StubRandom())).toBe("");
	});
	it("returns an empty string when enum_values is empty", () => {
		const handler = new SetVariableHandler();
		const def: VariableDefinition = {name: "s", var_type: "set", enum_values: []};
		expect(handler.generate(def, new StubRandom())).toBe("");
	});
	it("picks only from the defined value set under a seeded rng", () => {
		const handler = new SetVariableHandler();
		const rng = new SeededRandomGenerator(5);
		const def: VariableDefinition = {name: "u", var_type: "set", enum_values: ["N", "J", "W"]};
		const allowed = new Set(["N", "J", "W"]);
		for (let i = 0; i < 50; i++) {
			expect(allowed.has(handler.generate(def, rng) as string)).toBe(true);
		}
	});
});
describe("SetVariableHandler registration", () => {
	it("is reachable through the default VariableTypeRegistry", () => {
		const registry = VariableTypeRegistry.createDefault();
		const handler = registry.get("set");
		expect(handler).toBeDefined();
		expect(handler).toBeInstanceOf(SetVariableHandler);
	});
	it("integrates with VariableGenerator to produce a string for set vars", () => {
		const gen = new VariableGenerator();
		const def: VariableDefinition = {name: "unit", var_type: "set", enum_values: ["N", "J", "W"]};
		const vars = gen.generate([def], new StubRandom());
		expect(vars.unit).toBe("N");
		expect(typeof vars.unit).toBe("string");
	});
});
describe("BoolVariableHandler (task 2.28 confirmation)", () => {
	it("is reachable through the default VariableTypeRegistry", () => {
		const registry = VariableTypeRegistry.createDefault();
		const handler = registry.get("bool");
		expect(handler).toBeDefined();
		expect(handler).toBeInstanceOf(BoolVariableHandler);
	});
	it("integrates with VariableGenerator to produce 0 or 1 for bool vars", () => {
		const gen = new VariableGenerator();
		const rng = new SeededRandomGenerator(7);
		const def: VariableDefinition = {name: "flag", var_type: "bool"};
		for (let i = 0; i < 50; i++) {
			const vars = gen.generate([def], rng);
			expect(vars.flag === 0 || vars.flag === 1).toBe(true);
		}
	});
});
