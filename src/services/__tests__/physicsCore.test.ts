import {describe, it, expect, afterEach} from 'vitest';
import {configureCore, generateQuestion, parseSpecification} from '../physicsCore';
import {QuestionTypeRegistry} from '../../lib/physics';
import type {QuestionTypeHandler, QuestionTemplate, GeneratedQuestion} from '../../lib/physics';
class CustomHandler implements QuestionTypeHandler {
	public readonly type = 'CustomType';
	public handle(template: QuestionTemplate, variables: Record<string, unknown>): GeneratedQuestion {
		return {
			id: 'custom-1',
			topic_id: template.topic_id,
			skill_id: template.skill_id,
			question_type: template.question_type,
			difficulty: template.difficulty,
			text: 'custom question dispatched via configureCore',
			answer: '42',
			solution_text: '',
			solution_latex: '',
			variables
		};
	}
}
const SPEC = [
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
	'TextTemplate: custom',
	'AnswerExpression: 1'
].join('\n');
describe('configureCore', () => {
	afterEach(() => {
		configureCore({});
	});
	it('routes generateQuestion through an injected custom question-type registry', async () => {
		const registry = QuestionTypeRegistry.createDefault();
		registry.register(new CustomHandler());
		configureCore({questionTypes: registry});
		const spec = await parseSpecification(SPEC);
		const q = await generateQuestion(spec);
		expect(q.question_type).toBe('CustomType');
		expect(q.answer).toBe('42');
		expect(q.text).toBe('custom question dispatched via configureCore');
	});
	it('configureCore({}) resets the singleton so the default handler is used again', async () => {
		const registry = QuestionTypeRegistry.createDefault();
		registry.register(new CustomHandler());
		configureCore({questionTypes: registry});
		configureCore({});
		const spec = await parseSpecification(SPEC);
		const q = await generateQuestion(spec);
		expect(q.question_type).toBe('CustomType');
		expect(q.answer).toBe('1');
		expect(q.text).not.toContain('configureCore');
	});
});
