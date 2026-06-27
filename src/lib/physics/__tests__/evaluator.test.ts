import {describe, it, expect} from 'vitest';
import {ExpressionEvaluator} from '../ExpressionEvaluator';
describe('ExpressionEvaluator', () => {
	const evaluator = new ExpressionEvaluator();
	it('evaluates basic arithmetic: 2+3=5, 10-4=6, 3*4=12, 10/2=5', () => {
		expect(evaluator.evaluate('2+3', {})).toBe(5);
		expect(evaluator.evaluate('10-4', {})).toBe(6);
		expect(evaluator.evaluate('3*4', {})).toBe(12);
		expect(evaluator.evaluate('10/2', {})).toBe(5);
	});
	it('evaluates variables: (v-v0)/t with v=30, v0=10, t=5 -> 4', () => {
		expect(evaluator.evaluate('(v-v0)/t', {v: 30, v0: 10, t: 5})).toBe(4);
	});
	it('evaluates degree-based trig: sin(90)~=1, cos(0)=1', () => {
		expect(evaluator.evaluate('sin(90)', {})).toBeCloseTo(1, 10);
		expect(evaluator.evaluate('cos(0)', {})).toBeCloseTo(1, 10);
	});
	it('evaluates sqrt(16)=4', () => {
		expect(evaluator.evaluate('sqrt(16)', {})).toBe(4);
	});
	it('evaluates a complex expression sqrt(2*9.81*h) with h=20', () => {
		expect(evaluator.evaluate('sqrt(2*9.81*h)', {h: 20})).toBeCloseTo(Math.sqrt(2 * 9.81 * 20), 10);
	});
	it('resolves constants pi and e', () => {
		expect(evaluator.evaluate('pi', {})).toBeCloseTo(Math.PI, 10);
		expect(evaluator.evaluate('e', {})).toBeCloseTo(Math.E, 10);
	});
	it('throws on an empty expression', () => {
		expect(() => evaluator.evaluate('', {})).toThrow('Empty expression');
		expect(() => evaluator.evaluate('   ', {})).toThrow('Empty expression');
	});
	it('throws on division by zero', () => {
		expect(() => evaluator.evaluate('5/0', {})).toThrow('Division by zero');
	});
	it('evaluates unary minus: -5, --5, -3+7', () => {
		expect(evaluator.evaluate('-5', {})).toBe(-5);
		expect(evaluator.evaluate('--5', {})).toBe(5);
		expect(evaluator.evaluate('-3+7', {})).toBe(4);
	});
	it('honors operator precedence: 2+3*4=14, 10-2*3=4, (2+3)*4=20', () => {
		expect(evaluator.evaluate('2+3*4', {})).toBe(14);
		expect(evaluator.evaluate('10-2*3', {})).toBe(4);
		expect(evaluator.evaluate('(2+3)*4', {})).toBe(20);
	});
	it('evaluates nested parentheses: ((2+3))=5, (2*(3+4))=14', () => {
		expect(evaluator.evaluate('((2+3))', {})).toBe(5);
		expect(evaluator.evaluate('(2*(3+4))', {})).toBe(14);
	});
	it('evaluates floor, ceiling, truncate', () => {
		expect(evaluator.evaluate('floor(3.7)', {})).toBe(3);
		expect(evaluator.evaluate('ceiling(3.1)', {})).toBe(4);
		expect(evaluator.evaluate('truncate(-3.7)', {})).toBe(-3);
	});
	it('evaluates pow(2,3)=8, pow(5,0)=1', () => {
		expect(evaluator.evaluate('pow(2,3)', {})).toBe(8);
		expect(evaluator.evaluate('pow(5,0)', {})).toBe(1);
	});
	it('evaluates ln(e)~=1, log(1000)=3 and throws on ln(-1) and log(0)', () => {
		expect(evaluator.evaluate('ln(e)', {})).toBeCloseTo(1, 10);
		expect(evaluator.evaluate('log(1000)', {})).toBe(3);
		expect(() => evaluator.evaluate('ln(-1)', {})).toThrow('ln of non-positive number');
		expect(() => evaluator.evaluate('log(0)', {})).toThrow('log of non-positive number');
	});
	it('evaluates min and max', () => {
		expect(evaluator.evaluate('min(3,7)', {})).toBe(3);
		expect(evaluator.evaluate('max(3,7)', {})).toBe(7);
	});
	it('evaluates round with and without decimals', () => {
		expect(evaluator.evaluate('round(3.14159)', {})).toBe(3);
		expect(evaluator.evaluate('round(3.14159,2)', {})).toBeCloseTo(3.14, 10);
	});
	it('evaluates sign', () => {
		expect(evaluator.evaluate('sign(5)', {})).toBe(1);
		expect(evaluator.evaluate('sign(-3)', {})).toBe(-1);
		expect(evaluator.evaluate('sign(0)', {})).toBe(0);
	});
	it('throws on an unknown token', () => {
		expect(() => evaluator.evaluate('foo', {})).toThrow('Unknown token: foo');
	});
	it('throws on sqrt of a negative number', () => {
		expect(() => evaluator.evaluate('sqrt(-4)', {})).toThrow('sqrt of negative number');
	});
	it('evaluates right-associative exponentiation: 2^3^2=512', () => {
		expect(evaluator.evaluate('2^3^2', {})).toBe(512);
	});
	it('evaluates log2(8)=3 and throws on log2(0)', () => {
		expect(evaluator.evaluate('log2(8)', {})).toBe(3);
		expect(() => evaluator.evaluate('log2(0)', {})).toThrow('log2 of non-positive number');
	});
	it('evaluates cbrt(27)~=3 and cbrt(-8)~-2', () => {
		expect(evaluator.evaluate('cbrt(27)', {})).toBeCloseTo(3, 10);
		expect(evaluator.evaluate('cbrt(-8)', {})).toBeCloseTo(-2, 10);
	});
	it('evaluates hypot(3,4)=5', () => {
		expect(evaluator.evaluate('hypot(3,4)', {})).toBe(5);
	});
	it('evaluates deg(pi)~=180 and rad(180)~=pi', () => {
		expect(evaluator.evaluate('deg(pi)', {})).toBeCloseTo(180, 10);
		expect(evaluator.evaluate('rad(180)', {})).toBeCloseTo(Math.PI, 10);
	});
	it('evaluates hyperbolic functions sinh, cosh, tanh at 0', () => {
		expect(evaluator.evaluate('sinh(0)', {})).toBe(0);
		expect(evaluator.evaluate('cosh(0)', {})).toBe(1);
		expect(evaluator.evaluate('tanh(0)', {})).toBe(0);
	});
	it('evaluates inverse hyperbolic functions and throws on invalid acosh/atanh', () => {
		expect(evaluator.evaluate('asinh(0)', {})).toBe(0);
		expect(evaluator.evaluate('acosh(1)', {})).toBe(0);
		expect(() => evaluator.evaluate('acosh(0)', {})).toThrow('acosh requires argument >= 1');
		expect(evaluator.evaluate('atanh(0)', {})).toBe(0);
		expect(() => evaluator.evaluate('atanh(1)', {})).toThrow('atanh requires argument');
	});
	it('parses numeric-string variables and rejects non-numeric strings', () => {
		expect(evaluator.evaluate('x', {x: '5'})).toBe(5);
		expect(() => evaluator.evaluate('x', {x: 'abc'})).toThrow('Unknown token: x');
	});
	it('formats numeric values stripping trailing zeros', () => {
		expect(evaluator.formatNumeric(3)).toBe('3');
		expect(evaluator.formatNumeric(3.14)).toBe('3.14');
		expect(evaluator.formatNumeric(2.5)).toBe('2.5');
		expect(evaluator.formatNumeric(-7)).toBe('-7');
	});
	it('compares answers with tolerance: exact, within, outside, zero, non-numeric', () => {
		expect(evaluator.compareAnswers('4', '4', 0.01)).toBe(true);
		expect(evaluator.compareAnswers('4.001', '4', 0.01)).toBe(true);
		expect(evaluator.compareAnswers('5', '4', 0.01)).toBe(false);
		expect(evaluator.compareAnswers('0', '0', 0.01)).toBe(true);
		expect(evaluator.compareAnswers('abc', '4', 0.01)).toBe(false);
		expect(evaluator.compareAnswers('4', '', 0.01)).toBe(false);
	});
	it('throws on unknown function calls', () => {
		expect(() => evaluator.evaluate('bogus(1)', {})).toThrow('Unknown function: bogus');
	});
	it('throws on missing closing parenthesis', () => {
		expect(() => evaluator.evaluate('(2+3', {})).toThrow('Missing closing parenthesis');
	});
	it('throws on a function call missing its closing parenthesis', () => {
		expect(() => evaluator.evaluate('sqrt(16', {})).toThrow('Missing closing parenthesis after function');
	});
	it('throws on unexpected end when a trailing operator has no right operand', () => {
		expect(() => evaluator.evaluate('2+', {})).toThrow('Unexpected end of expression');
	});
	it('ignores unknown characters while tokenizing and surfaces them as parse errors', () => {
		expect(() => evaluator.evaluate('2+@', {})).toThrow('Unexpected end of expression');
	});
});
