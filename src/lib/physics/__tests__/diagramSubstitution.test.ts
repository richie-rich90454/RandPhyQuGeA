import {describe, it, expect} from "vitest";
import {TemplateSubstituter} from "../random/TemplateSubstituter";
import {BaseQuestionHandler} from "../generator/BaseQuestionHandler";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
import {SeededRandomGenerator} from "../random";
import type {ExpressionEvaluatorLike} from "../contracts";
import type {QuestionTemplate, GeneratedQuestion} from "../types";
class TestHandler extends BaseQuestionHandler {
    public readonly type = "TEST";
    protected formatAnswer(value: number, _evaluator: ExpressionEvaluatorLike): string {
        return String(value);
    }
}
function buildTemplate(overrides: Partial<QuestionTemplate>): QuestionTemplate {
    return {
        id: "T1",
        topic_id: "TOP",
        skill_id: "SK",
        question_type: "SA",
        difficulty: 1,
        text_template: "What is {x} + {x}?",
        answer_expression: "x + x",
        solution_template: "{x} + {x} = {answer}",
        solution_latex_template: "",
        variable_definitions: [{name: "x", var_type: "int", min: 3, max: 3}],
        distractor_expressions: [],
        ...overrides,
    };
}
describe("TemplateSubstituter.substituteDiagram", () => {
    const sub = new TemplateSubstituter();
    it("substitutes {var} tokens into a diagram template", () => {
        const result = sub.substituteDiagram('<circle r="{x}"/>', {x: 5});
        expect(result).toBe('<circle r="5"/>');
    });
    it("substitutes {answer} when provided", () => {
        const result = sub.substituteDiagram("<text>{answer}</text>", {}, "42");
        expect(result).toBe("<text>42</text>");
    });
    it("leaves unknown tokens as-is", () => {
        const result = sub.substituteDiagram('<line x="{y}"/>', {x: 1});
        expect(result).toBe('<line x="{y}"/>');
    });
    it("returns empty string for an empty template", () => {
        expect(sub.substituteDiagram("", {x: 1})).toBe("");
    });
    it("returns empty string for a whitespace-only template", () => {
        expect(sub.substituteDiagram("   ", {x: 1})).toBe("");
    });
    it("leaves {answer} as-is when no answer is provided", () => {
        const result = sub.substituteDiagram("<text>{answer}</text>", {});
        expect(result).toBe("<text>{answer}</text>");
    });
});
describe("BaseQuestionHandler diagram wiring", () => {
    it("substitutes diagram_svg and includes it on the generated question", () => {
        const handler = new TestHandler();
        const template = buildTemplate({diagram_svg: '<svg><circle r="{x}"/><text>{answer}</text></svg>'});
        const evaluator = new ExpressionEvaluator();
        const random = new SeededRandomGenerator(1);
        const q: GeneratedQuestion = handler.handle(template, {x: 3}, evaluator, random);
        expect(q.diagram_svg).toBe('<svg><circle r="3"/><text>6</text></svg>');
    });
    it("sets diagram_svg to undefined when the template has no diagram", () => {
        const handler = new TestHandler();
        const template = buildTemplate({});
        const evaluator = new ExpressionEvaluator();
        const random = new SeededRandomGenerator(1);
        const q: GeneratedQuestion = handler.handle(template, {x: 3}, evaluator, random);
        expect(q.diagram_svg).toBeUndefined();
    });
    it("produces an empty diagram_svg when the template diagram is whitespace-only", () => {
        const handler = new TestHandler();
        const template = buildTemplate({diagram_svg: "   "});
        const evaluator = new ExpressionEvaluator();
        const random = new SeededRandomGenerator(1);
        const q: GeneratedQuestion = handler.handle(template, {x: 3}, evaluator, random);
        expect(q.diagram_svg).toBe("");
    });
});
