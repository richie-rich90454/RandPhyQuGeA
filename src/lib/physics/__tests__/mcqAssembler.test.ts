import {describe, it, expect} from "vitest";
import {McqAssembler} from "../generator/McqAssembler";
import {UniversalDistractorGenerator} from "../generator/UniversalDistractorGenerator";
import {UniformRandomGenerator} from "../random/UniformRandomGenerator";
import {SeededRandomGenerator} from "../random/SeededRandomGenerator";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
import {SpecificationParser} from "../SpecificationParser";
import {QuestionGenerator} from "../generator/QuestionGenerator";
import type {DistractorContext, ResponseFormatStrategy} from "../contracts";
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
	describe("no-distractor-available fallback", () => {
		it("falls back to frq with grader_hint when the strategy produces 0 distractors", () => {
			const emptyStrategy: ResponseFormatStrategy = {
				questionType: "EmptyType",
				generateDistractors: () => [],
			};
			const generator = UniversalDistractorGenerator.createDefault();
			generator.register(emptyStrategy);
			const assembler = new McqAssembler(generator);
			const context: DistractorContext = {
				answer: "42",
				answerValue: 42,
				template: buildTemplate({question_type: "EmptyType"}),
				variables: {},
				evaluator: new ExpressionEvaluator(),
			};
			const base = buildBaseQuestion({question_type: "EmptyType", answer: "42"});
			const q = assembler.assemble(base, context, new SeededRandomGenerator(1), 4);
			expect(q.response_mode).toBe("frq");
			expect(q.grader_hint).toBe("mcq-unavailable-fallback");
			expect(q.choices).toBeUndefined();
			expect(q.correct_choice_index).toBeUndefined();
		});
		it("still assembles mcq when at least 1 distractor is produced", () => {
			const singleStrategy: ResponseFormatStrategy = {
				questionType: "SingleType",
				generateDistractors: (_ctx, count) => ["99"].slice(0, count),
			};
			const generator = UniversalDistractorGenerator.createDefault();
			generator.register(singleStrategy);
			const assembler = new McqAssembler(generator);
			const context: DistractorContext = {
				answer: "42",
				answerValue: 42,
				template: buildTemplate({question_type: "SingleType"}),
				variables: {},
				evaluator: new ExpressionEvaluator(),
			};
			const base = buildBaseQuestion({question_type: "SingleType", answer: "42"});
			const q = assembler.assemble(base, context, new SeededRandomGenerator(1), 4);
			expect(q.response_mode).toBe("mcq");
			expect(q.grader_hint).toBeUndefined();
			expect(q.choices).toBeDefined();
			expect(q.choices).toContain("42");
			expect(q.choices).toContain("99");
		});
	});
	describe("short-distractor-set padding", () => {
		it("pads with a single 'None of the above' choice when fewer distractors than requested are produced", () => {
			const shortStrategy: ResponseFormatStrategy = {
				questionType: "ShortType",
				generateDistractors: (_ctx, count) => ["99"].slice(0, Math.min(count, 1)),
			};
			const generator = UniversalDistractorGenerator.createDefault();
			generator.register(shortStrategy);
			const assembler = new McqAssembler(generator);
			const context: DistractorContext = {
				answer: "42",
				answerValue: 42,
				template: buildTemplate({question_type: "ShortType"}),
				variables: {},
				evaluator: new ExpressionEvaluator(),
			};
			const base = buildBaseQuestion({question_type: "ShortType", answer: "42"});
			const q = assembler.assemble(base, context, new SeededRandomGenerator(1), 4);
			expect(q.response_mode).toBe("mcq");
			expect(q.choices).toContain("None of the above");
			expect(q.choices).toContain("42");
			expect(q.choices).toContain("99");
			const noneCount = q.choices?.filter(c => c === "None of the above").length ?? 0;
			expect(noneCount).toBe(1);
			const correctIndex = q.correct_choice_index ?? -1;
			expect(q.choices?.[correctIndex]).toBe("42");
			expect(q.choices?.[correctIndex]).not.toBe("None of the above");
		});
		it("never marks 'None of the above' as the correct choice", () => {
			const shortStrategy: ResponseFormatStrategy = {
				questionType: "ShortType2",
				generateDistractors: (_ctx, count) => ["7", "8"].slice(0, Math.min(count, 2)),
			};
			const generator = UniversalDistractorGenerator.createDefault();
			generator.register(shortStrategy);
			const assembler = new McqAssembler(generator);
			const context: DistractorContext = {
				answer: "5",
				answerValue: 5,
				template: buildTemplate({question_type: "ShortType2"}),
				variables: {},
				evaluator: new ExpressionEvaluator(),
			};
			const base = buildBaseQuestion({question_type: "ShortType2", answer: "5"});
			for (let seed = 1; seed <= 20; seed++) {
				const q = assembler.assemble(base, context, new SeededRandomGenerator(seed), 4);
				const correctIndex = q.correct_choice_index ?? -1;
				expect(q.choices?.[correctIndex]).toBe("5");
				expect(q.choices?.[correctIndex]).not.toBe("None of the above");
			}
		});
		it("does not pad when the strategy yields enough distractors to fill the target", () => {
			const fullStrategy: ResponseFormatStrategy = {
				questionType: "FullType",
				generateDistractors: (_ctx, count) => {
					const out: string[] = [];
					for (let i = 1; i <= count; i++) {
						out.push(String(100 + i));
					}
					return out;
				},
			};
			const generator = UniversalDistractorGenerator.createDefault();
			generator.register(fullStrategy);
			const assembler = new McqAssembler(generator);
			const context: DistractorContext = {
				answer: "5",
				answerValue: 5,
				template: buildTemplate({question_type: "FullType"}),
				variables: {},
				evaluator: new ExpressionEvaluator(),
			};
			const base = buildBaseQuestion({question_type: "FullType", answer: "5"});
			const q = assembler.assemble(base, context, new SeededRandomGenerator(1), 4);
			expect(q.choices).not.toContain("None of the above");
			expect(q.choices?.length).toBe(4);
		});
		it("keeps all choices unique after padding", () => {
			const shortStrategy: ResponseFormatStrategy = {
				questionType: "ShortType3",
				generateDistractors: (_ctx, count) => ["99"].slice(0, Math.min(count, 1)),
			};
			const generator = UniversalDistractorGenerator.createDefault();
			generator.register(shortStrategy);
			const assembler = new McqAssembler(generator);
			const context: DistractorContext = {
				answer: "42",
				answerValue: 42,
				template: buildTemplate({question_type: "ShortType3"}),
				variables: {},
				evaluator: new ExpressionEvaluator(),
			};
			const base = buildBaseQuestion({question_type: "ShortType3", answer: "42"});
			const q = assembler.assemble(base, context, new SeededRandomGenerator(1), 4);
			const unique = new Set(q.choices);
			expect(unique.size).toBe(q.choices?.length);
		});
	});
	describe("correct_choice_index tracking after seeded shuffle (task 5.8)", () => {
		it("correct_choice_index always points to the answer across 100 seeds", () => {
			const assembler = new McqAssembler();
			const context = buildContext({answer: "5"});
			const base = buildBaseQuestion({answer: "5"});
			for (let seed = 1; seed <= 100; seed++) {
				const q = assembler.assemble(base, context, new UniformRandomGenerator(), 4, seed);
				const idx = q.correct_choice_index ?? -1;
				expect(idx).toBeGreaterThanOrEqual(0);
				expect(q.choices?.[idx]).toBe("5");
			}
		});
		it("same seed produces the same correct_choice_index (determinism)", () => {
			const assembler = new McqAssembler();
			const context = buildContext({answer: "5"});
			const base = buildBaseQuestion({answer: "5"});
			const ref = assembler.assemble(base, context, new UniformRandomGenerator(), 4, 7777);
			for (let i = 0; i < 10; i++) {
				const q = assembler.assemble(base, context, new UniformRandomGenerator(), 4, 7777);
				expect(q.correct_choice_index).toBe(ref.correct_choice_index);
				expect(q.choices).toEqual(ref.choices);
			}
		});
		it("correct_choice_index is never -1 (answer always found in choices)", () => {
			const assembler = new McqAssembler();
			const context = buildContext({answer: "42"});
			const base = buildBaseQuestion({answer: "42"});
			for (let seed = 0; seed < 200; seed++) {
				const q = assembler.assemble(base, context, new UniformRandomGenerator(), 4, seed);
				expect(q.correct_choice_index).not.toBe(-1);
				expect(q.correct_choice_index).not.toBeUndefined();
			}
		});
		it("different seeds produce at least two distinct choice orderings", () => {
			const assembler = new McqAssembler();
			const context = buildContext({answer: "5"});
			const base = buildBaseQuestion({answer: "5"});
			const orderings = new Set<string>();
			for (let seed = 1; seed <= 50; seed++) {
				const q = assembler.assemble(base, context, new UniformRandomGenerator(), 4, seed);
				orderings.add(JSON.stringify(q.choices));
			}
			expect(orderings.size).toBeGreaterThan(1);
		});
		it("correct_choice_index tracks the answer after None-of-the-above padding", () => {
			const shortStrategy: ResponseFormatStrategy = {
				questionType: "PadTrack",
				generateDistractors: (_ctx, count) => ["99"].slice(0, Math.min(count, 1)),
			};
			const generator = UniversalDistractorGenerator.createDefault();
			generator.register(shortStrategy);
			const assembler = new McqAssembler(generator);
			const context: DistractorContext = {
				answer: "42",
				answerValue: 42,
				template: buildTemplate({question_type: "PadTrack"}),
				variables: {},
				evaluator: new ExpressionEvaluator(),
			};
			const base = buildBaseQuestion({question_type: "PadTrack", answer: "42"});
			for (let seed = 1; seed <= 30; seed++) {
				const q = assembler.assemble(base, context, new SeededRandomGenerator(seed), 4);
				const idx = q.correct_choice_index ?? -1;
				expect(idx).toBeGreaterThanOrEqual(0);
				expect(q.choices?.[idx]).toBe("42");
				expect(q.choices?.[idx]).not.toBe("None of the above");
			}
		});
	});
});
