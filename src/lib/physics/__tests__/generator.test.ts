import {describe, it, expect} from 'vitest';
import {SpecificationParser} from '../SpecificationParser';
import {QuestionGenerator} from '../generator/QuestionGenerator';
import {ExpressionEvaluator} from '../ExpressionEvaluator';
import {SeededRandomGenerator} from '../random';
const SPEC = [
	'[UNIT]',
	'Id: U1',
	'Name: Mechanics',
	'[TOPIC]',
	'Id: T1',
	'Name: Kinematics',
	'UnitId: U1',
	'[SKILL]',
	'Id: S1',
	'Name: Accel',
	'TopicId: T1',
	'[TEMPLATE]',
	'Id: QMC',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: MultipleChoice',
	'Difficulty: 2',
	'TextTemplate: A car accelerates from {v0} to {v} in {t}. Find acceleration.',
	'AnswerExpression: (v - v0) / t',
	'Var.v0: Type=int;Min=0;Max=10',
	'Var.v: Type=int;Min=20;Max=40',
	'Var.t: Type=int;Min=1;Max=10',
	'Distractor: (v + v0) / t',
	'Distractor: v / t',
	'[TEMPLATE]',
	'Id: QSA',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: ShortAnswer',
	'Difficulty: 1',
	'TextTemplate: A ball falls for {t} s. How far? g=9.81.',
	'AnswerExpression: 0.5 * 9.81 * t * t',
	'Var.t: Type=int;Min=1;Max=5',
	'[TEMPLATE]',
	'Id: QTF',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: TrueFalse',
	'Difficulty: 1',
	'TextTemplate: The acceleration is positive. a={a}',
	'AnswerExpression: a',
	'Var.a: Type=int;Min=-5;Max=5',
	'[TEMPLATE]',
	'Id: QUNK',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: WeirdType',
	'Difficulty: 3',
	'TextTemplate: Custom {x}',
	'AnswerExpression: x',
	'Var.x: Type=int;Min=1;Max=10'
].join('\n');
function buildGenerator(seed: number): QuestionGenerator {
	const spec = new SpecificationParser().parse(SPEC);
	const evaluator = new ExpressionEvaluator();
	return new QuestionGenerator(spec.templates, evaluator, new SeededRandomGenerator(seed));
}
describe('QuestionGenerator', () => {
	it('generates an MC question with no {var} tokens and choices present', () => {
		const gen = buildGenerator(42);
		const q = gen.generate({templateIds: ['QMC']});
		expect(q).not.toBeNull();
		expect(q?.text).not.toContain('{');
		expect(q?.choices).toBeDefined();
		expect(q?.choices?.length).toBe(3);
		expect(q?.question_type).toBe('MC');
	});
	it('generates an SA question with no choices', () => {
		const gen = buildGenerator(42);
		const q = gen.generate({templateIds: ['QSA']});
		expect(q).not.toBeNull();
		expect(q?.choices).toBeUndefined();
		expect(q?.question_type).toBe('SA');
	});
	it('generates a batch of 10 questions', () => {
		const gen = buildGenerator(42);
		const batch = gen.generateBatch(10);
		expect(batch.length).toBe(10);
	});
	it('produces identical text and answer for two generators with the same seed', () => {
		const gen1 = buildGenerator(42);
		const gen2 = buildGenerator(42);
		const q1 = gen1.generate({templateIds: ['QMC']});
		const q2 = gen2.generate({templateIds: ['QMC']});
		expect(q1?.text).toBe(q2?.text);
		expect(q1?.answer).toBe(q2?.answer);
	});
	it('returns null when no template matches a too-high difficulty filter', () => {
		const gen = buildGenerator(42);
		expect(gen.generate({minDifficulty: 100})).toBeNull();
	});
	it('filters by question type MC', () => {
		const gen = buildGenerator(42);
		expect(gen.countTemplates({questionType: 'MC'})).toBe(1);
		expect(gen.getTemplateIds({questionType: 'MC'})).toEqual(['QMC']);
		expect(gen.countTemplates()).toBe(4);
	});
	it('generates unique questions with different ids', () => {
		const gen = buildGenerator(42);
		const unique = gen.generateUnique(2);
		expect(unique.length).toBe(2);
		expect(unique[0]?.id).not.toBe(unique[1]?.id);
	});
	it('returns an empty array for generateUnique when no templates match', () => {
		const gen = buildGenerator(42);
		expect(gen.generateUnique(3, {minDifficulty: 100})).toEqual([]);
	});
	it('generates a TF question with choices True and False', () => {
		const gen = buildGenerator(42);
		const q = gen.generate({templateIds: ['QTF']});
		expect(q?.choices).toEqual(['True', 'False']);
		expect(['True', 'False']).toContain(q?.answer);
	});
	it('falls back to the SA handler for an unknown question type', () => {
		const gen = buildGenerator(42);
		const q = gen.generate({templateIds: ['QUNK']});
		expect(q?.question_type).toBe('WeirdType');
		expect(q?.choices).toBeUndefined();
	});
	it('createSeeded produces a reproducible generator', () => {
		const gen1 = buildGenerator(42);
		const gen2 = gen1.createSeeded(42);
		const q1 = gen1.generate({templateIds: ['QSA']});
		const q2 = gen2.generate({templateIds: ['QSA']});
		expect(q1?.text).toBe(q2?.text);
	});
	it('respects excludeIds and topicId filters', () => {
		const gen = buildGenerator(42);
		expect(gen.countTemplates({excludeIds: ['QMC']})).toBe(3);
		expect(gen.countTemplates({topicId: 'T1'})).toBe(4);
		expect(gen.countTemplates({skillId: 'S1', maxDifficulty: 1})).toBe(2);
	});
});
