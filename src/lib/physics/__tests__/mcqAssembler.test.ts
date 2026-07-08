import {describe, it, expect} from "vitest";
import {McqAssembler} from "../generator/McqAssembler";
import {UniversalDistractorGenerator} from "../generator/UniversalDistractorGenerator";
import {UniformRandomGenerator} from "../random/UniformRandomGenerator";
import {SeededRandomGenerator} from "../random/SeededRandomGenerator";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
import {SpecificationParser} from "../SpecificationParser";
import {QuestionGenerator} from "../generator/QuestionGenerator";
import type {DistractorContext} from "../contracts";
import type {GeneratedQuestion, QuestionTemplate} from "../types";
function buildTemplate(overrides: Partial<QuestionTemplate>): QuestionTemplate {
    return {
        id: "T1",
        topic_id: "TOP",
        skill_id: "SK",
        question_type: "MC",
        difficulty: 1,
        text_template: "",
        answer_expression: "x",
        solution_template: "",
        solution_latex_template: "",
        variable_definitions: [],
        distractor_expressions: ["x + 1", "x - 1", "x * 2", "x + 2"],
        ...overrides,
    };
}
function buildContext(overrides: Partial<DistractorContext>): DistractorContext {
    return {
        answer: "5",
        answerValue: 5,
        template: buildTemplate({}),
        variables: {x: 5},
        evaluator: new ExpressionEvaluator(),
        ...overrides,
    };
}
function buildBaseQuestion(overrides: Partial<GeneratedQuestion>): GeneratedQuestion {
    return {
        id: "q1",
        topic_id: "TOP",
        skill_id: "SK",
        question_type: "MC",
        difficulty: 1,
        text: "text",
        answer: "5",
        response_mode: "frq",
        solution_text: "",
        solution_latex: "",
        variables: {x: 5},
        ...overrides,
    };
}
describe("McqAssembler", () => {
    describe("seeded ordering stability", () => {
        it("produces identical choice ordering for the same seed regardless of the passed random", () => {
            const assembler = new McqAssembler();
            const context = buildContext({});
            const base = buildBaseQuestion({});
            const q1 = assembler.assemble(base, context, new UniformRandomGenerator(), 4, 12345);
            const q2 = assembler.assemble(base, context, new UniformRandomGenerator(), 4, 12345);
            expect(q1.choices).toEqual(q2.choices);
            expect(q1.correct_choice_index).toBe(q2.correct_choice_index);
        });
        it("produces identical ordering across many repeated calls with the same seed", () => {
            const assembler = new McqAssembler();
            const context = buildContext({});
            const base = buildBaseQuestion({});
            const first = assembler.assemble(base, context, new UniformRandomGenerator(), 4, 999);
            for (let i = 0; i < 10; i++) {
                const q = assembler.assemble(base, context, new UniformRandomGenerator(), 4, 999);
                expect(q.choices).toEqual(first.choices);
                expect(q.correct_choice_index).toBe(first.correct_choice_index);
            }
        });
        it("marks the correct choice index pointing at the canonical answer", () => {
            const assembler = new McqAssembler();
            const context = buildContext({answer: "5"});
            const base = buildBaseQuestion({answer: "5"});
            const q = assembler.assemble(base, context, new UniformRandomGenerator(), 4, 42);
            expect(q.choices?.[q.correct_choice_index ?? -1]).toBe("5");
        });
        it("keeps all choices unique and never duplicates the correct answer", () => {
            const assembler = new McqAssembler();
            const context = buildContext({answer: "5"});
            const base = buildBaseQuestion({answer: "5"});
            const q = assembler.assemble(base, context, new UniformRandomGenerator(), 4, 7);
            const unique = new Set(q.choices);
            expect(unique.size).toBe(q.choices?.length);
            const correctCount = q.choices?.filter(c => c === "5").length ?? 0;
            expect(correctCount).toBe(1);
        });
        it("falls back to the passed random when no seed is supplied", () => {
            const assembler = new McqAssembler();
            const context = buildContext({});
            const base = buildBaseQuestion({});
            const q = assembler.assemble(base, context, new SeededRandomGenerator(1), 4);
            expect(q.response_mode).toBe("mcq");
            expect(q.choices?.length).toBe(4);
            expect(q.choices?.[q.correct_choice_index ?? -1]).toBe("5");
        });
    });
    describe("QuestionGenerator threads a derived seed", () => {
        const SPEC = [
            "[UNIT]",
            "Id: U1",
            "Name: Test",
            "[TOPIC]",
            "Id: T1",
            "Name: Test",
            "UnitId: U1",
            "[SKILL]",
            "Id: S1",
            "Name: Test",
            "TopicId: T1",
            "[TEMPLATE]",
            "Id: QMC",
            "TopicId: T1",
            "SkillId: S1",
            "QuestionType: MultipleChoice",
            "Difficulty: 1",
            "TextTemplate: Compute {x} + {y}.",
            "AnswerExpression: x + y",
            "Var.x: Type=int;Min=3;Max=3",
            "Var.y: Type=int;Min=4;Max=4",
            "Distractor: x + y + 1",
            "Distractor: x + y - 1",
        ].join("\n");
        it("produces stable MCQ choice ordering across two seeded generators with the same seed", () => {
            const spec = new SpecificationParser().parse(SPEC);
            const gen1 = new QuestionGenerator(spec.templates, new ExpressionEvaluator(), new SeededRandomGenerator(42));
            const gen2 = new QuestionGenerator(spec.templates, new ExpressionEvaluator(), new SeededRandomGenerator(42));
            const q1 = gen1.generate({templateIds: ["QMC"], responseMode: "mcq"});
            const q2 = gen2.generate({templateIds: ["QMC"], responseMode: "mcq"});
            expect(q1?.choices).toEqual(q2?.choices);
            expect(q1?.correct_choice_index).toBe(q2?.correct_choice_index);
        });
        it("keeps the correct answer at the correct_choice_index for the derived-seed path", () => {
            const spec = new SpecificationParser().parse(SPEC);
            const gen = new QuestionGenerator(spec.templates, new ExpressionEvaluator(), new SeededRandomGenerator(7));
            const q = gen.generate({templateIds: ["QMC"], responseMode: "mcq"});
            expect(q?.choices?.[q?.correct_choice_index ?? -1]).toBe("7");
        });
    });
    describe("default choice count", () => {
        it("uses 4 choices by default when choiceCount is omitted", () => {
            const assembler = new McqAssembler(UniversalDistractorGenerator.createDefault());
            const context = buildContext({});
            const base = buildBaseQuestion({});
            const q = assembler.assemble(base, context, new SeededRandomGenerator(1));
            expect(q.choices?.length).toBe(4);
        });
    });
});
