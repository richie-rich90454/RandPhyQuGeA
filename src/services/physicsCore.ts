/**
 * Service facade over the pure-TypeScript {@link PhysicsCore}.
 *
 * The application reaches domain logic exclusively through this module. A
 * single shared `PhysicsCore.default()` instance handles parsing, question
 * generation, export, and the formula library. The public API stays async
 * so existing call sites (originally written against the Tauri/WASM bridge)
 * continue to compile and behave identically.
 */
import partOneSpec from '../assets/part_one.txt?raw';
import {PhysicsCore} from '../lib/physics';
import type {QuestionFilter} from '../lib/physics';
import type {Specification, GeneratedQuestion, FormulaEntry, ExportFormat} from '../types/models';
/** Optional filters applied to question generation. */
export interface GenerateOptions {
	topicId?: string;
	skillId?: string;
	minDifficulty?: number;
	maxDifficulty?: number;
	questionType?: string;
}
/** Shared singleton physics core used by every service function. */
const core = PhysicsCore.default();
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
