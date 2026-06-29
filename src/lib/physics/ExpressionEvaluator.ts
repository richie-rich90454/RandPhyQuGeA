import type {EvaluatorFunction, ExpressionEvaluatorLike} from './contracts';
interface ParseResult {
	value: number;
	position: number;
}
/** Registry of named math functions for the expression evaluator (open-closed). */
export class FunctionRegistry {
	private readonly functions: Map<string, EvaluatorFunction>;
	public constructor() {
		this.functions = new Map();
	}
	/** Register a function under its name (case-insensitive). */
	public register(fn: EvaluatorFunction): void {
		this.functions.set(fn.name.toLowerCase(), fn);
	}
	/** Look up a function by name (case-insensitive). */
	public get(name: string): EvaluatorFunction | undefined {
		return this.functions.get(name.toLowerCase());
	}
	/** Build a registry pre-populated with the standard math functions. */
	public static createDefault(): FunctionRegistry {
		const registry = new FunctionRegistry();
		registry.register({name: 'sin', arity: 1, invoke: args => Math.sin((FunctionRegistry.first(args) * Math.PI) / 180)});
		registry.register({name: 'cos', arity: 1, invoke: args => Math.cos((FunctionRegistry.first(args) * Math.PI) / 180)});
		registry.register({name: 'tan', arity: 1, invoke: args => Math.tan((FunctionRegistry.first(args) * Math.PI) / 180)});
		registry.register({name: 'asin', arity: 1, invoke: args => (Math.asin(FunctionRegistry.first(args)) * 180) / Math.PI});
		registry.register({name: 'acos', arity: 1, invoke: args => (Math.acos(FunctionRegistry.first(args)) * 180) / Math.PI});
		registry.register({name: 'atan', arity: 1, invoke: args => (Math.atan(FunctionRegistry.first(args)) * 180) / Math.PI});
		registry.register({
			name: 'sqrt',
			arity: 1,
			invoke: args => {
				const a = FunctionRegistry.first(args);
				if (a < 0) {
					throw new Error('sqrt of negative number');
				}
				return Math.sqrt(a);
			}
		});
		registry.register({name: 'pow', arity: 2, invoke: args => Math.pow(FunctionRegistry.first(args), FunctionRegistry.second(args, 'pow'))});
		registry.register({name: 'cbrt', arity: 1, invoke: args => Math.cbrt(FunctionRegistry.first(args))});
		registry.register({name: 'hypot', arity: 2, invoke: args => Math.hypot(FunctionRegistry.first(args), FunctionRegistry.second(args, 'hypot'))});
		registry.register({name: 'abs', arity: 1, invoke: args => Math.abs(FunctionRegistry.first(args))});
		registry.register({name: 'exp', arity: 1, invoke: args => Math.exp(FunctionRegistry.first(args))});
		registry.register({name: 'floor', arity: 1, invoke: args => Math.floor(FunctionRegistry.first(args))});
		registry.register({name: 'ceiling', arity: 1, invoke: args => Math.ceil(FunctionRegistry.first(args))});
		registry.register({name: 'truncate', arity: 1, invoke: args => Math.trunc(FunctionRegistry.first(args))});
		registry.register({
			name: 'sign',
			arity: 1,
			invoke: args => {
				const a = FunctionRegistry.first(args);
				if (a > 0) {
					return 1;
				}
				if (a < 0) {
					return -1;
				}
				return 0;
			}
		});
		registry.register({
			name: 'round',
			arity: null,
			invoke: args => {
				const a = FunctionRegistry.first(args);
				if (args.length >= 2) {
					const decimals = args[1];
					if (decimals !== undefined) {
						const factor = Math.pow(10, Math.trunc(decimals));
						return Math.round(a * factor) / factor;
					}
				}
				return Math.round(a);
			}
		});
		registry.register({
			name: 'ln',
			arity: 1,
			invoke: args => {
				const a = FunctionRegistry.first(args);
				if (a <= 0) {
					throw new Error('ln of non-positive number');
				}
				return Math.log(a);
			}
		});
		registry.register({
			name: 'log',
			arity: 1,
			invoke: args => {
				const a = FunctionRegistry.first(args);
				if (a <= 0) {
					throw new Error('log of non-positive number');
				}
				return Math.log10(a);
			}
		});
		registry.register({
			name: 'log10',
			arity: 1,
			invoke: args => {
				const a = FunctionRegistry.first(args);
				if (a <= 0) {
					throw new Error('log of non-positive number');
				}
				return Math.log10(a);
			}
		});
		registry.register({
			name: 'log2',
			arity: 1,
			invoke: args => {
				const a = FunctionRegistry.first(args);
				if (a <= 0) {
					throw new Error('log2 of non-positive number');
				}
				return Math.log2(a);
			}
		});
		registry.register({name: 'max', arity: 2, invoke: args => Math.max(FunctionRegistry.first(args), FunctionRegistry.second(args, 'max'))});
		registry.register({name: 'min', arity: 2, invoke: args => Math.min(FunctionRegistry.first(args), FunctionRegistry.second(args, 'min'))});
		registry.register({name: 'deg', arity: 1, invoke: args => (FunctionRegistry.first(args) * 180) / Math.PI});
		registry.register({name: 'rad', arity: 1, invoke: args => (FunctionRegistry.first(args) * Math.PI) / 180});
		registry.register({name: 'sinh', arity: 1, invoke: args => Math.sinh(FunctionRegistry.first(args))});
		registry.register({name: 'cosh', arity: 1, invoke: args => Math.cosh(FunctionRegistry.first(args))});
		registry.register({name: 'tanh', arity: 1, invoke: args => Math.tanh(FunctionRegistry.first(args))});
		registry.register({name: 'asinh', arity: 1, invoke: args => Math.asinh(FunctionRegistry.first(args))});
		registry.register({
			name: 'acosh',
			arity: 1,
			invoke: args => {
				const a = FunctionRegistry.first(args);
				if (a < 1) {
					throw new Error('acosh requires argument >= 1');
				}
				return Math.acosh(a);
			}
		});
		registry.register({
			name: 'atanh',
			arity: 1,
			invoke: args => {
				const a = FunctionRegistry.first(args);
				if (a <= -1 || a >= 1) {
					throw new Error('atanh requires argument in (-1, 1)');
				}
				return Math.atanh(a);
			}
		});
		return registry;
	}
	private static first(args: number[]): number {
		if (args.length < 1) {
			throw new Error('Function requires at least 1 argument');
		}
		const v = args[0];
		if (v === undefined) {
			throw new Error('Function requires at least 1 argument');
		}
		return v;
	}
	private static second(args: number[], name: string): number {
		if (args.length < 2) {
			throw new Error(`${name} requires 2 arguments`);
		}
		const v = args[1];
		if (v === undefined) {
			throw new Error(`${name} requires 2 arguments`);
		}
		return v;
	}
}
/** Expression evaluator with tokenizer, recursive-descent parser, and degree-based trig. */
export class ExpressionEvaluator implements ExpressionEvaluatorLike {
	private readonly functions: FunctionRegistry;
	public constructor(functions?: FunctionRegistry) {
		this.functions = functions ?? FunctionRegistry.createDefault();
	}
	/** Evaluate an expression against a variable map. Throws on errors. */
	public evaluate(expression: string, variables: Record<string, unknown>): number {
		const expr = expression.trim();
		if (expr.length === 0) {
			throw new Error('Empty expression');
		}
		const tokens = this.tokenize(expr);
		return this.parseExpression(tokens, 0, variables).value;
	}
	/** Format a numeric answer: integers as-is, otherwise 4 decimals with trailing zeros stripped. Uses scientific notation for very small or very large magnitudes. */
	public formatNumeric(value: number): string {
		if (value === Math.trunc(value) && Math.abs(value) < 1e15) {
			return String(Math.trunc(value));
		}
		const absValue = Math.abs(value);
		if (absValue > 0 && (absValue < 1e-4 || absValue >= 1e6)) {
			const exp = value.toExponential(4);
			return exp.replace(/(\d)0+e/, '$1e').replace(/e\+/, 'e');
		}
		return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
	}
	/** Compare two numeric answers with a relative tolerance. Non-numeric strings return false. */
	public compareAnswers(userAnswer: string, correctAnswer: string, tolerance: number): boolean {
		const userTrimmed = userAnswer.trim();
		if (userTrimmed.length === 0) {
			return false;
		}
		const user = Number(userTrimmed);
		if (Number.isNaN(user)) {
			return false;
		}
		const correctTrimmed = correctAnswer.trim();
		if (correctTrimmed.length === 0) {
			return false;
		}
		const correct = Number(correctTrimmed);
		if (Number.isNaN(correct)) {
			return false;
		}
		if (correct === 0) {
			return Math.abs(user) < 1e-9;
		}
		const relativeError = Math.abs(user - correct) / Math.abs(correct);
		return relativeError < tolerance;
	}
	private tokenize(expr: string): string[] {
		const tokens: string[] = [];
		const chars = Array.from(expr);
		let i = 0;
		while (i < chars.length) {
			const c = chars[i];
			if (c === undefined) {
				break;
			}
			if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
				i++;
				continue;
			}
			if (c === '+' || c === '-' || c === '*' || c === '/' || c === '^' || c === '(' || c === ')' || c === ',') {
				tokens.push(c);
				i++;
				continue;
			}
			if (ExpressionEvaluator.isDigit(c) || c === '.') {
				let num = '';
				while (i < chars.length) {
					const ch = chars[i];
					if (ch === undefined) {
						break;
					}
					if (!(ExpressionEvaluator.isDigit(ch) || ch === '.')) {
						break;
					}
					num += ch;
					i++;
				}
				if (i < chars.length) {
					const expChar = chars[i];
					if (expChar !== undefined && (expChar === 'e' || expChar === 'E')) {
						const signIdx = i + 1;
						const signChar = chars[signIdx];
						const digitAfterSign = chars[signIdx + 1];
						if (signChar !== undefined && (signChar === '+' || signChar === '-') && digitAfterSign !== undefined && ExpressionEvaluator.isDigit(digitAfterSign)) {
							num += expChar + signChar;
							i = signIdx + 1;
							while (i < chars.length) {
								const ch = chars[i];
								if (ch === undefined || !ExpressionEvaluator.isDigit(ch)) {
									break;
								}
								num += ch;
								i++;
							}
						}
						else if (signChar !== undefined && ExpressionEvaluator.isDigit(signChar)) {
							num += expChar;
							i = signIdx;
							while (i < chars.length) {
								const ch = chars[i];
								if (ch === undefined || !ExpressionEvaluator.isDigit(ch)) {
									break;
								}
								num += ch;
								i++;
							}
						}
					}
				}
				tokens.push(num);
				continue;
			}
			if (ExpressionEvaluator.isAlpha(c) || c === '_') {
				let ident = '';
				while (i < chars.length) {
					const ch = chars[i];
					if (ch === undefined) {
						break;
					}
					if (!(ExpressionEvaluator.isAlpha(ch) || ExpressionEvaluator.isDigit(ch) || ch === '_')) {
						break;
					}
					ident += ch;
					i++;
				}
				tokens.push(ident);
				continue;
			}
			i++;
		}
		return tokens;
	}
	private parseExpression(tokens: string[], pos: number, variables: Record<string, unknown>): ParseResult {
		const term = this.parseTerm(tokens, pos, variables);
		let value = term.value;
		let currentPos = term.position;
		while (currentPos < tokens.length) {
			const op = tokens[currentPos];
			if (op === '+') {
				const right = this.parseTerm(tokens, currentPos + 1, variables);
				value = value + right.value;
				currentPos = right.position;
				continue;
			}
			if (op === '-') {
				const right = this.parseTerm(tokens, currentPos + 1, variables);
				value = value - right.value;
				currentPos = right.position;
				continue;
			}
			break;
		}
		return {value, position: currentPos};
	}
	private parseTerm(tokens: string[], pos: number, variables: Record<string, unknown>): ParseResult {
		const base = this.parsePower(tokens, pos, variables);
		let value = base.value;
		let currentPos = base.position;
		while (currentPos < tokens.length) {
			const op = tokens[currentPos];
			if (op === '*') {
				const right = this.parsePower(tokens, currentPos + 1, variables);
				value = value * right.value;
				currentPos = right.position;
				continue;
			}
			if (op === '/') {
				const right = this.parsePower(tokens, currentPos + 1, variables);
				if (right.value === 0) {
					throw new Error('Division by zero');
				}
				value = value / right.value;
				currentPos = right.position;
				continue;
			}
			break;
		}
		return {value, position: currentPos};
	}
	private parsePower(tokens: string[], pos: number, variables: Record<string, unknown>): ParseResult {
		const base = this.parseFactor(tokens, pos, variables);
		const currentPos = base.position;
		if (currentPos < tokens.length && tokens[currentPos] === '^') {
			const exp = this.parsePower(tokens, currentPos + 1, variables);
			return {value: Math.pow(base.value, exp.value), position: exp.position};
		}
		return {value: base.value, position: currentPos};
	}
	private parseFactor(tokens: string[], pos: number, variables: Record<string, unknown>): ParseResult {
		if (pos >= tokens.length) {
			throw new Error('Unexpected end of expression');
		}
		const token = tokens[pos];
		if (token === undefined) {
			throw new Error('Unexpected end of expression');
		}
		if (token === '-') {
			const inner = this.parseFactor(tokens, pos + 1, variables);
			return {value: -inner.value, position: inner.position};
		}
		if (token === '(') {
			const inner = this.parseExpression(tokens, pos + 1, variables);
			const closePos = inner.position;
			if (closePos < tokens.length && tokens[closePos] === ')') {
				return {value: inner.value, position: closePos + 1};
			}
			throw new Error('Missing closing parenthesis');
		}
		const num = Number(token);
		if (!Number.isNaN(num)) {
			return {value: num, position: pos + 1};
		}
		if (pos + 1 < tokens.length && tokens[pos + 1] === '(') {
			const arg1Result = this.parseExpression(tokens, pos + 2, variables);
			let currentPos = arg1Result.position;
			const args = [arg1Result.value];
			if (currentPos < tokens.length && tokens[currentPos] === ',') {
				const arg2Result = this.parseExpression(tokens, currentPos + 1, variables);
				args.push(arg2Result.value);
				currentPos = arg2Result.position;
			}
			if (currentPos < tokens.length && tokens[currentPos] === ')') {
				const fn = this.functions.get(token);
				if (fn === undefined) {
					throw new Error(`Unknown function: ${token}`);
				}
				return {value: fn.invoke(args), position: currentPos + 1};
			}
			throw new Error('Missing closing parenthesis after function');
		}
		const varValue = variables[token];
		if (typeof varValue === 'number') {
			return {value: varValue, position: pos + 1};
		}
		if (typeof varValue === 'string') {
			const parsed = Number(varValue);
			if (!Number.isNaN(parsed)) {
				return {value: parsed, position: pos + 1};
			}
			throw new Error(`Unknown token: ${token}`);
		}
		const constant = this.getConstant(token);
		if (constant !== null) {
			return {value: constant, position: pos + 1};
		}
		throw new Error(`Unknown token: ${token}`);
	}
	private getConstant(name: string): number | null {
		const lower = name.toLowerCase();
		if (lower === 'pi') {
			return Math.PI;
		}
		if (lower === 'e') {
			return Math.E;
		}
		return null;
	}
	private static isDigit(c: string): boolean {
		return c >= '0' && c <= '9';
	}
	private static isAlpha(c: string): boolean {
		return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
	}
}
