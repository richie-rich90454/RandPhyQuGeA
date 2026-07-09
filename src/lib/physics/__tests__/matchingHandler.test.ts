import {describe, it, expect} from "vitest";
import {MatchingHandler, parseMatchingPairs} from "../generator/MatchingHandler";
import {MatchingDistractorStrategy} from "../generator/strategies/MatchingDistractorStrategy";
import {QuestionTypeRegistry} from "../generator/QuestionTypeRegistry";
import {UniversalDistractorGenerator} from "../generator/UniversalDistractorGenerator";
import {McqAssembler} from "../generator/McqAssembler";
import {SeededRandom} from "../random/SeededRandom";
import type {RandomGenerator} from "../contracts";
import type {QuestionTemplate} from "../types";
class StubRandom implements RandomGenerator {
	private readonly fixedInt: number;
	public constructor(fixedInt = 0) {
		this.fixedInt = fixedInt;
	}
	public next(): number {
		return 0;
	}
	public nextInt(min: number, max: number): number {
		return Math.max(min, Math.min(max, this.fixedInt));
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
function matchingTemplate(): QuestionTemplate {
	return {
		id: "m1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "MATCHING",
		difficulty: 2,
		text_template: "Which unit matches: {prompt}?",
		answer_expression: "0",
		solution_template: "The unit for {prompt} is {answer}.",
		solution_latex_template: "",
		variable_definitions: [],
		distractor_expressions: ["Force=Newton", "Energy=Joule", "Power=Watt"],
	};
}
describe("parseMatchingPairs", () => {
	it("parses left=right entries", () => {
		const pairs = parseMatchingPairs(matchingTemplate());
		expect(pairs).toEqual([
			{left: "Force", right: "Newton"},
			{left: "Energy", right: "Joule"},
			{left: "Power", right: "Watt"},
		]);
	});
	it("skips entries without an = or with empty sides", () => {
		const tpl: QuestionTemplate = {...matchingTemplate(), distractor_expressions: ["Ok=Good", "nope", "=Bad", "Bad=", " A = B "]};
		expect(parseMatchingPairs(tpl)).toEqual([
			{left: "Ok", right: "Good"},
			{left: "A", right: "B"},
		]);
	});
});
describe("MatchingHandler.handle", () => {
	it("picks a pair and sets the answer to the matching right item", () => {
		const handler = new MatchingHandler();
		const q = handler.handle(matchingTemplate(), {}, stubEvaluator(), new StubRandom(0));
		expect(q.answer).toBe("Newton");
		expect(q.text).toBe("Which unit matches: Force?");
		expect(q.response_mode).toBe("frq");
	});
	it("selects a different pair for a different random index", () => {
		const handler = new MatchingHandler();
		const q = handler.handle(matchingTemplate(), {}, stubEvaluator(), new StubRandom(1));
		expect(q.answer).toBe("Joule");
		expect(q.text).toBe("Which unit matches: Energy?");
	});
	it("substitutes {answer} into the solution", () => {
		const handler = new MatchingHandler();
		const q = handler.handle(matchingTemplate(), {}, stubEvaluator(), new StubRandom(2));
		expect(q.solution_text).toBe("The unit for Power is Watt.");
	});
	it("produces a usable question when no pairs are present", () => {
		const handler = new MatchingHandler();
		const tpl: QuestionTemplate = {...matchingTemplate(), distractor_expressions: []};
		const q = handler.handle(tpl, {}, stubEvaluator(), new StubRandom(0));
		expect(q.answer).toBe("");
		expect(q.text).toContain("?");
	});
});
describe("MatchingDistractorStrategy", () => {
	it("returns the other right items excluding the answer", () => {
		const strategy = new MatchingDistractorStrategy();
		const context = {answer: "Newton", answerValue: Number.NaN, template: matchingTemplate(), variables: {}, evaluator: stubEvaluator()};
		expect(strategy.generateDistractors(context, 5, new StubRandom()).sort()).toEqual(["Joule", "Watt"]);
	});
	it("respects the count limit", () => {
		const strategy = new MatchingDistractorStrategy();
		const context = {answer: "Newton", answerValue: Number.NaN, template: matchingTemplate(), variables: {}, evaluator: stubEvaluator()};
		expect(strategy.generateDistractors(context, 1, new StubRandom()).length).toBe(1);
	});
	it("returns no distractors when only the answer pair exists", () => {
		const strategy = new MatchingDistractorStrategy();
		const tpl: QuestionTemplate = {...matchingTemplate(), distractor_expressions: ["Force=Newton"]};
		const context = {answer: "Newton", answerValue: Number.NaN, template: tpl, variables: {}, evaluator: stubEvaluator()};
		expect(strategy.generateDistractors(context, 3, new StubRandom())).toEqual([]);
	});
});
describe("Matching registration", () => {
	it("is registered in the default QuestionTypeRegistry", () => {
		const registry = QuestionTypeRegistry.createDefault();
		const handler = registry.get("MATCHING");
		expect(handler).toBeInstanceOf(MatchingHandler);
	});
	it("is registered in the default UniversalDistractorGenerator", () => {
		const gen = UniversalDistractorGenerator.createDefault();
		expect(gen.get("MATCHING")).toBeInstanceOf(MatchingDistractorStrategy);
	});
});
describe("Matching end-to-end MCQ assembly", () => {
	it("assembles choices containing the answer and distractors with a valid correct index", () => {
		const handler = new MatchingHandler();
		const template = matchingTemplate();
		const base = handler.handle(template, {}, stubEvaluator(), new StubRandom(0));
		const assembler = new McqAssembler(UniversalDistractorGenerator.createDefault());
		const context = {answer: base.answer, answerValue: Number.NaN, template, variables: base.variables, evaluator: stubEvaluator()};
		const mcq = assembler.assemble(base, context, new SeededRandom(42), 3, 42);
		expect(mcq.response_mode).toBe("mcq");
		expect(mcq.choices).toBeDefined();
		const choices = mcq.choices!;
		expect(choices.length).toBe(3);
		expect(choices).toContain("Newton");
		expect(choices).toContain("Joule");
		expect(choices).toContain("Watt");
		expect(mcq.correct_choice_index).toBe(choices.indexOf("Newton"));
		expect(mcq.correct_choice_index).toBeGreaterThanOrEqual(0);
	});
});
function stubEvaluator() {
	return {
		evaluate: (_expr: string) => 0,
		formatNumeric: (v: number) => String(v),
	};
}
