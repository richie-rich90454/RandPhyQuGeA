import {describe, it, expect} from "vitest";
import {OrderingHandler, parseOrderingItems, joinOrder} from "../generator/OrderingHandler";
import {OrderingDistractorStrategy} from "../generator/strategies/OrderingDistractorStrategy";
import {QuestionTypeRegistry} from "../generator/QuestionTypeRegistry";
import {UniversalDistractorGenerator} from "../generator/UniversalDistractorGenerator";
import {McqAssembler} from "../generator/McqAssembler";
import {SeededRandom} from "../random/SeededRandom";
import type {RandomGenerator} from "../contracts";
import type {QuestionTemplate} from "../types";
class StubRandom implements RandomGenerator {
	public next(): number {
		return 0;
	}
	public nextInt(min: number, max: number): number {
		return Math.max(min, Math.min(max, 0));
	}
	public nextDouble(min: number, _max: number): number {
		return min;
	}
	public pick<T>(items: T[]): T {
		return items[0]!;
	}
	public shuffle<T>(items: T[]): T[] {
		return [...items];
	}
}
function orderingTemplate(): QuestionTemplate {
	return {
		id: "o1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "ORDERING",
		difficulty: 3,
		text_template: "Arrange the states of matter by increasing particle energy: {prompt}",
		answer_expression: "0",
		solution_template: "The correct order is: {answer}.",
		solution_latex_template: "",
		variable_definitions: [],
		distractor_expressions: ["Solid", "Liquid", "Gas"],
	};
}
describe("parseOrderingItems", () => {
	it("parses non-empty trimmed entries preserving order", () => {
		expect(parseOrderingItems(orderingTemplate())).toEqual(["Solid", "Liquid", "Gas"]);
	});
	it("skips empty and whitespace-only entries", () => {
		const tpl: QuestionTemplate = {...orderingTemplate(), distractor_expressions: ["Alpha", "  ", "", "Beta", "Gamma"]};
		expect(parseOrderingItems(tpl)).toEqual(["Alpha", "Beta", "Gamma"]);
	});
});
describe("joinOrder", () => {
	it("joins items with a comma-space separator", () => {
		expect(joinOrder(["Solid", "Liquid", "Gas"])).toBe("Solid, Liquid, Gas");
	});
	it("returns an empty string for no items", () => {
		expect(joinOrder([])).toBe("");
	});
});
describe("OrderingHandler.handle", () => {
	it("sets the answer to the correctly-ordered item list", () => {
		const handler = new OrderingHandler();
		const q = handler.handle(orderingTemplate(), {}, stubEvaluator(), new StubRandom());
		expect(q.answer).toBe("Solid, Liquid, Gas");
		expect(q.response_mode).toBe("frq");
		expect(q.text).toContain("Solid");
		expect(q.text).toContain("Liquid");
		expect(q.text).toContain("Gas");
	});
	it("substitutes {answer} into the solution", () => {
		const handler = new OrderingHandler();
		const q = handler.handle(orderingTemplate(), {}, stubEvaluator(), new StubRandom());
		expect(q.solution_text).toBe("The correct order is: Solid, Liquid, Gas.");
	});
	it("produces a usable question when no items are present", () => {
		const handler = new OrderingHandler();
		const tpl: QuestionTemplate = {...orderingTemplate(), distractor_expressions: []};
		const q = handler.handle(tpl, {}, stubEvaluator(), new StubRandom());
		expect(q.answer).toBe("");
		expect(q.text).toContain("Arrange");
	});
});
describe("OrderingDistractorStrategy", () => {
	it("returns alternative orderings excluding the correct order", () => {
		const strategy = new OrderingDistractorStrategy();
		const context = {answer: "Solid, Liquid, Gas", answerValue: Number.NaN, template: orderingTemplate(), variables: {}, evaluator: stubEvaluator()};
		const distractors = strategy.generateDistractors(context, 5, new StubRandom());
		expect(distractors.length).toBe(5);
		expect(distractors).not.toContain("Solid, Liquid, Gas");
		expect(new Set(distractors).size).toBe(distractors.length);
		for (const d of distractors) {
			const parts = d.split(", ");
			expect(parts.sort()).toEqual(["Gas", "Liquid", "Solid"]);
		}
	});
	it("respects the count limit", () => {
		const strategy = new OrderingDistractorStrategy();
		const context = {answer: "Solid, Liquid, Gas", answerValue: Number.NaN, template: orderingTemplate(), variables: {}, evaluator: stubEvaluator()};
		expect(strategy.generateDistractors(context, 2, new StubRandom()).length).toBe(2);
	});
	it("returns no distractors when fewer than two items are present", () => {
		const strategy = new OrderingDistractorStrategy();
		const tpl: QuestionTemplate = {...orderingTemplate(), distractor_expressions: ["Only"]};
		const context = {answer: "Only", answerValue: Number.NaN, template: tpl, variables: {}, evaluator: stubEvaluator()};
		expect(strategy.generateDistractors(context, 3, new StubRandom())).toEqual([]);
	});
	it("produces unique non-correct orderings under a seeded rng", () => {
		const strategy = new OrderingDistractorStrategy();
		const context = {answer: "Solid, Liquid, Gas", answerValue: Number.NaN, template: orderingTemplate(), variables: {}, evaluator: stubEvaluator()};
		const distractors = strategy.generateDistractors(context, 4, new SeededRandom(7));
		expect(distractors.length).toBe(4);
		expect(distractors).not.toContain("Solid, Liquid, Gas");
		expect(new Set(distractors).size).toBe(distractors.length);
	});
});
describe("Ordering registration", () => {
	it("is registered in the default QuestionTypeRegistry", () => {
		const registry = QuestionTypeRegistry.createDefault();
		const handler = registry.get("ORDERING");
		expect(handler).toBeInstanceOf(OrderingHandler);
	});
	it("is registered in the default UniversalDistractorGenerator", () => {
		const gen = UniversalDistractorGenerator.createDefault();
		expect(gen.get("ORDERING")).toBeInstanceOf(OrderingDistractorStrategy);
	});
});
describe("Ordering end-to-end MCQ assembly", () => {
	it("assembles choices containing the answer and distractors with a valid correct index", () => {
		const handler = new OrderingHandler();
		const template = orderingTemplate();
		const base = handler.handle(template, {}, stubEvaluator(), new StubRandom());
		const assembler = new McqAssembler(UniversalDistractorGenerator.createDefault());
		const context = {answer: base.answer, answerValue: Number.NaN, template, variables: base.variables, evaluator: stubEvaluator()};
		const mcq = assembler.assemble(base, context, new SeededRandom(42), 4, 42);
		expect(mcq.response_mode).toBe("mcq");
		expect(mcq.choices).toBeDefined();
		const choices = mcq.choices!;
		expect(choices.length).toBe(4);
		expect(choices).toContain("Solid, Liquid, Gas");
		expect(mcq.correct_choice_index).toBe(choices.indexOf("Solid, Liquid, Gas"));
		expect(mcq.correct_choice_index).toBeGreaterThanOrEqual(0);
	});
});
function stubEvaluator() {
	return {
		evaluate: (_expr: string) => 0,
		formatNumeric: (v: number) => String(v),
	};
}
