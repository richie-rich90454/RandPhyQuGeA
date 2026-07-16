import type {DistractorContext, ExpressionEvaluatorLike, McqAssemblerLike, RandomGenerator} from "../contracts";
import type {GeneratedQuestion, QuestionFilter, QuestionTemplate, ResponseMode} from "../types";
import {SeededRandomGenerator} from "../random/SeededRandomGenerator";
import {UniformRandomGenerator} from "../random/UniformRandomGenerator";
import {VariableGenerator} from "../random/VariableGenerator";
import {McqAssembler} from "./McqAssembler";
import {MultipleResponseAssembler} from "./MultipleResponseAssembler";
import {QuestionTypeRegistry} from "./QuestionTypeRegistry";
/** Selects templates matching a filter, generates variables, dispatches to question type handlers, and optionally assembles multiple-choice choices via the McqAssembler when responseMode is 'mcq'. */
export class QuestionGenerator {
	private readonly templates: QuestionTemplate[];
	private readonly registry: QuestionTypeRegistry;
	private readonly evaluator: ExpressionEvaluatorLike;
	private readonly variableGenerator: VariableGenerator;
	private readonly random: RandomGenerator;
	private readonly mcqAssembler: McqAssemblerLike;
	private readonly multipleResponseAssembler: MultipleResponseAssembler;
	public constructor(
		templates: QuestionTemplate[],
		evaluator: ExpressionEvaluatorLike,
		random?: RandomGenerator,
		questionTypeRegistry?: QuestionTypeRegistry,
		variableGenerator?: VariableGenerator,
		mcqAssembler?: McqAssemblerLike,
	) {
		this.templates = templates;
		this.evaluator = evaluator;
		this.random = random ?? new UniformRandomGenerator();
		this.registry = questionTypeRegistry ?? QuestionTypeRegistry.createDefault();
		this.variableGenerator = variableGenerator ?? new VariableGenerator();
		this.mcqAssembler = mcqAssembler ?? new McqAssembler();
		this.multipleResponseAssembler = new MultipleResponseAssembler();
	}
	public generate(filter?: QuestionFilter): GeneratedQuestion | null {
		const candidates = this.filterTemplates(filter);
		if (candidates.length === 0) {
			return null;
		}
		const idx = this.random.nextInt(0, candidates.length - 1);
		const template = candidates[idx];
		if (template === undefined) {
			return null;
		}
		return this.generateFromTemplate(template, filter?.responseMode);
	}
	public generateBatch(count: number, filter?: QuestionFilter): GeneratedQuestion[] {
		const results: GeneratedQuestion[] = [];
		for (let i = 0; i < count; i++) {
			const question = this.generate(filter);
			if (question !== null) {
				results.push(question);
			}
		}
		return results;
	}
	public generateUnique(count: number, filter?: QuestionFilter): GeneratedQuestion[] {
		let baseCandidates = this.filterTemplates(filter);
		if (baseCandidates.length === 0 && filter !== undefined && filter.excludeIds !== undefined) {
			// Edge case: excludeIds emptied the pool. Fall back to ignoring excludeIds so a
			// single-template topic can still produce a fresh instance by re-randomizing variables.
			const fallbackFilter: QuestionFilter = {...filter, excludeIds: undefined};
			baseCandidates = this.filterTemplates(fallbackFilter);
		}
		if (baseCandidates.length === 0) {
			return [];
		}
		const results: GeneratedQuestion[] = [];
		const usedTemplateIds: Set<string> = new Set();
		const maxAttempts = count * 3;
		let attempts = 0;
		while (results.length < count && attempts < maxAttempts) {
			const available = baseCandidates.filter(t => !usedTemplateIds.has(t.id));
			if (available.length === 0) {
				break;
			}
			const idx = this.random.nextInt(0, available.length - 1);
			const template = available[idx];
			if (template === undefined) {
				break;
			}
			usedTemplateIds.add(template.id);
			results.push(this.generateFromTemplate(template, filter?.responseMode));
			attempts++;
		}
		return results;
	}
	public countTemplates(filter?: QuestionFilter): number {
		return this.filterTemplates(filter).length;
	}
	public getTemplateIds(filter?: QuestionFilter): string[] {
		return this.filterTemplates(filter).map(t => t.id);
	}
	public createSeeded(seed: number): QuestionGenerator {
		return new QuestionGenerator(this.templates, this.evaluator, new SeededRandomGenerator(seed), this.registry, this.variableGenerator, this.mcqAssembler);
	}
	private filterTemplates(filter?: QuestionFilter): QuestionTemplate[] {
		return this.templates.filter(t => this.matchesFilter(t, filter));
	}
	private matchesFilter(template: QuestionTemplate, filter?: QuestionFilter): boolean {
		if (filter === undefined) {
			return true;
		}
		if (filter.topicId !== undefined && template.topic_id !== filter.topicId) {
			return false;
		}
		if (filter.skillId !== undefined && template.skill_id !== filter.skillId) {
			return false;
		}
		if (filter.minDifficulty !== undefined && template.difficulty < filter.minDifficulty) {
			return false;
		}
		if (filter.maxDifficulty !== undefined && template.difficulty > filter.maxDifficulty) {
			return false;
		}
		if (filter.questionType !== undefined && template.question_type !== filter.questionType) {
			return false;
		}
		if (filter.excludeIds !== undefined && filter.excludeIds.includes(template.id)) {
			return false;
		}
		if (filter.templateIds !== undefined && !filter.templateIds.includes(template.id)) {
			return false;
		}
		return true;
	}
	private generateFromTemplate(template: QuestionTemplate, responseMode?: ResponseMode): GeneratedQuestion {
		const variables = this.variableGenerator.generate(template.variable_definitions, this.random);
		const handler = this.registry.getOrDefault(template.question_type);
		const base = handler.handle(template, variables, this.evaluator, this.random);
		if (responseMode === "mcq") {
			if (template.question_type === "MULTI_RESPONSE") {
				return this.multipleResponseAssembler.assemble(base, template, this.random);
			}
			const context = this.buildDistractorContext(base, template);
			const seed = this.deriveSeed(template.id, variables);
			return this.mcqAssembler.assemble(base, context, this.random, undefined, seed);
		}
		return base;
	}
	private deriveSeed(templateId: string, variables: Record<string, unknown>): number {
		const payload = templateId + "|" + JSON.stringify(variables);
		let h = 2166136261;
		for (let i = 0; i < payload.length; i++) {
			h ^= payload.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	}
	private buildDistractorContext(question: GeneratedQuestion, template: QuestionTemplate): DistractorContext {
		const parsed = Number(question.answer);
		const answerValue = Number.isFinite(parsed) ? parsed : Number.NaN;
		return {
			answer: question.answer,
			answerValue,
			template,
			variables: question.variables,
			evaluator: this.evaluator,
		};
	}
}
