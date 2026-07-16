import type {GeneratedQuestion, QuestionTemplate, VariableDefinition, ExportFormat, ResponseMode} from "./types";
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
/** Context passed to a {@link ResponseFormatStrategy} when generating distractors. */
export interface DistractorContext {
	/** The canonical formatted answer string (e.g. "42" or "True"). */
	answer: string;
	/** The raw numeric answer value before formatting (NaN when non-numeric). */
	answerValue: number;
	/** The template being rendered (provides distractor_expressions as hints). */
	template: QuestionTemplate;
	/** The resolved variables for this question instance. */
	variables: Record<string, unknown>;
	/** The expression evaluator (for evaluating distractor expressions). */
	evaluator: ExpressionEvaluatorLike;
}
/** Produces type-appropriate distractor choices for a question type (Strategy pattern). Implementations are registered with {@link UniversalDistractorGenerator} per `questionType` key; the generator dedupes their output against the correct answer before returning. */
export interface ResponseFormatStrategy {
	/** The question type key this strategy serves (e.g. 'MC', 'NE', 'TF', 'FB', 'SA'). */
	readonly questionType: string;
	/** Generate up to `count` distractor strings, excluding the correct answer. The caller dedupes and scales the result, so strategies may return more or fewer than `count` items. */
	generateDistractors(context: DistractorContext, count: number, random: RandomGenerator): string[];
}
/** Result of grading a user response against a generated question. */
export interface GradeResult {
	/** Whether the response is correct. */
	is_correct: boolean;
	/** The normalized user response used for comparison. */
	normalized_response: string;
	/** The normalized canonical answer used for comparison. */
	normalized_answer: string;
}
/** Grades a user response against a {@link GeneratedQuestion}, dispatching by response mode and question type. */
export interface AnswerGraderLike {
	/** Grade the response; `selectedIndex` applies to MCQ mode (choice index). */
	grade(question: GeneratedQuestion, response: string, selectedIndex?: number): GradeResult;
}
/** Normalizes a mathematical/string expression for equivalence comparison. */
export interface ExpressionNormalizerLike {
	/** Return a canonical normalized form of the input expression. */
	normalize(input: string): string;
}
/** Assembles a multiple-choice question from a base free-response question by attaching choices. */
export interface McqAssemblerLike {
	/** Decorate a base FRQ question with choices, correct_choice_index, and response_mode='mcq'. When `seed` is provided, distractor generation and shuffle use a SeededRandom so ordering is stable for that seed. */
	assemble(question: GeneratedQuestion, context: DistractorContext, random: RandomGenerator, choiceCount?: number, seed?: number): GeneratedQuestion;
}
/** Picks a {@link ResponseFormatStrategy} per question type and dedupes/scales distractors. */
export interface UniversalDistractorGeneratorLike {
	/** Generate up to `count` unique distractors for the given question type, excluding the correct answer. The returned array may be shorter than `count` when the strategy cannot produce enough unique distractors. */
	generate(context: DistractorContext, count: number, random: RandomGenerator): string[];
	/** Register a custom strategy for a question type (open-closed extension point). */
	register(strategy: ResponseFormatStrategy): void;
}
/** Resolves the response mode for a filter, defaulting to 'frq' when undefined. */
export function resolveResponseMode(mode: ResponseMode | undefined): ResponseMode {
	return mode ?? "frq";
}
