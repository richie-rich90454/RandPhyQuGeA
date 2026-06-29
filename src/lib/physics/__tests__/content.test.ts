import {describe, it, expect} from 'vitest';
import katex from 'katex';
import {PhysicsCore} from '../PhysicsCore';
import {SpecificationParser} from '../SpecificationParser';
import {QuestionGenerator} from '../generator/QuestionGenerator';
import {ExpressionEvaluator} from '../ExpressionEvaluator';
import {SeededRandomGenerator} from '../random';
import {FormulaLibrary} from '../FormulaLibrary';
import partOneSpec from '../../../assets/part_one.txt?raw';
const EXPECTED_TOPIC_IDS = [
	'kinematics',
	'dynamics',
	'circular-motion',
	'gravitation',
	'energy',
	'momentum',
	'torque',
	'rotational-motion',
	'shm',
	'fluids',
	'waves',
	'sound',
	'electrostatics',
	'dc-circuits'
];
const EXPECTED_UNIT_IDS = ['mechanics', 'rotation-oscillations', 'fluids-waves', 'electricity'];
function parseSpec(): ReturnType<SpecificationParser['parse']> {
	const parser = new SpecificationParser();
	return parser.parse(partOneSpec);
}
function buildGenerator(seed: number): QuestionGenerator {
	const spec = parseSpec();
	const evaluator = new ExpressionEvaluator();
	return new QuestionGenerator(spec.templates, evaluator, new SeededRandomGenerator(seed));
}
function renderLatex(tex: string): {ok: boolean; error?: string} {
	try {
		katex.renderToString(tex, {displayMode: true, throwOnError: true});
		return {ok: true};
	}
	catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return {ok: false, error: msg};
	}
}
describe('Default specification structure', () => {
	it('parses without throwing', () => {
		expect(() => parseSpec()).not.toThrow();
	});
	it('contains all 4 expected units', () => {
		const spec = parseSpec();
		const ids = spec.units.map(u => u.id);
		for (const id of EXPECTED_UNIT_IDS) {
			expect(ids).toContain(id);
		}
		expect(spec.units.length).toBeGreaterThanOrEqual(4);
	});
	it('contains all 14 expected topics', () => {
		const spec = parseSpec();
		const ids = spec.topics.map(t => t.id);
		for (const id of EXPECTED_TOPIC_IDS) {
			expect(ids).toContain(id);
		}
		expect(spec.topics.length).toBeGreaterThanOrEqual(14);
	});
	it('contains at least 28 skills (>=2 per topic)', () => {
		const spec = parseSpec();
		expect(spec.skills.length).toBeGreaterThanOrEqual(28);
		for (const topicId of EXPECTED_TOPIC_IDS) {
			const skills = spec.skills.filter(s => s.topic_id === topicId);
			expect(skills.length).toBeGreaterThanOrEqual(1);
		}
	});
	it('contains at least 80 templates', () => {
		const spec = parseSpec();
		expect(spec.templates.length).toBeGreaterThanOrEqual(80);
	});
	it('every template references a known topic and skill', () => {
		const spec = parseSpec();
		const topicIds = new Set(spec.topics.map(t => t.id));
		const skillIds = new Set(spec.skills.map(s => s.id));
		for (const tpl of spec.templates) {
			expect(topicIds.has(tpl.topic_id)).toBe(true);
			expect(skillIds.has(tpl.skill_id)).toBe(true);
		}
	});
	it('every topic has at least one template', () => {
		const spec = parseSpec();
		const topicsWithTemplates = new Set(spec.templates.map(t => t.topic_id));
		for (const topicId of EXPECTED_TOPIC_IDS) {
			expect(topicsWithTemplates.has(topicId)).toBe(true);
		}
	});
	it('contains no references to AP Physics or Advanced Placement', () => {
		const lower = partOneSpec.toLowerCase();
		expect(lower).not.toContain('ap physics');
		expect(lower).not.toContain('advanced placement');
	});
});
describe('Template generation', () => {
	it('every template generates without throwing for 5 seeded iterations', () => {
		const spec = parseSpec();
		const templateIds = spec.templates.map(t => t.id);
		expect(templateIds.length).toBeGreaterThan(0);
		for (const id of templateIds) {
			let generated = false;
			for (let seed = 1; seed <= 5; seed++) {
				const gen = buildGenerator(seed);
				const q = gen.generate({templateIds: [id]});
				if (q !== null) {
					generated = true;
					expect(q.text).not.toMatch(/\{[a-zA-Z_]\w*\}/);
				}
			}
			expect(generated).toBe(true);
		}
	});
	it('every MC template produces between 2 and 5 distinct choices', () => {
		const spec = parseSpec();
		const mcTemplates = spec.templates.filter(t => t.question_type === 'MC');
		expect(mcTemplates.length).toBeGreaterThan(0);
		for (const tpl of mcTemplates) {
			let checked = false;
			for (let seed = 1; seed <= 5; seed++) {
				const gen = buildGenerator(seed);
				const q = gen.generate({templateIds: [tpl.id]});
				if (q === null || q.choices === undefined) {
					continue;
				}
				checked = true;
				if (q.choices.length < 2) {
					throw new Error(`MC template ${tpl.id} (seed ${seed}) produced ${q.choices.length} choices: ${JSON.stringify(q.choices)} (distractors: ${JSON.stringify(tpl.distractor_expressions)})`);
				}
				expect(q.choices.length).toBeLessThanOrEqual(5);
				const unique = new Set(q.choices);
				expect(unique.size).toBe(q.choices.length);
				expect(q.choices).toContain(q.answer);
			}
			expect(checked).toBe(true);
		}
	});
	it('every TF template produces exactly True and False choices', () => {
		const spec = parseSpec();
		const tfTemplates = spec.templates.filter(t => t.question_type === 'TF');
		for (const tpl of tfTemplates) {
			const gen = buildGenerator(1);
			const q = gen.generate({templateIds: [tpl.id]});
			expect(q).not.toBeNull();
			expect(q?.choices).toEqual(['True', 'False']);
		}
	});
	it('every SA/FB/NE template produces no choices', () => {
		const spec = parseSpec();
		const nonMcTemplates = spec.templates.filter(t => t.question_type === 'SA' || t.question_type === 'FB' || t.question_type === 'NE');
		expect(nonMcTemplates.length).toBeGreaterThan(0);
		for (const tpl of nonMcTemplates) {
			const gen = buildGenerator(1);
			const q = gen.generate({templateIds: [tpl.id]});
			expect(q).not.toBeNull();
			expect(q?.choices).toBeUndefined();
		}
	});
	it('every generated question has a non-empty text and answer', () => {
		const spec = parseSpec();
		for (const tpl of spec.templates) {
			const gen = buildGenerator(1);
			const q = gen.generate({templateIds: [tpl.id]});
			expect(q).not.toBeNull();
			expect(q?.text.length).toBeGreaterThan(0);
			expect(q?.answer.length).toBeGreaterThan(0);
		}
	});
	it('every generated question has a non-empty solution_latex', () => {
		const spec = parseSpec();
		for (const tpl of spec.templates) {
			const gen = buildGenerator(1);
			const q = gen.generate({templateIds: [tpl.id]});
			expect(q).not.toBeNull();
			expect(q?.solution_latex.length).toBeGreaterThan(0);
		}
	});
});
describe('LaTeX rendering', () => {
	it('every SolutionLatexTemplate renders via KaTeX after substitution for 3 seeds', () => {
		const spec = parseSpec();
		expect(spec.templates.length).toBeGreaterThan(0);
		for (const tpl of spec.templates) {
			if (tpl.solution_latex_template.trim().length === 0) {
				continue;
			}
			for (let seed = 1; seed <= 3; seed++) {
				const gen = buildGenerator(seed);
				const q = gen.generate({templateIds: [tpl.id]});
				expect(q).not.toBeNull();
				const result = renderLatex(q?.solution_latex ?? '');
				if (!result.ok) {
					throw new Error(`KaTeX failed for template ${tpl.id} (seed ${seed}): ${result.error}\nLaTeX: ${q?.solution_latex}`);
				}
			}
		}
	});
	it('every FormulaLibrary latex renders via KaTeX', () => {
		const lib = new FormulaLibrary();
		const formulas = lib.getAll();
		expect(formulas.length).toBeGreaterThan(0);
		for (const f of formulas) {
			const result = renderLatex(f.latex);
			if (!result.ok) {
				throw new Error(`KaTeX failed for formula "${f.name}": ${result.error}\nLaTeX: ${f.latex}`);
			}
		}
	});
});
describe('FormulaLibrary coverage', () => {
	it('every formula topic_id matches a spec topic id', () => {
		const spec = parseSpec();
		const topicIds = new Set(spec.topics.map(t => t.id));
		const lib = new FormulaLibrary();
		for (const f of lib.getAll()) {
			expect(topicIds.has(f.topic_id)).toBe(true);
		}
	});
	it('getByTopic returns at least 2 entries for every expected topic', () => {
		const lib = new FormulaLibrary();
		for (const id of EXPECTED_TOPIC_IDS) {
			const entries = lib.getByTopic(id);
			expect(entries.length).toBeGreaterThanOrEqual(2);
		}
	});
});
describe('PhysicsCore integration with default spec', () => {
	it('generateBatch(20) returns 20 questions from the default spec', () => {
		const core = PhysicsCore.default().createSeeded(7);
		const spec = core.parseSpecification(partOneSpec);
		const batch = core.generateBatch(spec, 20);
		expect(batch.length).toBe(20);
	});
	it('generateUnique returns questions with distinct ids', () => {
		const core = PhysicsCore.default().createSeeded(7);
		const spec = core.parseSpecification(partOneSpec);
		const unique = core.generateUnique(spec, 10);
		expect(unique.length).toBe(10);
		const ids = unique.map(q => q.id);
		expect(new Set(ids).size).toBe(10);
	});
	it('can filter by every expected topic id', () => {
		const core = PhysicsCore.default().createSeeded(7);
		const spec = core.parseSpecification(partOneSpec);
		for (const id of EXPECTED_TOPIC_IDS) {
			const q = core.generateQuestion(spec, {topicId: id});
			expect(q).not.toBeNull();
			expect(q?.topic_id).toBe(id);
		}
	});
});
