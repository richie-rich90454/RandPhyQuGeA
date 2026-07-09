import {describe, it, expect} from "vitest";
import {MultipleResponseHandler, parseMultipleResponseOptions} from "../generator/MultipleResponseHandler";
import {MultipleResponseAssembler} from "../generator/MultipleResponseAssembler";
import {QuestionTypeRegistry} from "../generator/QuestionTypeRegistry";
import {QuestionGenerator} from "../generator/QuestionGenerator";
import {AnswerGrader} from "../grader/AnswerGrader";
import type {RandomGenerator} from "../contracts";
import type {GeneratedQuestion, QuestionTemplate} from "../types";
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
function multiResponseTemplate(): QuestionTemplate {
	return {
		id: "mr1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "MULTI_RESPONSE",
		difficulty: 3,
		text_template: "Which of the following are vectors? {options}",
		answer_expression: "0",
		solution_template: "The vectors are: {answer}.",
		solution_latex_template: "",
		variable_definitions: [],
		distractor_expressions: ["Force=true", "Energy=false", "Momentum=true", "Mass=false"],
	};
}
describe("parseMultipleResponseOptions", () => {
	it("parses label=true/false entries", () => {
		expect(parseMultipleResponseOptions(multiResponseTemplate())).toEqual([
			{label: "Force", correct: true},
			{label: "Energy", correct: false},
			{label: "Momentum", correct: true},
			{label: "Mass", correct: false},
		]);
	});
	it("accepts 1/0/yes/no flags and skips invalid entries", () => {
		const tpl: QuestionTemplate = {...multiResponseTemplate(), distractor_expressions: ["A=1", "B=0", "C=yes", "D=no", "noequals", "=true", "Bad=maybe", "X=true"]};
		expect(parseMultipleResponseOptions(tpl)).toEqual([
			{label: "A", correct: true},
			{label: "B", correct: false},
			{label: "C", correct: true},
			{label: "D", correct: false},
			{label: "X", correct: true},
		]);
	});
});
describe("MultipleResponseHandler.handle", () => {
	it("joins the correct labels into the answer and substitutes {options}", () => {
		const handler = new MultipleResponseHandler();
		const q = handler.handle(multiResponseTemplate(), {}, stubEvaluator(), new StubRandom());
		expect(q.answer).toBe("Force, Momentum");
		expect(q.response_mode).toBe("frq");
		expect(q.text).toBe("Which of the following are vectors? Force, Energy, Momentum, Mass");
	});
	it("substitutes {answer} into the solution", () => {
		const handler = new MultipleResponseHandler();
		const q = handler.handle(multiResponseTemplate(), {}, stubEvaluator(), new StubRandom());
		expect(q.solution_text).toBe("The vectors are: Force, Momentum.");
	});
	it("produces an empty answer when no options are correct", () => {
		const handler = new MultipleResponseHandler();
		const tpl: QuestionTemplate = {...multiResponseTemplate(), distractor_expressions: ["A=false", "B=false"]};
		const q = handler.handle(tpl, {}, stubEvaluator(), new StubRandom());
		expect(q.answer).toBe("");
	});
});
describe("MultipleResponseAssembler", () => {
	it("builds choices from all options and records correct indices", () => {
		const handler = new MultipleResponseHandler();
		const template = multiResponseTemplate();
		const base = handler.handle(template, {}, stubEvaluator(), new StubRandom());
		const assembler = new MultipleResponseAssembler();
		const mcq = assembler.assemble(base, template, new StubRandom());
		expect(mcq.response_mode).toBe("mcq");
		expect(mcq.choices).toEqual(["Force", "Energy", "Momentum", "Mass"]);
		expect(mcq.correct_choice_indices).toEqual([0, 2]);
	});
	it("falls back to frq with a grader hint when no options are present", () => {
		const handler = new MultipleResponseHandler();
		const tpl: QuestionTemplate = {...multiResponseTemplate(), distractor_expressions: []};
		const base = handler.handle(tpl, {}, stubEvaluator(), new StubRandom());
		const mcq = new MultipleResponseAssembler().assemble(base, tpl, new StubRandom());
		expect(mcq.response_mode).toBe("frq");
		expect(mcq.grader_hint).toBe("mcq-unavailable-fallback");
	});
});
describe("MultipleResponse registration", () => {
	it("is registered in the default QuestionTypeRegistry", () => {
		const registry = QuestionTypeRegistry.createDefault();
		const handler = registry.get("MULTI_RESPONSE");
		expect(handler).toBeInstanceOf(MultipleResponseHandler);
	});
});
describe("QuestionGenerator end-to-end MULTI_RESPONSE", () => {
	it("produces a multi-select MCQ with choices and correct_choice_indices", () => {
		const gen = new QuestionGenerator([multiResponseTemplate()], stubEvaluator(), new StubRandom());
		const q = gen.generate({questionType: "MULTI_RESPONSE", responseMode: "mcq"});
		expect(q).not.toBeNull();
		const mcq = q as GeneratedQuestion;
		expect(mcq.response_mode).toBe("mcq");
		expect(mcq.choices).toEqual(["Force", "Energy", "Momentum", "Mass"]);
		expect(mcq.correct_choice_indices).toEqual([0, 2]);
	});
	it("produces a free-response question without choices by default", () => {
		const gen = new QuestionGenerator([multiResponseTemplate()], stubEvaluator(), new StubRandom());
		const q = gen.generate({questionType: "MULTI_RESPONSE"});
		expect(q).not.toBeNull();
		const frq = q as GeneratedQuestion;
		expect(frq.response_mode).toBe("frq");
		expect(frq.choices).toBeUndefined();
		expect(frq.answer).toBe("Force, Momentum");
	});
});
describe("AnswerGrader multi-select", () => {
	function multiSelectQuestion(indices: number[]): GeneratedQuestion {
		return {
			id: "g1",
			topic_id: "t1",
			skill_id: "s1",
			question_type: "MULTI_RESPONSE",
			difficulty: 3,
			text: "Which are vectors?",
			answer: "Force, Momentum",
			choices: ["Force", "Energy", "Momentum", "Mass"],
			response_mode: "mcq",
			correct_choice_indices: indices,
			solution_text: "",
			solution_latex: "",
			variables: {},
		};
	}
	it("grades correct when the selected set equals the correct set", () => {
		const grader = new AnswerGrader();
		const q = multiSelectQuestion([0, 2]);
		expect(grader.grade(q, "0,2").is_correct).toBe(true);
	});
	it("is order-independent", () => {
		const grader = new AnswerGrader();
		const q = multiSelectQuestion([0, 2]);
		expect(grader.grade(q, "2,0").is_correct).toBe(true);
	});
	it("grades incorrect for a partial selection", () => {
		const grader = new AnswerGrader();
		const q = multiSelectQuestion([0, 2]);
		expect(grader.grade(q, "0").is_correct).toBe(false);
	});
	it("grades incorrect when an extra wrong option is selected", () => {
		const grader = new AnswerGrader();
		const q = multiSelectQuestion([0, 2]);
		expect(grader.grade(q, "0,1,2").is_correct).toBe(false);
	});
	it("grades incorrect when nothing is selected", () => {
		const grader = new AnswerGrader();
		const q = multiSelectQuestion([0, 2]);
		expect(grader.grade(q, "").is_correct).toBe(false);
	});
	it("normalizes the response and answer to sorted comma-joined indices", () => {
		const grader = new AnswerGrader();
		const q = multiSelectQuestion([2, 0]);
		const result = grader.grade(q, "2,0");
		expect(result.normalized_response).toBe("0,2");
		expect(result.normalized_answer).toBe("0,2");
	});
});
function stubEvaluator() {
	return {
		evaluate: (_expr: string) => 0,
		formatNumeric: (v: number) => String(v),
	};
}
