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
	it('countTemplates returns 0 when topicId does not match any template', () => {
		const gen = buildGenerator(42);
		expect(gen.countTemplates({topicId: 'NOPE'})).toBe(0);
		expect(gen.getTemplateIds({topicId: 'NOPE'})).toEqual([]);
	});
	it('countTemplates returns 0 when skillId does not match any template', () => {
		const gen = buildGenerator(42);
		expect(gen.countTemplates({skillId: 'NOPE'})).toBe(0);
	});
	it('countTemplates returns 0 when minDifficulty exceeds every template', () => {
		const gen = buildGenerator(42);
		expect(gen.countTemplates({minDifficulty: 100})).toBe(0);
	});
	it('generateUnique stops once all unique templates are exhausted', () => {
		const gen = buildGenerator(42);
		const unique = gen.generateUnique(10);
		expect(unique.length).toBe(4);
		const ids = unique.map(q => q.id);
		expect(new Set(ids).size).toBe(4);
	});
	it('generateUnique respects a filter that limits available templates', () => {
		const gen = buildGenerator(42);
		const unique = gen.generateUnique(5, {questionType: 'MC'});
		expect(unique.length).toBe(1);
		expect(unique[0]?.question_type).toBe('MC');
	});
	it('generate returns null when templateIds filter excludes everything', () => {
		const gen = buildGenerator(42);
		expect(gen.generate({templateIds: ['MISSING']})).toBeNull();
	});
	it('generate returns null for a questionType filter with no matches', () => {
		const gen = buildGenerator(42);
		expect(gen.generate({questionType: 'FB'})).toBeNull();
	});
});
const HANDLER_SPEC = [
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
	'Id: QFB',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: FillInBlank',
	'Difficulty: 2',
	'TextTemplate: The value {x} doubled is ___.',
	'AnswerExpression: x * 2',
	'Var.x: Type=int;Min=4;Max=4',
	'[TEMPLATE]',
	'Id: QNE',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: NumericEntry',
	'Difficulty: 2',
	'TextTemplate: Compute {x} + {y}.',
	'AnswerExpression: x + y',
	'Var.x: Type=int;Min=3;Max=3',
	'Var.y: Type=int;Min=5;Max=5',
	'[TEMPLATE]',
	'Id: QTF0',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: TrueFalse',
	'Difficulty: 1',
	'TextTemplate: The value is zero. a={a}',
	'AnswerExpression: a',
	'Var.a: Type=int;Min=0;Max=0',
	'[TEMPLATE]',
	'Id: QMCDIV',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: MultipleChoice',
	'Difficulty: 2',
	'TextTemplate: Pick the result of {x} / {y}.',
	'AnswerExpression: x / y',
	'Var.x: Type=int;Min=10;Max=10',
	'Var.y: Type=int;Min=2;Max=2',
	'Distractor: 1/0',
	'Distractor: x + y',
	'[TEMPLATE]',
	'Id: QTHROW',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: ShortAnswer',
	'Difficulty: 1',
	'TextTemplate: Broken template {x}.',
	'AnswerExpression: 1/0',
	'Var.x: Type=int;Min=1;Max=1'
].join('\n');
function buildHandlerGenerator(seed: number): QuestionGenerator {
	const spec = new SpecificationParser().parse(HANDLER_SPEC);
	const evaluator = new ExpressionEvaluator();
	return new QuestionGenerator(spec.templates, evaluator, new SeededRandomGenerator(seed));
}
describe('Question type handlers', () => {
	it('FillInBlankHandler generates an FB question with no choices and a numeric answer', () => {
		const gen = buildHandlerGenerator(7);
		const q = gen.generate({templateIds: ['QFB']});
		expect(q).not.toBeNull();
		expect(q?.question_type).toBe('FB');
		expect(q?.choices).toBeUndefined();
		expect(q?.text).toContain('4 doubled');
		expect(q?.answer).toBe('8');
		expect(q?.text).not.toContain('{');
	});
	it('NumericEntryHandler generates an NE question with no choices and a summed answer', () => {
		const gen = buildHandlerGenerator(7);
		const q = gen.generate({templateIds: ['QNE']});
		expect(q).not.toBeNull();
		expect(q?.question_type).toBe('NE');
		expect(q?.choices).toBeUndefined();
		expect(q?.text).toContain('3 + 5');
		expect(q?.answer).toBe('8');
	});
	it('TrueFalseHandler answers False when the evaluated answer is zero', () => {
		const gen = buildHandlerGenerator(7);
		const q = gen.generate({templateIds: ['QTF0']});
		expect(q?.question_type).toBe('TF');
		expect(q?.answer).toBe('False');
		expect(q?.choices).toEqual(['True', 'False']);
	});
	it('MultipleChoiceHandler skips a distractor that throws during evaluation', () => {
		const gen = buildHandlerGenerator(7);
		const q = gen.generate({templateIds: ['QMCDIV']});
		expect(q?.question_type).toBe('MC');
		expect(q?.choices).toBeDefined();
		expect(q?.choices?.length).toBe(2);
		expect(q?.choices).toContain('5');
		expect(q?.choices).toContain('12');
	});
	it('BaseQuestionHandler falls back to answer 0 when the answer expression throws', () => {
		const gen = buildHandlerGenerator(7);
		const q = gen.generate({templateIds: ['QTHROW']});
		expect(q).not.toBeNull();
		expect(q?.question_type).toBe('SA');
		expect(q?.answer).toBe('0');
		expect(q?.choices).toBeUndefined();
	});
	it('the FB and NE handlers are reachable through the default registry', () => {
		const gen = buildHandlerGenerator(7);
		const batch = gen.generateBatch(5, {questionType: 'FB'});
		expect(batch.length).toBeGreaterThan(0);
		expect(batch.every(q => q.question_type === 'FB')).toBe(true);
	});
});
