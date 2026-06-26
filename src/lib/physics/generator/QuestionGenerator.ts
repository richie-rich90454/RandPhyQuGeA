import type {ExpressionEvaluatorLike, RandomGenerator} from '../contracts';
import type {GeneratedQuestion, QuestionFilter, QuestionTemplate} from '../types';
import {SeededRandomGenerator} from '../random/SeededRandomGenerator';
import {UniformRandomGenerator} from '../random/UniformRandomGenerator';
import {VariableGenerator} from '../random/VariableGenerator';
import {QuestionTypeRegistry} from './QuestionTypeRegistry';
/** Selects templates matching a filter, generates variables, and dispatches to question type handlers to build GeneratedQuestions. */
export class QuestionGenerator {
	private readonly templates: QuestionTemplate[];
	private readonly registry: QuestionTypeRegistry;
	private readonly evaluator: ExpressionEvaluatorLike;
	private readonly variableGenerator: VariableGenerator;
	private readonly random: RandomGenerator;
	public constructor(templates: QuestionTemplate[], evaluator: ExpressionEvaluatorLike, random?: RandomGenerator, questionTypeRegistry?: QuestionTypeRegistry, variableGenerator?: VariableGenerator) {
		this.templates = templates;
		this.evaluator = evaluator;
		this.random = random ?? new UniformRandomGenerator();
		this.registry = questionTypeRegistry ?? QuestionTypeRegistry.createDefault();
		this.variableGenerator = variableGenerator ?? new VariableGenerator();
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
		return this.generateFromTemplate(template);
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
		const baseCandidates = this.filterTemplates(filter);
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
			results.push(this.generateFromTemplate(template));
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
		return new QuestionGenerator(this.templates, this.evaluator, new SeededRandomGenerator(seed), this.registry, this.variableGenerator);
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
	private generateFromTemplate(template: QuestionTemplate): GeneratedQuestion {
		const variables = this.variableGenerator.generate(template.variable_definitions, this.random);
		const handler = this.registry.getOrDefault(template.question_type);
		return handler.handle(template, variables, this.evaluator, this.random);
	}
}
