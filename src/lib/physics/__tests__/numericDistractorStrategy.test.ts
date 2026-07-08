import {describe, it, expect} from "vitest";
import {NumericDistractorStrategy} from "../generator/strategies/NumericDistractorStrategy";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
import {SeededRandomGenerator} from "../random";
import type {DistractorContext} from "../contracts";
import type {QuestionTemplate} from "../types";
function buildTemplate(overrides: Partial<QuestionTemplate>): QuestionTemplate {
    return {
        id: "T1",
        topic_id: "TOP",
        skill_id: "SK",
        question_type: "NE",
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
        answer: "1.20",
        answerValue: 1.2,
        template: buildTemplate({}),
        variables: {x: 1.2},
        evaluator: new ExpressionEvaluator(),
        ...overrides,
    };
}
function countSigFigs(s: string): number {
    let str = s.trim().replace(/^[+-]/, "");
    const eMatch = str.match(/[eE]/);
    if (eMatch !== null && eMatch.index !== undefined) {
        str = str.slice(0, eMatch.index);
    }
    str = str.replace(".", "");
    str = str.replace(/^0+/, "");
    return str.length === 0 ? 0 : str.length;
}
describe("NumericDistractorStrategy (significant-figures-aware)", () => {
    const strategy = new NumericDistractorStrategy();
    describe("significant-figure preservation for decimal answers", () => {
        it("preserves the 3 sig figs of answer '1.20' across all perturbation distractors", () => {
            const context = buildContext({answer: "1.20", answerValue: 1.2});
            const distractors = strategy.generateDistractors(context, 5, new SeededRandomGenerator(1));
            expect(distractors.length).toBe(5);
            for (const d of distractors) {
                expect(countSigFigs(d)).toBe(3);
            }
        });
        it("preserves trailing significant zeros (e.g. '2.20' not '2.2')", () => {
            const context = buildContext({answer: "1.20", answerValue: 1.2});
            const distractors = strategy.generateDistractors(context, 5, new SeededRandomGenerator(1));
            const hasTrailingZero = distractors.some(d => /\.\d*0$/.test(d));
            expect(hasTrailingZero).toBe(true);
        });
        it("preserves the 3 sig figs of answer '3.14'", () => {
            const context = buildContext({answer: "3.14", answerValue: 3.14});
            const distractors = strategy.generateDistractors(context, 4, new SeededRandomGenerator(2));
            expect(distractors.length).toBe(4);
            for (const d of distractors) {
                expect(countSigFigs(d)).toBe(3);
            }
        });
        it("preserves the 2 sig figs of answer '0.050'", () => {
            const context = buildContext({answer: "0.050", answerValue: 0.05});
            const distractors = strategy.generateDistractors(context, 3, new SeededRandomGenerator(3));
            for (const d of distractors) {
                expect(countSigFigs(d)).toBe(2);
            }
        });
    });
    describe("distractor_expressions honor sig-fig formatting", () => {
        it("formats expression-based distractors to the answer's sig-fig count", () => {
            const context = buildContext({
                answer: "1.20",
                answerValue: 1.2,
                template: buildTemplate({distractor_expressions: ["x * 2", "x + 1"]}),
                variables: {x: 1.2},
            });
            const distractors = strategy.generateDistractors(context, 2, new SeededRandomGenerator(1));
            expect(distractors).toContain("2.40");
            expect(distractors).toContain("2.20");
            for (const d of distractors) {
                expect(countSigFigs(d)).toBe(3);
            }
        });
    });
    describe("invariants", () => {
        it("never includes the correct answer in the distractors", () => {
            const context = buildContext({answer: "1.20", answerValue: 1.2});
            const distractors = strategy.generateDistractors(context, 5, new SeededRandomGenerator(1));
            expect(distractors).not.toContain("1.20");
        });
        it("returns unique distractors", () => {
            const context = buildContext({answer: "1.20", answerValue: 1.2});
            const distractors = strategy.generateDistractors(context, 5, new SeededRandomGenerator(1));
            expect(new Set(distractors).size).toBe(distractors.length);
        });
        it("still produces distractors for integer answers (1 sig fig) without crashing", () => {
            const context = buildContext({answer: "5", answerValue: 5, template: buildTemplate({question_type: "MC"})});
            const distractors = strategy.generateDistractors(context, 3, new SeededRandomGenerator(1));
            expect(distractors.length).toBe(3);
            expect(distractors).not.toContain("5");
            expect(new Set(distractors).size).toBe(distractors.length);
        });
        it("falls back to formatNumeric for non-numeric answers (no perturbation path)", () => {
            const context = buildContext({answer: "True", answerValue: Number.NaN, template: buildTemplate({question_type: "TF"})});
            const distractors = strategy.generateDistractors(context, 3, new SeededRandomGenerator(1));
            expect(distractors.length).toBe(0);
        });
    });
});
