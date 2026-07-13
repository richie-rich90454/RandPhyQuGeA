import {describe, it, expect} from "vitest";
import {UniversalDistractorGenerator} from "../generator/UniversalDistractorGenerator";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
import {SeededRandomGenerator} from "../random";
import type {DistractorContext, ResponseFormatStrategy} from "../contracts";
import type {QuestionTemplate} from "../types";
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
        distractor_expressions: [],
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
describe("UniversalDistractorGenerator", () => {
    describe("dedup against the correct answer", () => {
        it("excludes distractors that evaluate to the same formatted value as the answer", () => {
            const gen = new UniversalDistractorGenerator();
            const context = buildContext({
                answer: "5",
                answerValue: 5,
                template: buildTemplate({
                    question_type: "MC",
                    distractor_expressions: ["x + 0", "x * 1", "x + 1", "x - 1"],
                }),
                variables: {x: 5},
            });
            const distractors = gen.generate(context, 3, new SeededRandomGenerator(1));
            expect(distractors).not.toContain("5");
            expect(new Set(distractors).size).toBe(distractors.length);
        });
        it("excludes duplicate distractors that evaluate to the same value as each other", () => {
            const gen = new UniversalDistractorGenerator();
            const context = buildContext({
                answer: "5",
                answerValue: 5,
                template: buildTemplate({
                    question_type: "MC",
                    distractor_expressions: ["x + 1", "x + 1", "x + 1"],
                }),
                variables: {x: 5},
            });
            const distractors = gen.generate(context, 3, new SeededRandomGenerator(1));
            expect(new Set(distractors).size).toBe(distractors.length);
        });
    });
    describe("choice-count scaling", () => {
        it("returns exactly the requested count when enough distractors are available", () => {
            const gen = new UniversalDistractorGenerator();
            const context = buildContext({
                answer: "5",
                answerValue: 5,
                template: buildTemplate({question_type: "MC", distractor_expressions: []}),
            });
            expect(gen.generate(context, 1, new SeededRandomGenerator(1)).length).toBe(1);
            expect(gen.generate(context, 3, new SeededRandomGenerator(1)).length).toBe(3);
            expect(gen.generate(context, 5, new SeededRandomGenerator(1)).length).toBe(5);
        });
        it("returns fewer than requested when the strategy cannot produce enough", () => {
            const gen = new UniversalDistractorGenerator();
            const context = buildContext({
                answer: "True",
                answerValue: Number.NaN,
                template: buildTemplate({question_type: "TF"}),
            });
            const distractors = gen.generate(context, 3, new SeededRandomGenerator(1));
            expect(distractors).toEqual(["False"]);
            expect(distractors.length).toBeLessThan(3);
        });
    });
    describe("dedup against numerically-equal formatted variants", () => {
        it("excludes distractors that are numerically equal to the answer but formatted differently (e.g. 5.0 vs 5)", () => {
            const gen = new UniversalDistractorGenerator();
            const custom: ResponseFormatStrategy = {
                questionType: "MC",
                generateDistractors: () => ["5.0", "5.00", "6", "7", "8"],
            };
            gen.register(custom);
            const context = buildContext({
                answer: "5",
                answerValue: 5,
                template: buildTemplate({question_type: "MC"}),
            });
            const distractors = gen.generate(context, 3, new SeededRandomGenerator(1));
            expect(distractors).not.toContain("5");
            expect(distractors).not.toContain("5.0");
            expect(distractors).not.toContain("5.00");
            expect(distractors).toEqual(["6", "7", "8"]);
        });
        it("excludes a numerically-equal distractor when answer has a decimal point (e.g. 5 vs 5.0)", () => {
            const gen = new UniversalDistractorGenerator();
            const custom: ResponseFormatStrategy = {
                questionType: "NE",
                generateDistractors: () => ["5", "6", "7"],
            };
            gen.register(custom);
            const context = buildContext({
                answer: "5.0",
                answerValue: 5,
                template: buildTemplate({question_type: "NE"}),
            });
            const distractors = gen.generate(context, 2, new SeededRandomGenerator(1));
            expect(distractors).not.toContain("5");
            expect(distractors).not.toContain("5.0");
            expect(distractors).toEqual(["6", "7"]);
        });
        it("does not treat non-numeric distractors as matching a numeric answer", () => {
            const gen = new UniversalDistractorGenerator();
            const custom: ResponseFormatStrategy = {
                questionType: "MC",
                generateDistractors: () => ["five", "6", "7"],
            };
            gen.register(custom);
            const context = buildContext({
                answer: "5",
                answerValue: 5,
                template: buildTemplate({question_type: "MC"}),
            });
            const distractors = gen.generate(context, 3, new SeededRandomGenerator(1));
            expect(distractors).toContain("five");
            expect(distractors).toContain("6");
            expect(distractors).toContain("7");
        });
    });
    describe("no-correct-answer-duplicated invariant", () => {
        it("never includes the correct answer in the generated distractors across many seeds", () => {
            const gen = new UniversalDistractorGenerator();
            const context = buildContext({
                answer: "5",
                answerValue: 5,
                template: buildTemplate({question_type: "MC", distractor_expressions: ["x + 1", "x - 1", "x * 2"]}),
                variables: {x: 5},
            });
            for (let seed = 1; seed <= 10; seed++) {
                const distractors = gen.generate(context, 3, new SeededRandomGenerator(seed));
                expect(distractors).not.toContain("5");
            }
        });
    });
    describe("per-type strategy dispatch", () => {
        it("uses the Boolean strategy to return the opposite for TF questions", () => {
            const gen = new UniversalDistractorGenerator();
            const context = buildContext({
                answer: "True",
                answerValue: Number.NaN,
                template: buildTemplate({question_type: "TF"}),
            });
            expect(gen.generate(context, 1, new SeededRandomGenerator(1))).toEqual(["False"]);
        });
        it("uses the Numeric strategy for NE questions", () => {
            const gen = new UniversalDistractorGenerator();
            const context = buildContext({
                answer: "5",
                answerValue: 5,
                template: buildTemplate({question_type: "NE", distractor_expressions: []}),
            });
            const distractors = gen.generate(context, 3, new SeededRandomGenerator(1));
            expect(distractors.length).toBe(3);
            expect(distractors).not.toContain("5");
        });
        it("uses the BlankToken strategy for FB questions", () => {
            const gen = new UniversalDistractorGenerator();
            const context = buildContext({
                answer: "8",
                answerValue: 8,
                template: buildTemplate({question_type: "FB", distractor_expressions: []}),
            });
            const distractors = gen.generate(context, 3, new SeededRandomGenerator(1));
            expect(distractors.length).toBe(3);
            expect(distractors).not.toContain("8");
        });
    });
    describe("open-closed extension", () => {
        it("allows registering a custom strategy that overrides the default for a type", () => {
            const gen = new UniversalDistractorGenerator();
            const custom: ResponseFormatStrategy = {
                questionType: "MC",
                generateDistractors: (_ctx, count) => ["100", "200", "300"].slice(0, count),
            };
            gen.register(custom);
            const context = buildContext({
                answer: "5",
                answerValue: 5,
                template: buildTemplate({question_type: "MC"}),
            });
            expect(gen.generate(context, 2, new SeededRandomGenerator(1))).toEqual(["100", "200"]);
        });
        it("falls back to the ShortAnswerNeighbor strategy for an unregistered type", () => {
            const gen = new UniversalDistractorGenerator();
            const context = buildContext({
                answer: "5",
                answerValue: 5,
                template: buildTemplate({question_type: "UnknownType"}),
            });
            const distractors = gen.generate(context, 2, new SeededRandomGenerator(1));
            expect(distractors.length).toBe(2);
            expect(distractors).not.toContain("5");
        });
        it("createDefault returns a generator with all standard strategies registered", () => {
            const gen = UniversalDistractorGenerator.createDefault();
            expect(gen.get("MC")).toBeDefined();
            expect(gen.get("NE")).toBeDefined();
            expect(gen.get("TF")).toBeDefined();
            expect(gen.get("FB")).toBeDefined();
            expect(gen.get("SA")).toBeDefined();
        });
    });
});
