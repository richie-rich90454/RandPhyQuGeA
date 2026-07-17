import {describe, it, expect} from "vitest";
import {SpecificationParser} from "../SpecificationParser";
import {QuestionGenerator} from "../generator/QuestionGenerator";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
import {SeededRandomGenerator} from "../random";
import partOneSpec from "../../../assets/part_one.txt?raw";
const NEW_TEMPLATE_IDS = ["qu-mc-1", "qu-sa-1", "qu-mc-2", "qu-ne-1", "qu-tf-1", "nu-mc-1", "nu-sa-1", "nu-ne-1", "nu-mc-2", "nu-sa-2", "nu-ne-2"];
function buildGenerator(seed: number): {gen: QuestionGenerator; templateIds: string[]} {
    const parser = new SpecificationParser();
    const spec = parser.parse(partOneSpec);
    const evaluator = new ExpressionEvaluator();
    return {gen: new QuestionGenerator(spec.templates, evaluator, new SeededRandomGenerator(seed)), templateIds: spec.templates.map(t => t.id)};
}
describe("Modern physics content (task 2.31)", () => {
    it("registers the modern-physics unit with 2 topics and 4 skills", () => {
        const parser = new SpecificationParser();
        const spec = parser.parse(partOneSpec);
        const unit = spec.units.find(u => u.id === "modern-physics");
        expect(unit).toBeDefined();
        const topics = spec.topics.filter(t => t.unit_id === "modern-physics");
        expect(topics.map(t => t.id).toSorted()).toEqual(["nuclear", "quantum"]);
        const skills = spec.skills.filter(s => s.topic_id === "quantum" || s.topic_id === "nuclear");
        expect(skills.length).toBe(4);
        expect(skills.map(s => s.id).toSorted()).toEqual(["nu-halflife", "nu-massenergy", "qu-photoelectric", "qu-photons"]);
    });
    it("contains all 11 new modern-physics templates referencing valid topics/skills", () => {
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
        const modernTemplates = spec.templates.filter(t => t.topic_id === "quantum" || t.topic_id === "nuclear");
        expect(modernTemplates.length).toBe(NEW_TEMPLATE_IDS.length);
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
    it("the half-life decay template (nu-mc-2) exercises the ^ operator and yields a remaining count below the initial count", () => {
        const {gen} = buildGenerator(7);
        const q = gen.generate({templateIds: ["nu-mc-2"]});
        expect(q).not.toBeNull();
        const remaining = Number(q!.answer);
        expect(Number.isFinite(remaining)).toBe(true);
        expect(remaining).toBeGreaterThan(0);
        const n0Match = q!.text.match(/initially has (\S+) nuclei/);
        expect(n0Match).not.toBeNull();
        const n0 = Number(n0Match![1]);
        expect(remaining).toBeLessThan(n0);
    });
    it("the decay-time template (nu-ne-2) exercises log2() and yields a finite positive time", () => {
        const {gen} = buildGenerator(4);
        const q = gen.generate({templateIds: ["nu-ne-2"]});
        expect(q).not.toBeNull();
        const time = Number(q!.answer);
        expect(Number.isFinite(time)).toBe(true);
        expect(time).toBeGreaterThan(0);
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
