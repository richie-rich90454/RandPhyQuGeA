import {describe, it, expect} from "vitest";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
describe("ExpressionEvaluator", () => {
    const evaluator = new ExpressionEvaluator();
    it("evaluates basic arithmetic: 2+3=5, 10-4=6, 3*4=12, 10/2=5", () => {
        expect(evaluator.evaluate("2+3", {})).toBe(5);
        expect(evaluator.evaluate("10-4", {})).toBe(6);
        expect(evaluator.evaluate("3*4", {})).toBe(12);
        expect(evaluator.evaluate("10/2", {})).toBe(5);
    });
    it("evaluates variables: (v-v0)/t with v=30, v0=10, t=5 -> 4", () => {
        expect(evaluator.evaluate("(v-v0)/t", {v: 30, v0: 10, t: 5})).toBe(4);
    });
    it("evaluates degree-based trig: sin(90)~=1, cos(0)=1", () => {
        expect(evaluator.evaluate("sin(90)", {})).toBeCloseTo(1, 10);
        expect(evaluator.evaluate("cos(0)", {})).toBeCloseTo(1, 10);
    });
    it("evaluates sqrt(16)=4", () => {
        expect(evaluator.evaluate("sqrt(16)", {})).toBe(4);
    });
    it("evaluates a complex expression sqrt(2*9.81*h) with h=20", () => {
        expect(evaluator.evaluate("sqrt(2*9.81*h)", {h: 20})).toBeCloseTo(Math.sqrt(2 * 9.81 * 20), 10);
    });
    it("resolves constants pi and e", () => {
        expect(evaluator.evaluate("pi", {})).toBeCloseTo(Math.PI, 10);
        expect(evaluator.evaluate("e", {})).toBeCloseTo(Math.E, 10);
    });
    it("throws on an empty expression", () => {
        expect(() => evaluator.evaluate("", {})).toThrow("Empty expression");
        expect(() => evaluator.evaluate("   ", {})).toThrow("Empty expression");
    });
    it("throws on division by zero", () => {
        expect(() => evaluator.evaluate("5/0", {})).toThrow("Division by zero");
    });
    it("evaluates unary minus: -5, --5, -3+7", () => {
        expect(evaluator.evaluate("-5", {})).toBe(-5);
        expect(evaluator.evaluate("--5", {})).toBe(5);
        expect(evaluator.evaluate("-3+7", {})).toBe(4);
    });
    it("honors operator precedence: 2+3*4=14, 10-2*3=4, (2+3)*4=20", () => {
        expect(evaluator.evaluate("2+3*4", {})).toBe(14);
        expect(evaluator.evaluate("10-2*3", {})).toBe(4);
        expect(evaluator.evaluate("(2+3)*4", {})).toBe(20);
    });
    it("evaluates nested parentheses: ((2+3))=5, (2*(3+4))=14", () => {
        expect(evaluator.evaluate("((2+3))", {})).toBe(5);
        expect(evaluator.evaluate("(2*(3+4))", {})).toBe(14);
    });
    it("evaluates floor, ceiling, truncate", () => {
        expect(evaluator.evaluate("floor(3.7)", {})).toBe(3);
        expect(evaluator.evaluate("ceiling(3.1)", {})).toBe(4);
        expect(evaluator.evaluate("truncate(-3.7)", {})).toBe(-3);
    });
    it("evaluates pow(2,3)=8, pow(5,0)=1", () => {
        expect(evaluator.evaluate("pow(2,3)", {})).toBe(8);
        expect(evaluator.evaluate("pow(5,0)", {})).toBe(1);
    });
    it("evaluates ln(e)~=1, log(1000)=3 and throws on ln(-1) and log(0)", () => {
        expect(evaluator.evaluate("ln(e)", {})).toBeCloseTo(1, 10);
        expect(evaluator.evaluate("log(1000)", {})).toBe(3);
        expect(() => evaluator.evaluate("ln(-1)", {})).toThrow("ln of non-positive number");
        expect(() => evaluator.evaluate("log(0)", {})).toThrow("log of non-positive number");
    });
    it("evaluates min and max", () => {
        expect(evaluator.evaluate("min(3,7)", {})).toBe(3);
        expect(evaluator.evaluate("max(3,7)", {})).toBe(7);
    });
    it("evaluates round with and without decimals", () => {
        expect(evaluator.evaluate("round(3.14159)", {})).toBe(3);
        expect(evaluator.evaluate("round(3.14159,2)", {})).toBeCloseTo(3.14, 10);
    });
    it("evaluates sign", () => {
        expect(evaluator.evaluate("sign(5)", {})).toBe(1);
        expect(evaluator.evaluate("sign(-3)", {})).toBe(-1);
        expect(evaluator.evaluate("sign(0)", {})).toBe(0);
    });
    it("throws on an unknown token", () => {
        expect(() => evaluator.evaluate("foo", {})).toThrow("Unknown token: foo");
    });
    it("throws on sqrt of a negative number", () => {
        expect(() => evaluator.evaluate("sqrt(-4)", {})).toThrow("sqrt of negative number");
    });
    it("evaluates right-associative exponentiation: 2^3^2=512", () => {
        expect(evaluator.evaluate("2^3^2", {})).toBe(512);
    });
    it("evaluates log2(8)=3 and throws on log2(0)", () => {
        expect(evaluator.evaluate("log2(8)", {})).toBe(3);
        expect(() => evaluator.evaluate("log2(0)", {})).toThrow("log2 of non-positive number");
    });
    it("evaluates cbrt(27)~=3 and cbrt(-8)~-2", () => {
        expect(evaluator.evaluate("cbrt(27)", {})).toBeCloseTo(3, 10);
        expect(evaluator.evaluate("cbrt(-8)", {})).toBeCloseTo(-2, 10);
    });
    it("evaluates hypot(3,4)=5", () => {
        expect(evaluator.evaluate("hypot(3,4)", {})).toBe(5);
    });
    it("evaluates deg(pi)~=180 and rad(180)~=pi", () => {
        expect(evaluator.evaluate("deg(pi)", {})).toBeCloseTo(180, 10);
        expect(evaluator.evaluate("rad(180)", {})).toBeCloseTo(Math.PI, 10);
    });
    it("evaluates hyperbolic functions sinh, cosh, tanh at 0", () => {
        expect(evaluator.evaluate("sinh(0)", {})).toBe(0);
        expect(evaluator.evaluate("cosh(0)", {})).toBe(1);
        expect(evaluator.evaluate("tanh(0)", {})).toBe(0);
    });
    it("evaluates inverse hyperbolic functions and throws on invalid acosh/atanh", () => {
        expect(evaluator.evaluate("asinh(0)", {})).toBe(0);
        expect(evaluator.evaluate("acosh(1)", {})).toBe(0);
        expect(() => evaluator.evaluate("acosh(0)", {})).toThrow("acosh requires argument >= 1");
        expect(evaluator.evaluate("atanh(0)", {})).toBe(0);
        expect(() => evaluator.evaluate("atanh(1)", {})).toThrow("atanh requires argument");
    });
    it("parses numeric-string variables and rejects non-numeric strings", () => {
        expect(evaluator.evaluate("x", {x: "5"})).toBe(5);
        expect(() => evaluator.evaluate("x", {x: "abc"})).toThrow("Unknown token: x");
    });
    it("formats numeric values stripping trailing zeros", () => {
        expect(evaluator.formatNumeric(3)).toBe("3");
        expect(evaluator.formatNumeric(3.14)).toBe("3.14");
        expect(evaluator.formatNumeric(2.5)).toBe("2.5");
        expect(evaluator.formatNumeric(-7)).toBe("-7");
    });
    it("compares answers with tolerance: exact, within, outside, zero, non-numeric", () => {
        expect(evaluator.compareAnswers("4", "4", 0.01)).toBe(true);
        expect(evaluator.compareAnswers("4.001", "4", 0.01)).toBe(true);
        expect(evaluator.compareAnswers("5", "4", 0.01)).toBe(false);
        expect(evaluator.compareAnswers("0", "0", 0.01)).toBe(true);
        expect(evaluator.compareAnswers("abc", "4", 0.01)).toBe(false);
        expect(evaluator.compareAnswers("4", "", 0.01)).toBe(false);
    });
    it("throws on unknown function calls", () => {
        expect(() => evaluator.evaluate("bogus(1)", {})).toThrow("Unknown function: bogus");
    });
    it("throws on missing closing parenthesis", () => {
        expect(() => evaluator.evaluate("(2+3", {})).toThrow("Missing closing parenthesis");
    });
    it("throws on a function call missing its closing parenthesis", () => {
        expect(() => evaluator.evaluate("sqrt(16", {})).toThrow("Missing closing parenthesis after function");
    });
    it("throws on unexpected end when a trailing operator has no right operand", () => {
        expect(() => evaluator.evaluate("2+", {})).toThrow("Unexpected end of expression");
    });
    it("ignores unknown characters while tokenizing and surfaces them as parse errors", () => {
        expect(() => evaluator.evaluate("2+@", {})).toThrow("Unexpected end of expression");
    });
});
describe("ExpressionEvaluator power-operator error handling (task 5.19)", () => {
    const evaluator = new ExpressionEvaluator();
    it("throws on 0^(-1) via ^ operator (division by zero via power)", () => {
        expect(() => evaluator.evaluate("0^-1", {})).toThrow("Division by zero: zero raised to a negative power");
    });
    it("throws on 0^(-2) via ^ operator (division by zero via power)", () => {
        expect(() => evaluator.evaluate("0^-2", {})).toThrow("Division by zero: zero raised to a negative power");
    });
    it("throws on (-1)^(0.5) via ^ operator (sqrt of negative via power)", () => {
        expect(() => evaluator.evaluate("(-1)^0.5", {})).toThrow("Negative base with fractional exponent");
    });
    it("throws on (-2)^(1.5) via ^ operator (sqrt of negative via power)", () => {
        expect(() => evaluator.evaluate("(-2)^1.5", {})).toThrow("Negative base with fractional exponent");
    });
    it("allows 0^0, 0^2, 2^(-1) and (-2)^3 via ^ operator", () => {
        expect(evaluator.evaluate("0^0", {})).toBe(1);
        expect(evaluator.evaluate("0^2", {})).toBe(0);
        expect(evaluator.evaluate("2^-1", {})).toBe(0.5);
        expect(evaluator.evaluate("(-2)^3", {})).toBe(-8);
    });
    it("throws on pow(0,-1) via pow function (division by zero via power)", () => {
        expect(() => evaluator.evaluate("pow(0,-1)", {})).toThrow("Division by zero: zero raised to a negative power");
    });
    it("throws on pow(-1,0.5) via pow function (sqrt of negative via power)", () => {
        expect(() => evaluator.evaluate("pow(-1,0.5)", {})).toThrow("Negative base with fractional exponent");
    });
    it("allows pow(2,3)=8 and pow(5,0)=1 and pow(-2,3)=-8 (preventive fix)", () => {
        expect(evaluator.evaluate("pow(2,3)", {})).toBe(8);
        expect(evaluator.evaluate("pow(5,0)", {})).toBe(1);
        expect(evaluator.evaluate("pow(-2,3)", {})).toBe(-8);
    });
});
describe("ExpressionEvaluator existing error handling regression (task 5.19 preventive fix)", () => {
    const evaluator = new ExpressionEvaluator();
    it("still throws on division by zero via / operator (preventive fix)", () => {
        expect(() => evaluator.evaluate("5/0", {})).toThrow("Division by zero");
    });
    it("still throws on sqrt of a negative number (preventive fix)", () => {
        expect(() => evaluator.evaluate("sqrt(-4)", {})).toThrow("sqrt of negative number");
    });
    it("still throws on ln of non-positive number (preventive fix)", () => {
        expect(() => evaluator.evaluate("ln(-1)", {})).toThrow("ln of non-positive number");
        expect(() => evaluator.evaluate("ln(0)", {})).toThrow("ln of non-positive number");
    });
    it("still throws on log of non-positive number (preventive fix)", () => {
        expect(() => evaluator.evaluate("log(-1)", {})).toThrow("log of non-positive number");
        expect(() => evaluator.evaluate("log(0)", {})).toThrow("log of non-positive number");
    });
    it("still throws on log2 of non-positive number (preventive fix)", () => {
        expect(() => evaluator.evaluate("log2(0)", {})).toThrow("log2 of non-positive number");
    });
    it("still throws on log10 of non-positive number (preventive fix)", () => {
        expect(() => evaluator.evaluate("log10(-2)", {})).toThrow("log of non-positive number");
    });
    it("still throws on mod by zero (preventive fix)", () => {
        expect(() => evaluator.evaluate("mod(5,0)", {})).toThrow("mod by zero");
    });
    it("still throws on even root of a negative number (preventive fix)", () => {
        expect(() => evaluator.evaluate("root(-4,2)", {})).toThrow("even root of a negative number");
    });
});
describe("ExpressionEvaluator trig degree/radian consistency (task 5.20)", () => {
    const evaluator = new ExpressionEvaluator();
    it("throws on tan(90) (undefined angle, consistent with cot/sec/csc)", () => {
        expect(() => evaluator.evaluate("tan(90)", {})).toThrow("tan undefined at this angle");
    });
    it("throws on tan(270) (undefined angle)", () => {
        expect(() => evaluator.evaluate("tan(270)", {})).toThrow("tan undefined at this angle");
    });
    it("evaluates tan(0)=0, tan(45)~=1, tan(60)~=sqrt(3)", () => {
        expect(evaluator.evaluate("tan(0)", {})).toBeCloseTo(0, 10);
        expect(evaluator.evaluate("tan(45)", {})).toBeCloseTo(1, 10);
        expect(evaluator.evaluate("tan(60)", {})).toBeCloseTo(Math.sqrt(3), 10);
    });
    it("throws on asin(2) and asin(-1.5) (out of domain [-1, 1])", () => {
        expect(() => evaluator.evaluate("asin(2)", {})).toThrow("asin requires argument in [-1, 1]");
        expect(() => evaluator.evaluate("asin(-1.5)", {})).toThrow("asin requires argument in [-1, 1]");
    });
    it("throws on acos(2) and acos(-2) (out of domain [-1, 1])", () => {
        expect(() => evaluator.evaluate("acos(2)", {})).toThrow("acos requires argument in [-1, 1]");
        expect(() => evaluator.evaluate("acos(-2)", {})).toThrow("acos requires argument in [-1, 1]");
    });
    it("evaluates asin(1)=90, asin(0)=0, asin(-1)=-90 (degrees, in-domain)", () => {
        expect(evaluator.evaluate("asin(1)", {})).toBeCloseTo(90, 10);
        expect(evaluator.evaluate("asin(0)", {})).toBeCloseTo(0, 10);
        expect(evaluator.evaluate("asin(-1)", {})).toBeCloseTo(-90, 10);
    });
    it("evaluates acos(1)=0, acos(0)=90, acos(-1)=180 (degrees, in-domain)", () => {
        expect(evaluator.evaluate("acos(1)", {})).toBeCloseTo(0, 10);
        expect(evaluator.evaluate("acos(0)", {})).toBeCloseTo(90, 10);
        expect(evaluator.evaluate("acos(-1)", {})).toBeCloseTo(180, 10);
    });
    it("round-trips sin/asin: asin(sin(30))~=30 (degree consistency)", () => {
        expect(evaluator.evaluate("asin(sin(30))", {})).toBeCloseTo(30, 10);
    });
    it("round-trips cos/acos: acos(cos(60))~=60 (degree consistency)", () => {
        expect(evaluator.evaluate("acos(cos(60))", {})).toBeCloseTo(60, 10);
    });
});
describe("ExpressionEvaluator trig consistency preventive fixes (task 5.20)", () => {
    const evaluator = new ExpressionEvaluator();
    it("sin and cos use degrees: sin(90)~=1, cos(90)~=0 (preventive fix)", () => {
        expect(evaluator.evaluate("sin(90)", {})).toBeCloseTo(1, 10);
        expect(evaluator.evaluate("cos(90)", {})).toBeCloseTo(0, 10);
    });
    it("atan returns degrees: atan(1)~=45 (preventive fix)", () => {
        expect(evaluator.evaluate("atan(1)", {})).toBeCloseTo(45, 10);
    });
    it("sec throws on undefined angle sec(90) (preventive fix)", () => {
        expect(() => evaluator.evaluate("sec(90)", {})).toThrow("sec undefined at this angle");
    });
    it("csc throws on undefined angle csc(0) (preventive fix)", () => {
        expect(() => evaluator.evaluate("csc(0)", {})).toThrow("csc undefined at this angle");
    });
    it("cot throws on undefined angle cot(0) (preventive fix)", () => {
        expect(() => evaluator.evaluate("cot(0)", {})).toThrow("cot undefined at this angle");
    });
    it("deg/rad conversion: deg(pi)~=180, rad(180)~=pi (preventive fix)", () => {
        expect(evaluator.evaluate("deg(pi)", {})).toBeCloseTo(180, 10);
        expect(evaluator.evaluate("rad(180)", {})).toBeCloseTo(Math.PI, 10);
    });
});
