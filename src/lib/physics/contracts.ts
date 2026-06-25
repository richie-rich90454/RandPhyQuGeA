import type {GeneratedQuestion, QuestionTemplate, VariableDefinition, ExportFormat} from './types';
/** A random number generator abstraction for dependency injection. */
export interface RandomGenerator {
	/** Returns a float in [0, 1). */
	next(): number;
	/** Returns an int in [min, max] inclusive. */
	nextInt(min: number, max: number): number;
	/** Returns a float in [min, max). */
	nextDouble(min: number, max: number): number;
	/** Picks a random element from a non-empty array. */
	pick<T>(items: T[]): T;
	/** Shuffles an array in place and returns it. */
	shuffle<T>(items: T[]): T[];
}
/** Handles a specific question type (Strategy pattern). */
export interface QuestionTypeHandler {
	/** The normalized question type key this handler serves (e.g. 'MC', 'SA'). */
	readonly type: string;
	/** Build a GeneratedQuestion from a template and resolved variables. */
	handle(template: QuestionTemplate, variables: Record<string, unknown>, evaluator: ExpressionEvaluatorLike, random: RandomGenerator): GeneratedQuestion;
}
/** Minimal evaluator surface needed by handlers (avoids tight coupling). */
export interface ExpressionEvaluatorLike {
	/** Evaluate an expression against a variable map, returning a number. */
	evaluate(expression: string, variables: Record<string, unknown>): number;
	/** Format a numeric answer with trailing-zero stripping. */
	formatNumeric(value: number): string;
}
/** Converts questions to an exported string format. */
export interface Exporter {
	/** The format key this exporter serves (e.g. 'html', 'markdown'). */
	readonly format: ExportFormat;
	/** Render the questions as a string. */
	export(questions: GeneratedQuestion[]): string;
}
/** Generates a value for a specific variable type. */
export interface VariableTypeHandler {
	/** The variable type key this handler serves (e.g. 'int', 'double', 'enum'). */
	readonly type: string;
	/** Generate a value for the given variable definition. */
	generate(def: VariableDefinition, random: RandomGenerator): unknown;
}
/** A named math function invocable from expressions. */
export interface EvaluatorFunction {
	readonly name: string;
	readonly arity: number | null; // null = variadic
	invoke(args: number[]): number;
}
