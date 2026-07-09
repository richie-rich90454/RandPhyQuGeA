import {describe, it, expect} from "vitest";
import {ExpressionEvaluator, FunctionRegistry} from "../ExpressionEvaluator";
describe("Evaluator functions: sec/csc/cot (degree-based reciprocal trig)", () => {
	const evaluator = new ExpressionEvaluator();
	it("evaluates sec(0)=1, sec(60)~=2, sec(180)=-1", () => {
		expect(evaluator.evaluate("sec(0)", {})).toBeCloseTo(1, 10);
		expect(evaluator.evaluate("sec(60)", {})).toBeCloseTo(2, 10);
		expect(evaluator.evaluate("sec(180)", {})).toBeCloseTo(-1, 10);
	});
	it("throws on sec(90) where cos is ~0", () => {
		expect(() => evaluator.evaluate("sec(90)", {})).toThrow("sec undefined at this angle");
	});
	it("evaluates csc(30)~=2, csc(90)=1", () => {
		expect(evaluator.evaluate("csc(30)", {})).toBeCloseTo(2, 10);
		expect(evaluator.evaluate("csc(90)", {})).toBeCloseTo(1, 10);
	});
	it("throws on csc(0) where sin is 0", () => {
		expect(() => evaluator.evaluate("csc(0)", {})).toThrow("csc undefined at this angle");
	});
	it("evaluates cot(45)~=1, cot(90)~=0", () => {
		expect(evaluator.evaluate("cot(45)", {})).toBeCloseTo(1, 10);
		expect(evaluator.evaluate("cot(90)", {})).toBeCloseTo(0, 10);
	});
	it("throws on cot(0) where sin is 0", () => {
		expect(() => evaluator.evaluate("cot(0)", {})).toThrow("cot undefined at this angle");
	});
});
describe("Evaluator functions: logb (logarithm with arbitrary base)", () => {
	const evaluator = new ExpressionEvaluator();
	it("evaluates logb(8,2)=3, logb(100,10)=2, logb(1,7)=0", () => {
		expect(evaluator.evaluate("logb(8,2)", {})).toBeCloseTo(3, 10);
		expect(evaluator.evaluate("logb(100,10)", {})).toBeCloseTo(2, 10);
		expect(evaluator.evaluate("logb(1,7)", {})).toBeCloseTo(0, 10);
	});
	it("throws on non-positive argument", () => {
		expect(() => evaluator.evaluate("logb(-1,2)", {})).toThrow("logb of non-positive number");
		expect(() => evaluator.evaluate("logb(0,2)", {})).toThrow("logb of non-positive number");
	});
	it("throws on non-positive base or base of 1", () => {
		expect(() => evaluator.evaluate("logb(8,1)", {})).toThrow("logb requires a positive base not equal to 1");
		expect(() => evaluator.evaluate("logb(8,0)", {})).toThrow("logb requires a positive base not equal to 1");
		expect(() => evaluator.evaluate("logb(8,-2)", {})).toThrow("logb requires a positive base not equal to 1");
	});
});
describe("Evaluator functions: root (n-th root)", () => {
	const evaluator = new ExpressionEvaluator();
	it("evaluates root(27,3)=3, root(16,4)=2, root(16,2)=4", () => {
		expect(evaluator.evaluate("root(27,3)", {})).toBeCloseTo(3, 10);
		expect(evaluator.evaluate("root(16,4)", {})).toBeCloseTo(2, 10);
		expect(evaluator.evaluate("root(16,2)", {})).toBeCloseTo(4, 10);
	});
	it("evaluates odd root of a negative number: root(-8,3)=-2", () => {
		expect(evaluator.evaluate("root(-8,3)", {})).toBeCloseTo(-2, 10);
	});
	it("throws on even root of a negative number", () => {
		expect(() => evaluator.evaluate("root(-4,2)", {})).toThrow("even root of a negative number");
	});
	it("throws on a zero degree", () => {
		expect(() => evaluator.evaluate("root(5,0)", {})).toThrow("root requires a non-zero degree");
	});
});
describe("Evaluator functions: gamma (Lanczos approximation)", () => {
	const evaluator = new ExpressionEvaluator();
	it("evaluates gamma(n)=(n-1)! for positive integers: gamma(1)=1, gamma(4)=6, gamma(5)=24", () => {
		expect(evaluator.evaluate("gamma(1)", {})).toBeCloseTo(1, 6);
		expect(evaluator.evaluate("gamma(2)", {})).toBeCloseTo(1, 6);
		expect(evaluator.evaluate("gamma(3)", {})).toBeCloseTo(2, 6);
		expect(evaluator.evaluate("gamma(4)", {})).toBeCloseTo(6, 6);
		expect(evaluator.evaluate("gamma(5)", {})).toBeCloseTo(24, 6);
	});
	it("evaluates gamma(0.5)~=sqrt(pi) and gamma(1.5)~=sqrt(pi)/2 via reflection", () => {
		expect(evaluator.evaluate("gamma(0.5)", {})).toBeCloseTo(Math.sqrt(Math.PI), 8);
		expect(evaluator.evaluate("gamma(1.5)", {})).toBeCloseTo(Math.sqrt(Math.PI) / 2, 8);
	});
	it("evaluates gamma(-0.5)~-2*sqrt(pi) via reflection formula", () => {
		expect(evaluator.evaluate("gamma(-0.5)", {})).toBeCloseTo(-2 * Math.sqrt(Math.PI), 6);
	});
	it("throws at non-positive integers (gamma(0), gamma(-1))", () => {
		expect(() => evaluator.evaluate("gamma(0)", {})).toThrow("gamma undefined at non-positive integers");
		expect(() => evaluator.evaluate("gamma(-1)", {})).toThrow("gamma undefined at non-positive integers");
	});
});
describe("Evaluator functions: mod (floored modulo)", () => {
	const evaluator = new ExpressionEvaluator();
	it("evaluates mod(10,3)=1, mod(7,7)=0, mod(2.5,1)=0.5", () => {
		expect(evaluator.evaluate("mod(10,3)", {})).toBeCloseTo(1, 10);
		expect(evaluator.evaluate("mod(7,7)", {})).toBeCloseTo(0, 10);
		expect(evaluator.evaluate("mod(2.5,1)", {})).toBeCloseTo(0.5, 10);
	});
	it("returns a non-negative result for a negative dividend: mod(-3,5)=2", () => {
		expect(evaluator.evaluate("mod(-3,5)", {})).toBeCloseTo(2, 10);
	});
	it("throws on mod by zero", () => {
		expect(() => evaluator.evaluate("mod(5,0)", {})).toThrow("mod by zero");
	});
});
describe("FunctionRegistry: new functions are registered (case-insensitive)", () => {
	it("looks up sec/csc/cot/logb/root/gamma/mod in the default registry", () => {
		const registry = FunctionRegistry.createDefault();
		for (const name of ["sec", "csc", "cot", "logb", "root", "gamma", "mod"]) {
			expect(registry.get(name)).toBeDefined();
			expect(registry.get(name.toUpperCase())).toBeDefined();
		}
	});
	it("a custom registry exposes only the explicitly registered function", () => {
		const registry = new FunctionRegistry();
		registry.register({name: "gamma", arity: 1, invoke: args => args[0]! * 2});
		expect(registry.get("gamma")).toBeDefined();
		expect(registry.get("sec")).toBeUndefined();
		const evaluator = new ExpressionEvaluator(registry);
		expect(evaluator.evaluate("gamma(3)", {})).toBeCloseTo(6, 10);
		expect(() => evaluator.evaluate("sec(0)", {})).toThrow("Unknown function: sec");
	});
	it("2-arg functions throw when called with too few arguments", () => {
		const evaluator = new ExpressionEvaluator();
		expect(() => evaluator.evaluate("logb(8)", {})).toThrow("logb requires 2 arguments");
		expect(() => evaluator.evaluate("root(27)", {})).toThrow("root requires 2 arguments");
		expect(() => evaluator.evaluate("mod(10)", {})).toThrow("mod requires 2 arguments");
	});
});
