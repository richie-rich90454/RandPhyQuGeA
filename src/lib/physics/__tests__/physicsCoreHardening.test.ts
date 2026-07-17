import {describe, it, expect} from "vitest";
import {PhysicsCore} from "../PhysicsCore";
import type {GeneratedQuestion, ResponseMode} from "../types";
import type {UniversalDistractorGeneratorLike} from "../contracts";
const SPEC = [
    "[UNIT]",
    "Id: U1",
    "Name: Mechanics",
    "[TOPIC]",
    "Id: T1",
    "Name: Kinematics",
    "UnitId: U1",
    "[SKILL]",
    "Id: S1",
    "Name: Accel",
    "TopicId: T1",
    "[TEMPLATE]",
    "Id: QMC",
    "TopicId: T1",
    "SkillId: S1",
    "QuestionType: MultipleChoice",
    "Difficulty: 2",
    "TextTemplate: A car moves {x} m then {y} m. Total distance?",
    "AnswerExpression: x + y",
    "Var.x: Type=int;Min=0;Max=10",
    "Var.y: Type=int;Min=0;Max=10",
    "Distractor: x + y + 1",
    "Distractor: x + y - 1",
    "[TEMPLATE]",
    "Id: QSA",
    "TopicId: T1",
    "SkillId: S1",
    "QuestionType: ShortAnswer",
    "Difficulty: 1",
    "TextTemplate: A ball falls for {t} s. How far? g=9.81.",
    "AnswerExpression: 0.5 * 9.81 * t * t",
    "Var.t: Type=int;Min=1;Max=5",
    "[TEMPLATE]",
    "Id: QTF",
    "TopicId: T1",
    "SkillId: S1",
    "QuestionType: TrueFalse",
    "Difficulty: 1",
    "TextTemplate: The acceleration is positive. a={a}",
    "AnswerExpression: a",
    "Var.a: Type=int;Min=-5;Max=5",
    "[TEMPLATE]",
    "Id: QFB",
    "TopicId: T1",
    "SkillId: S1",
    "QuestionType: FillInBlank",
    "Difficulty: 1",
    "TextTemplate: The value {x} doubled is ___.",
    "AnswerExpression: x * 2",
    "Var.x: Type=int;Min=1;Max=10",
    "[TEMPLATE]",
    "Id: QNE",
    "TopicId: T1",
    "SkillId: S1",
    "QuestionType: NumericEntry",
    "Difficulty: 2",
    "TextTemplate: Compute {x} - {y}.",
    "AnswerExpression: x - y",
    "Var.x: Type=int;Min=10;Max=20",
    "Var.y: Type=int;Min=1;Max=9",
].join("\n");
interface TypeCase {
    templateId: string;
    type: string;
}
const CASES: TypeCase[] = [
    {templateId: "QMC", type: "MC"},
    {templateId: "QSA", type: "SA"},
    {templateId: "QTF", type: "TF"},
    {templateId: "QFB", type: "FB"},
    {templateId: "QNE", type: "NE"},
];
const MODES: ResponseMode[] = ["frq", "mcq"];
function buildCore(seed: number): PhysicsCore {
    return PhysicsCore.default().createSeeded(seed);
}
function wrongResponseFor(c: TypeCase, q: GeneratedQuestion): string {
    if (c.type === "TF") {
        return q.answer === "True" ? "False" : "True";
    }
    return String(Number(q.answer) + 1000);
}
describe("PhysicsCore hardening: every question type x every response mode (end-to-end, seeded RNG)", () => {
    const spec = new PhysicsCore().parseSpecification(SPEC);
    for (const c of CASES) {
        describe(`${c.type} end-to-end through PhysicsCore`, () => {
            for (const mode of MODES) {
                it(`generates a valid ${mode} question for template ${c.templateId}`, () => {
                    const core = buildCore(42);
                    const q = core.generateQuestion(spec, {templateIds: [c.templateId], responseMode: mode});
                    expect(q).not.toBeNull();
                    expect(q?.question_type).toBe(c.type);
                    expect(q?.response_mode).toBe(mode);
                    expect(q?.text).not.toContain("{");
                    expect(q?.answer.length).toBeGreaterThan(0);
                    if (mode === "mcq") {
                        expect(q?.choices).toBeDefined();
                        expect(q?.choices?.length).toBeGreaterThanOrEqual(2);
                        expect(q?.correct_choice_index).toBeDefined();
                        const idx = q?.correct_choice_index ?? -1;
                        expect(q?.choices?.[idx]).toBe(q?.answer);
                        const unique = new Set(q?.choices);
                        expect(unique.size).toBe(q?.choices?.length);
                    } else {
                        expect(q?.choices).toBeUndefined();
                        expect(q?.correct_choice_index).toBeUndefined();
                    }
                });
                it(`reproduces identical text/answer/choices for ${mode} across two seeded cores (seed=123)`, () => {
                    const core1 = buildCore(123);
                    const core2 = buildCore(123);
                    const q1 = core1.generateQuestion(spec, {templateIds: [c.templateId], responseMode: mode});
                    const q2 = core2.generateQuestion(spec, {templateIds: [c.templateId], responseMode: mode});
                    expect(q1).not.toBeNull();
                    expect(q2).not.toBeNull();
                    expect(q1?.text).toBe(q2?.text);
                    expect(q1?.answer).toBe(q2?.answer);
                    expect(q1?.response_mode).toBe(q2?.response_mode);
                    if (mode === "mcq") {
                        expect(q1?.choices).toEqual(q2?.choices);
                        expect(q1?.correct_choice_index).toBe(q2?.correct_choice_index);
                    }
                });
            }
            it("grades a correct response as correct and a wrong response as incorrect in both modes via the facade grader", () => {
                const core = buildCore(7);
                const grader = core.getGrader();
                const frq = core.generateQuestion(spec, {templateIds: [c.templateId], responseMode: "frq"})!;
                expect(grader.grade(frq, frq.answer).is_correct).toBe(true);
                expect(grader.grade(frq, wrongResponseFor(c, frq)).is_correct).toBe(false);
                const mcq = core.generateQuestion(spec, {templateIds: [c.templateId], responseMode: "mcq"})!;
                const correctIndex = mcq.correct_choice_index ?? -1;
                expect(grader.grade(mcq, mcq.answer, correctIndex).is_correct).toBe(true);
                const wrongIndex = (correctIndex + 1) % (mcq.choices?.length ?? 1);
                expect(grader.grade(mcq, mcq.choices?.[wrongIndex] ?? "", wrongIndex).is_correct).toBe(false);
            });
        });
    }
    it("covers all 5 question types x 2 response modes = 10 generation combinations", () => {
        const core = buildCore(1);
        const generated: string[] = [];
        for (const c of CASES) {
            for (const mode of MODES) {
                const q = core.generateQuestion(spec, {templateIds: [c.templateId], responseMode: mode});
                expect(q).not.toBeNull();
                expect(q?.question_type).toBe(c.type);
                generated.push(`${c.type}:${mode}`);
            }
        }
        expect(generated.length).toBe(10);
        expect(new Set(generated).size).toBe(10);
    });
    it("different seeds diverge: at least one type's text differs between seed 1 and seed 2", () => {
        const core1 = buildCore(1);
        const core2 = buildCore(2);
        const texts1: string[] = [];
        const texts2: string[] = [];
        for (const c of CASES) {
            const q1 = core1.generateQuestion(spec, {templateIds: [c.templateId], responseMode: "frq"});
            const q2 = core2.generateQuestion(spec, {templateIds: [c.templateId], responseMode: "frq"});
            texts1.push(q1?.text ?? "");
            texts2.push(q2?.text ?? "");
        }
        expect(texts1.join("|")).not.toBe(texts2.join("|"));
    });
    it("reproduces a full 5-question batch across two seeded cores (seed=99)", () => {
        const core1 = buildCore(99);
        const core2 = buildCore(99);
        const batch1 = core1.generateBatch(spec, 5);
        const batch2 = core2.generateBatch(spec, 5);
        expect(batch1.length).toBe(5);
        expect(batch2.length).toBe(5);
        for (let i = 0; i < batch1.length; i++) {
            expect(batch1[i]?.text).toBe(batch2[i]?.text);
            expect(batch1[i]?.answer).toBe(batch2[i]?.answer);
            expect(batch1[i]?.response_mode).toBe(batch2[i]?.response_mode);
            expect(batch1[i]?.choices).toEqual(batch2[i]?.choices);
            expect(batch1[i]?.correct_choice_index).toBe(batch2[i]?.correct_choice_index);
        }
    });
});
describe("PhysicsCore custom distractorGenerator not UniversalDistractorGenerator instance", () => {
    it("constructs a McqAssembler with undefined distractor generator when the custom generator is not a UniversalDistractorGenerator instance", () => {
        const fake: UniversalDistractorGeneratorLike = {
            generate: () => [],
            register: () => {},
        };
        const core = new PhysicsCore(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, fake);
        expect(core.getDistractorGenerator()).toBe(fake);
        expect(core.getMcqAssembler()).toBeDefined();
    });
});
