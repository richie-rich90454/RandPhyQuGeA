import {describe, it, expect} from 'vitest';
import {SpecificationParser} from '../SpecificationParser';
import {ParseException} from '../types';
const BASIC_MC_SPEC = [
	'[UNIT]',
	'Id: U1',
	'Name: Mechanics',
	'[TOPIC]',
	'Id: T1',
	'Name: Kinematics',
	'UnitId: U1',
	'[SKILL]',
	'Id: S1',
	'Name: Uniform Acceleration',
	'TopicId: T1',
	'[TEMPLATE]',
	'Id: Q1',
	'TopicId: T1',
	'SkillId: S1',
	'QuestionType: MultipleChoice',
	'Difficulty: 2',
	'TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s.',
	'AnswerExpression: (v - v0) / t',
	'SolutionTemplate: Use a = (v - v0) / t.',
	'Var.v0: Type=double;Min=0;Max=20;Step=1',
	'Var.v: Type=double;Min=20;Max=40;Step=1',
	'Var.t: Type=double;Min=1;Max=10;Step=0.5',
	'Distractor: (v + v0) / t',
	'Distractor: v / t'
].join('\n');
describe('SpecificationParser', () => {
	it('parses a spec with 1 unit, 1 topic, 1 skill, 1 MC template with 3 vars and 2 distractors', () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(BASIC_MC_SPEC);
		expect(spec.units.length).toBe(1);
		expect(spec.units[0]?.id).toBe('U1');
		expect(spec.units[0]?.name).toBe('Mechanics');
		expect(spec.topics.length).toBe(1);
		expect(spec.topics[0]?.id).toBe('T1');
		expect(spec.topics[0]?.unit_id).toBe('U1');
		expect(spec.skills.length).toBe(1);
		expect(spec.skills[0]?.topic_id).toBe('T1');
		expect(spec.templates.length).toBe(1);
		const tpl = spec.templates[0];
		expect(tpl?.id).toBe('Q1');
		expect(tpl?.question_type).toBe('MC');
		expect(tpl?.difficulty).toBe(2);
		expect(tpl?.text_template).toContain('{v0}');
		expect(tpl?.variable_definitions.length).toBe(3);
		expect(tpl?.distractor_expressions.length).toBe(2);
		expect(tpl?.distractor_expressions[0]).toBe('(v + v0) / t');
	});
	it('parses ShortAnswer template and normalizes question_type to SA with 0 distractors', () => {
		const parser = new SpecificationParser();
		const saSpec = BASIC_MC_SPEC.replace('QuestionType: MultipleChoice', 'QuestionType: ShortAnswer').replace(/\nDistractor: [^\n]+/g, '');
		const spec = parser.parse(saSpec);
		expect(spec.templates[0]?.question_type).toBe('SA');
		expect(spec.templates[0]?.distractor_expressions.length).toBe(0);
	});
	it('throws ParseException when a topic references an unknown unit', () => {
		const parser = new SpecificationParser();
		const badSpec = ['[UNIT]', 'Id: U1', 'Name: Mechanics', '[TOPIC]', 'Id: T1', 'Name: Kinematics', 'UnitId: U9'].join('\n');
		expect(() => parser.parse(badSpec)).toThrow(ParseException);
		expect(() => parser.parse(badSpec)).toThrow('references unknown Unit');
	});
	it('throws ParseException when a skill references an unknown topic', () => {
		const parser = new SpecificationParser();
		const badSpec = ['[UNIT]', 'Id: U1', 'Name: Mechanics', '[TOPIC]', 'Id: T1', 'Name: Kinematics', 'UnitId: U1', '[SKILL]', 'Id: S1', 'Name: Test', 'TopicId: T9'].join('\n');
		expect(() => parser.parse(badSpec)).toThrow('references unknown Topic');
	});
	it('parses an enum variable with Values=North,South,East,West', () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(BASIC_MC_SPEC.replace('Var.v0: Type=double;Min=0;Max=20;Step=1', 'Var.direction: Type=enum;Values=North,South,East,West'));
		const vd = spec.templates[0]?.variable_definitions.find(v => v.name === 'direction');
		expect(vd?.var_type).toBe('enum');
		expect(vd?.enum_values).toEqual(['North', 'South', 'East', 'West']);
	});
	it('parses multiple units and topics (2 of each)', () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(
			['[UNIT]', 'Id: U1', 'Name: Mechanics', '[UNIT]', 'Id: U2', 'Name: Electricity', '[TOPIC]', 'Id: T1', 'Name: Kinematics', 'UnitId: U1', '[TOPIC]', 'Id: T2', 'Name: Circuits', 'UnitId: U2'].join(
				'\n'
			)
		);
		expect(spec.units.length).toBe(2);
		expect(spec.topics.length).toBe(2);
		expect(spec.units[1]?.id).toBe('U2');
		expect(spec.topics[1]?.unit_id).toBe('U2');
	});
	it('parses an int variable with Min=1, Max=100', () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(BASIC_MC_SPEC.replace('Var.v0: Type=double;Min=0;Max=20;Step=1', 'Var.x: Type=int;Min=1;Max=100'));
		const vd = spec.templates[0]?.variable_definitions.find(v => v.name === 'x');
		expect(vd?.var_type).toBe('int');
		expect(vd?.min).toBe(1);
		expect(vd?.max).toBe(100);
	});
	it('parses an empty TextTemplate as an empty string', () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(BASIC_MC_SPEC.replace('TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s.', 'TextTemplate:'));
		expect(spec.templates[0]?.text_template).toBe('');
	});
	it('passes an unknown question type through unchanged', () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(BASIC_MC_SPEC.replace('QuestionType: MultipleChoice', 'QuestionType: WeirdType'));
		expect(spec.templates[0]?.question_type).toBe('WeirdType');
	});
	it('skips blank lines and // comments', () => {
		const parser = new SpecificationParser();
		const spec = parser.parse('// header comment\n\n[UNIT]\nId: U1\nName: Mechanics\n');
		expect(spec.units.length).toBe(1);
	});
	it('records an error for content found before any section header', () => {
		const parser = new SpecificationParser();
		expect(() => parser.parse('orphan line\n[UNIT]\nId: U1\nName: Mechanics')).toThrow(ParseException);
	});
	it('normalizes TF, FB, and NE question types', () => {
		const parser = new SpecificationParser();
		const base = '[UNIT]\nId: U1\nName: U\n[TOPIC]\nId: T1\nName: T\nUnitId: U1\n[SKILL]\nId: S1\nName: S\nTopicId: T1\n';
		const tpl = (t: string) => `[TEMPLATE]\nId: Q\nTopicId: T1\nSkillId: S1\nQuestionType: ${t}\nDifficulty: 1\nTextTemplate: x\nAnswerExpression: 1\n`;
		expect(parser.parse(base + tpl('TrueFalse')).templates[0]?.question_type).toBe('TF');
		expect(parser.parse(base + tpl('FillInBlank')).templates[0]?.question_type).toBe('FB');
		expect(parser.parse(base + tpl('NumericEntry')).templates[0]?.question_type).toBe('NE');
		expect(parser.parse(base + tpl('MC')).templates[0]?.question_type).toBe('MC');
		expect(parser.parse(base + tpl('SA')).templates[0]?.question_type).toBe('SA');
	});
});
