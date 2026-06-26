import {describe, it, expect} from 'vitest';
import {PhysicsCore} from '../PhysicsCore';
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
	'Var.t: Type=int;Min=1;Max=5'
].join('\n');
describe('PhysicsCore facade', () => {
	it('default() returns a usable instance', () => {
		const core = PhysicsCore.default();
		expect(core).toBeInstanceOf(PhysicsCore);
		expect(core.getFormulaLibrary().length).toBeGreaterThan(0);
	});
	it('parseSpecification parses units, topics, skills, and templates', () => {
		const core = PhysicsCore.default();
		const spec = core.parseSpecification(SPEC);
		expect(spec.units.length).toBe(1);
		expect(spec.topics.length).toBe(1);
		expect(spec.skills.length).toBe(1);
		expect(spec.templates.length).toBe(2);
	});
	it('generateQuestion returns a question with no {var} tokens', () => {
		const core = PhysicsCore.default().createSeeded(42);
		const spec = core.parseSpecification(SPEC);
		const q = core.generateQuestion(spec, {templateIds: ['QMC']});
		expect(q).not.toBeNull();
		expect(q?.text).not.toContain('{');
	});
	it('generateBatch(5) returns 5 questions', () => {
		const core = PhysicsCore.default().createSeeded(42);
		const spec = core.parseSpecification(SPEC);
		const batch = core.generateBatch(spec, 5);
		expect(batch.length).toBe(5);
	});
	it('generateUnique(2) returns 2 questions with different ids', () => {
		const core = PhysicsCore.default().createSeeded(42);
		const spec = core.parseSpecification(SPEC);
		const unique = core.generateUnique(spec, 2);
		expect(unique.length).toBe(2);
		expect(unique[0]?.id).not.toBe(unique[1]?.id);
	});
	it('exportQuestions(questions, "html") returns a non-empty string with DOCTYPE', () => {
		const core = PhysicsCore.default().createSeeded(42);
		const spec = core.parseSpecification(SPEC);
		const questions = core.generateBatch(spec, 2);
		const out = core.exportQuestions(questions, 'html');
		expect(out.length).toBeGreaterThan(0);
		expect(out).toContain('<!DOCTYPE html>');
	});
	it('exportQuestions(questions, "json") returns valid JSON', () => {
		const core = PhysicsCore.default().createSeeded(42);
		const spec = core.parseSpecification(SPEC);
		const questions = core.generateBatch(spec, 1);
		const out = core.exportQuestions(questions, 'json');
		const parsed = JSON.parse(out);
		expect(parsed.length).toBe(1);
		expect(parsed[0].text).toBeDefined();
	});
	it('getFormulaLibrary() returns a non-empty array', () => {
		const core = PhysicsCore.default();
		expect(core.getFormulaLibrary().length).toBeGreaterThan(0);
	});
	it('createSeeded(42) returns a new PhysicsCore instance', () => {
		const core = PhysicsCore.default();
		const seeded = core.createSeeded(42);
		expect(seeded).toBeInstanceOf(PhysicsCore);
		expect(seeded).not.toBe(core);
	});
	it('createSeeded(42) twice produces the same question text', () => {
		const base = PhysicsCore.default();
		const core1 = base.createSeeded(42);
		const core2 = base.createSeeded(42);
		const spec = core1.parseSpecification(SPEC);
		const q1 = core1.generateQuestion(spec, {templateIds: ['QMC']});
		const q2 = core2.generateQuestion(spec, {templateIds: ['QMC']});
		expect(q1?.text).toBe(q2?.text);
		expect(q1?.answer).toBe(q2?.answer);
	});
	it('generateQuestion returns null when no template matches', () => {
		const core = PhysicsCore.default();
		const spec = core.parseSpecification(SPEC);
		expect(core.generateQuestion(spec, {minDifficulty: 100})).toBeNull();
	});
	it('injects custom collaborators through the constructor', () => {
		const core = new PhysicsCore();
		expect(core).toBeInstanceOf(PhysicsCore);
		const spec = core.parseSpecification(SPEC);
		expect(spec.templates.length).toBe(2);
	});
});
