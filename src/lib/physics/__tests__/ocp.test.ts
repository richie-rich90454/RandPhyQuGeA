import {describe, it, expect} from 'vitest';
import {QuestionTypeRegistry} from '../generator/QuestionTypeRegistry';
import {ExporterRegistry} from '../exporters/ExporterRegistry';
import {ExpressionEvaluator} from '../ExpressionEvaluator';
import {SpecificationParser} from '../SpecificationParser';
import {PhysicsCore} from '../PhysicsCore';
import {SeededRandomGenerator} from '../random';
import type {QuestionTypeHandler} from '../contracts';
import type {Exporter} from '../contracts';
import type {ExportFormat, GeneratedQuestion, QuestionTemplate} from '../types';
class CustomHandler implements QuestionTypeHandler {
	public readonly type = 'CustomType';
	public handle(template: QuestionTemplate, variables: Record<string, unknown>): GeneratedQuestion {
		const x = variables['x'];
		return {
			id: 'custom-1',
			topic_id: template.topic_id,
			skill_id: template.skill_id,
			question_type: template.question_type,
			difficulty: template.difficulty,
			text: 'custom: ' + String(x ?? ''),
			answer: '42',
			solution_text: '',
			solution_latex: '',
			variables
		};
	}
}
class CustomExporter implements Exporter {
	public readonly format: ExportFormat = 'html';
	public export(): string {
		return 'CUSTOM EXPORT';
	}
}
const CUSTOM_SPEC = [
	'[UNIT]',
	'Id: U1',
	'Name: Test',
	'[TOPIC]',
	'Id: T1',
	'Name: Test',
	'UnitId: U1',
	'[SKILL]',
	'Id: S1',
	'Name: Test',
	'TopicId: T1',
	'[TEMPLATE]',
	'Id: Q1',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: CustomType',
	'Difficulty: 1',
	'TextTemplate: custom {x}',
	'AnswerExpression: x',
	'Var.x: Type=int;Min=1;Max=10'
].join('\n');
describe('Open-Closed Principle', () => {
	it('allows registering a custom question type handler that dispatches via the registry', () => {
		const registry = QuestionTypeRegistry.createDefault();
		const custom = new CustomHandler();
		registry.register(custom);
		expect(registry.get('CustomType')).toBe(custom);
		const handler = registry.getOrDefault('CustomType');
		expect(handler).toBe(custom);
		const spec = new SpecificationParser().parse(CUSTOM_SPEC);
		const template = spec.templates[0];
		const evaluator = new ExpressionEvaluator();
		const random = new SeededRandomGenerator(1);
		const q = handler.handle(template as QuestionTemplate, {x: 7}, evaluator, random);
		expect(q.text).toContain('custom:');
		expect(q.text).toBe('custom: 7');
		expect(q.answer).toBe('42');
	});
	it('falls back to the default handler for an unregistered type', () => {
		const registry = QuestionTypeRegistry.createDefault();
		expect(registry.get('MissingType')).toBeUndefined();
		const handler = registry.getOrDefault('MissingType');
		expect(handler.type).toBe('SA');
	});
	it('allows registering a custom exporter that overrides an existing format', () => {
		const registry = ExporterRegistry.createDefault();
		const custom = new CustomExporter();
		registry.register(custom);
		expect(registry.get('html')).toBe(custom);
		expect(registry.export([], 'html')).toBe('CUSTOM EXPORT');
	});
	it('facade dispatches exportQuestions through an injected custom exporter registry', () => {
		const registry = new ExporterRegistry();
		registry.register(new CustomExporter());
		const core = new PhysicsCore(undefined, undefined, registry);
		expect(core.exportQuestions([], 'html')).toBe('CUSTOM EXPORT');
	});
	it('facade uses the injected evaluator and parser collaborators', () => {
		const parser = new SpecificationParser();
		const evaluator = new ExpressionEvaluator();
		const core = new PhysicsCore(parser, evaluator);
		const spec = core.parseSpecification(CUSTOM_SPEC);
		expect(spec.templates[0]?.question_type).toBe('CustomType');
	});
});
