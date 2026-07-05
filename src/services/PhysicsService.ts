/** OOP service facade over {@link PhysicsCore}. */
import type {IPhysicsService, GenerateOptions} from "./contracts";
import {PhysicsCore} from "../lib/physics";
import type {QuestionFilter} from "../lib/physics";
import type {Specification, GeneratedQuestion, FormulaEntry, ExportFormat} from "../types/models";
/** Map public {@link GenerateOptions} to the core's {@link QuestionFilter}. */
function toFilter(options?: GenerateOptions): QuestionFilter | undefined {
	if (!options) {
		return undefined;
	}
	return {
		topicId: options.topicId,
		skillId: options.skillId,
		minDifficulty: options.minDifficulty,
		maxDifficulty: options.maxDifficulty,
		questionType: options.questionType,
		excludeIds: options.excludeIds,
		templateIds: options.templateIds,
	};
}
export class PhysicsService implements IPhysicsService {
	private readonly core: PhysicsCore;
	public constructor(core: PhysicsCore) {
		this.core = core;
	}
	public async parseSpecification(input: string): Promise<Specification> {
		return this.core.parseSpecification(input);
	}
	public async generateQuestion(spec: Specification, options?: GenerateOptions): Promise<GeneratedQuestion> {
		const question = this.core.generateQuestion(spec, toFilter(options));
		if (!question) {
			throw new Error("No question template matches the requested filter.");
		}
		return question;
	}
	public async generateBatch(spec: Specification, count: number, options?: GenerateOptions): Promise<GeneratedQuestion[]> {
		return this.core.generateBatch(spec, count, toFilter(options));
	}
	public async generateUnique(spec: Specification, count: number, options?: GenerateOptions): Promise<GeneratedQuestion[]> {
		return this.core.generateUnique(spec, count, toFilter(options));
	}
	public async evaluate(expression: string, variables: Record<string, unknown>): Promise<number> {
		return this.core.evaluate(expression, variables);
	}
	public async exportQuestions(questions: GeneratedQuestion[], format: ExportFormat): Promise<string> {
		return this.core.exportQuestions(questions, format);
	}
	public async getFormulaLibrary(): Promise<FormulaEntry[]> {
		return this.core.getFormulaLibrary();
	}
}
