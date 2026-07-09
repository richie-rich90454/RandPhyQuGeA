import {describe, it, expect} from "vitest";
import {SpecificationParser} from "../SpecificationParser";
import {QuestionGenerator} from "../generator/QuestionGenerator";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
import {SeededRandomGenerator} from "../random";
import partOneSpec from "../../../assets/part_one.txt?raw";
const NEW_TEMPLATE_IDS = [
	"th-mc-1",
	"th-sa-1",
	"th-mc-2",
	"th-sa-2",
	"th-tf-1",
	"gl-mc-1",
	"gl-sa-1",
	"gl-ne-1",
	"gl-mc-2",
	"gl-sa-2",
	"gl-mc-3",
];
function buildGenerator(seed: number): {gen: QuestionGenerator; templateIds: string[]} {
	const parser = new SpecificationParser();
	const spec = parser.parse(partOneSpec);
	const evaluator = new ExpressionEvaluator();
	return {gen: new QuestionGenerator(spec.templates, evaluator, new SeededRandomGenerator(seed)), templateIds: spec.templates.map(t => t.id)};
}
describe("Thermodynamics content (task 2.30)", () => {
	it("registers the thermodynamics unit with 2 topics and 4 skills", () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(partOneSpec);
		const unit = spec.units.find(u => u.id === "thermodynamics");
		expect(unit).toBeDefined();
		const topics = spec.topics.filter(t => t.unit_id === "thermodynamics");
		expect(topics.map(t => t.id).sort()).toEqual(["gas-laws", "temperature-heat"]);
		const skills = spec.skills.filter(s => s.topic_id === "temperature-heat" || s.topic_id === "gas-laws");
		expect(skills.length).toBe(4);
		expect(skills.map(s => s.id).sort()).toEqual(["gl-ideal", "gl-processes", "th-heat", "th-temp"]);
	});
	it("contains all 11 new thermodynamics templates referencing valid topics/skills", () => {
		const parser = new SpecificationParser();
		const spec = parser.parse(partOneSpec);
		const topicIds = new Set(spec.topics.map(t => t.id));
		const skillIds = new Set(spec.skills.map(s => s.id));
		for (const id of NEW_TEMPLATE_IDS) {
			const tpl = spec.templates.find(t => t.id === id);
			expect(tpl).toBeDefined();
			expect(topicIds.has(tpl!.topic_id)).toBe(true);
			expect(skillIds.has(tpl!.skill_id)).toBe(true);
		}
		const thermoTemplates = spec.templates.filter(t => t.topic_id === "temperature-heat" || t.topic_id === "gas-laws");
		expect(thermoTemplates.length).toBe(NEW_TEMPLATE_IDS.length);
	});
	it("every new template generates without throwing and leaves no unsubstituted {var} in text", () => {
		const {gen, templateIds} = buildGenerator(1);
		for (const id of NEW_TEMPLATE_IDS) {
			expect(templateIds).toContain(id);
			const q = gen.generate({templateIds: [id]});
			expect(q).not.toBeNull();
			expect(q!.text).not.toMatch(/\{[a-zA-Z_]\w*\}/);
			expect(q!.answer.length).toBeGreaterThan(0);
			expect(q!.solution_latex.length).toBeGreaterThan(0);
		}
	});
	it("the gas-laws rms template (gl-sa-1) exercises the root() function and yields a positive speed", () => {
		const {gen} = buildGenerator(7);
		const q = gen.generate({templateIds: ["gl-sa-1"]});
		expect(q).not.toBeNull();
		const speed = Number(q!.answer);
		expect(Number.isFinite(speed)).toBe(true);
		expect(speed).toBeGreaterThan(0);
	});
	it("every new MC template produces 2-5 distinct choices containing the answer in mcq mode", () => {
		const mcIds = NEW_TEMPLATE_IDS.filter(id => id.includes("-mc-"));
		expect(mcIds.length).toBeGreaterThan(0);
		const {gen} = buildGenerator(3);
		for (const id of mcIds) {
			const q = gen.generate({templateIds: [id], responseMode: "mcq"});
			expect(q).not.toBeNull();
			expect(q!.choices).toBeDefined();
			const choices = q!.choices!;
			expect(choices.length).toBeGreaterThanOrEqual(2);
			expect(choices.length).toBeLessThanOrEqual(5);
			expect(new Set(choices).size).toBe(choices.length);
			expect(choices).toContain(q!.answer);
		}
	});
});
