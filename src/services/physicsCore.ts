/**
 * Service facade over the pure-TypeScript {@link PhysicsCore}.
 *
 * The application reaches domain logic exclusively through this module. A
 * single shared `PhysicsCore.default()` instance handles parsing, question
 * generation, export, and the formula library. The public API stays async
 * so existing call sites (originally written against the Tauri/WASM bridge)
 * continue to compile and behave identically. Advanced consumers can swap the
 * singleton's collaborators (custom question/variable types, exporters,
 * evaluator functions, or a seeded random source) via {@link configureCore}.
 */
import partOneSpec from '../assets/part_one.txt?raw';
import {PhysicsCore, ExpressionEvaluator, VariableGenerator} from '../lib/physics';
import type {QuestionFilter, RandomGenerator, ExporterRegistry, FunctionRegistry, QuestionTypeRegistry, VariableTypeRegistry} from '../lib/physics';
import type {Specification, GeneratedQuestion, FormulaEntry, ExportFormat} from '../types/models';
/** Optional filters applied to question generation. */
export interface GenerateOptions {
	topicId?: string;
	skillId?: string;
	minDifficulty?: number;
	maxDifficulty?: number;
	questionType?: string;
}
/** Shared singleton physics core used by every service function; replaced by {@link configureCore}. */
let core = PhysicsCore.default();
/** Map the public {@link GenerateOptions} to the core's {@link QuestionFilter}. */
function toFilter(options?: GenerateOptions): QuestionFilter | undefined {
	if (!options) {
		return undefined;
	}
	return {
		topicId: options.topicId,
		skillId: options.skillId,
		minDifficulty: options.minDifficulty,
		maxDifficulty: options.maxDifficulty,
		questionType: options.questionType
	};
}
/** Collaborators that can be injected when (re)building the shared core via {@link configureCore}. Any omitted field keeps its default implementation. */
export interface ConfigureCoreOptions {
	/** Custom exporter registry (e.g. with additional output formats). */
	exporters?: ExporterRegistry;
	/** Custom function registry for the expression evaluator (e.g. domain-specific math functions). */
	functions?: FunctionRegistry;
	/** Custom question-type registry (e.g. with a handler for a new question type). */
	questionTypes?: QuestionTypeRegistry;
	/** Custom variable-type registry (e.g. with a handler for a new variable type). */
	variableTypes?: VariableTypeRegistry;
	/** Custom random generator (e.g. a seeded generator for reproducible output). */
	random?: RandomGenerator;
}
/**
 * Replace the shared physics-core singleton with one built from the given
 * collaborators. Any omitted option keeps its default implementation, so
 * `configureCore({})` resets the singleton to the standard configuration.
 *
 * This is the public extension point for advanced consumers that need to
 * inject custom question-type handlers, variable-type handlers, exporters,
 * evaluator functions, or a deterministic random source without reaching
 * into the pure-TypeScript core directly.
 *
 * @example
 * // Register a custom question type and route generation through it:
 * const registry = QuestionTypeRegistry.createDefault();
 * registry.register(new MyCustomHandler());
 * configureCore({questionTypes: registry});
 * const q = await generateQuestion(spec);
 */
export function configureCore(options: ConfigureCoreOptions): void {
	const evaluator = options.functions !== undefined ? new ExpressionEvaluator(options.functions) : undefined;
	const variableGenerator = options.variableTypes !== undefined ? new VariableGenerator(options.variableTypes) : undefined;
	core = new PhysicsCore(undefined, evaluator, options.exporters, undefined, options.random, options.questionTypes, variableGenerator);
}
/** Parse a spec text file into a {@link Specification}. */
export async function parseSpecification(input: string): Promise<Specification> {
	return core.parseSpecification(input);
}
/**
 * Generate a single question from a specification.
 *
 * Throws when no template matches the requested filter, mirroring the
 * previous Tauri/WASM contract that always returned a question.
 */
export async function generateQuestion(spec: Specification, options?: GenerateOptions): Promise<GeneratedQuestion> {
	const question = core.generateQuestion(spec, toFilter(options));
	if (!question) {
		throw new Error('No question template matches the requested filter.');
	}
	return question;
}
/** Generate a batch of questions from a specification. */
export async function generateBatch(spec: Specification, count: number, options?: GenerateOptions): Promise<GeneratedQuestion[]> {
	return core.generateBatch(spec, count, toFilter(options));
}
/** Export questions to the given format and return the rendered string. */
export async function exportQuestions(questions: GeneratedQuestion[], format: ExportFormat): Promise<string> {
	return core.exportQuestions(questions, format);
}
/** Return the standard physics formula library. */
export async function getFormulaLibrary(): Promise<FormulaEntry[]> {
	return core.getFormulaLibrary();
}
/** Load the bundled default specification text (part one). */
export async function loadDefaultSpec(): Promise<string> {
	return partOneSpec;
}
