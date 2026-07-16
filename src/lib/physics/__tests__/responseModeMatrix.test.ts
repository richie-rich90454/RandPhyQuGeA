import {describe, it, expect} from "vitest";
import {SpecificationParser} from "../SpecificationParser";
import {QuestionGenerator} from "../generator/QuestionGenerator";
import {ExpressionEvaluator} from "../ExpressionEvaluator";
import {SeededRandomGenerator} from "../random";
import {AnswerGrader} from "../grader/AnswerGrader";
import type {GeneratedQuestion, ResponseMode} from "../types";
const MATRIX_SPEC = [
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
	"[TEMPLATE]",
	"Id: QSA",
	"TopicId: T1",
	"SkillId: S1",
	"QuestionType: ShortAnswer",
	"Difficulty: 1",
	"TextTemplate: Compute {x} * {y}.",
	"AnswerExpression: x * y",
	"Var.x: Type=int;Min=3;Max=3",
	"Var.y: Type=int;Min=4;Max=4",
	"[TEMPLATE]",
	"Id: QTF",
	"TopicId: T1",
	"SkillId: S1",
	"QuestionType: TrueFalse",
	"Difficulty: 1",
	"TextTemplate: The value is positive. a={a}",
	"AnswerExpression: a",
	"Var.a: Type=int;Min=5;Max=5",
	"[TEMPLATE]",
	"Id: QFB",
	"TopicId: T1",
	"SkillId: S1",
	"QuestionType: FillInBlank",
	"Difficulty: 1",
	"TextTemplate: The value {x} doubled is ___.",
	"AnswerExpression: x * 2",
	"Var.x: Type=int;Min=3;Max=3",
	"[TEMPLATE]",
	"Id: QNE",
	"TopicId: T1",
	"SkillId: S1",
	"QuestionType: NumericEntry",
	"Difficulty: 1",
	"TextTemplate: Compute {x} - {y}.",
	"AnswerExpression: x - y",
	"Var.x: Type=int;Min=10;Max=10",
	"Var.y: Type=int;Min=3;Max=3",
].join("\n");
interface MatrixCase {
	templateId: string;
	type: string;
	answer: string;
}
const CASES: MatrixCase[] = [
	{templateId: "QMC", type: "MC", answer: "7"},
	{templateId: "QSA", type: "SA", answer: "12"},
	{templateId: "QTF", type: "TF", answer: "True"},
	{templateId: "QFB", type: "FB", answer: "6"},
	{templateId: "QNE", type: "NE", answer: "7"},
];
function buildGenerator(seed: number): QuestionGenerator {
	const spec = new SpecificationParser().parse(MATRIX_SPEC);
	return new QuestionGenerator(spec.templates, new ExpressionEvaluator(), new SeededRandomGenerator(seed));
}
describe("ResponseMode matrix: every question type x every response mode", () => {
	const grader = new AnswerGrader();
	for (const c of CASES) {
		describe(`${c.type} (template ${c.templateId}, answer "${c.answer}")`, () => {
			it("FRQ generation: no choices, response_mode='frq', answer matches", () => {
				const gen = buildGenerator(1);
				const q = gen.generate({templateIds: [c.templateId], responseMode: "frq"});
				expect(q).not.toBeNull();
				expect(q?.response_mode).toBe("frq");
				expect(q?.choices).toBeUndefined();
				expect(q?.correct_choice_index).toBeUndefined();
				expect(q?.answer).toBe(c.answer);
			});
			it("MCQ generation: choices present, response_mode='mcq', correct_choice_index points to answer", () => {
				const gen = buildGenerator(1);
				const q = gen.generate({templateIds: [c.templateId], responseMode: "mcq"});
				expect(q).not.toBeNull();
				expect(q?.response_mode).toBe("mcq");
				expect(q?.choices).toBeDefined();
				expect(q?.choices?.length).toBeGreaterThanOrEqual(2);
				expect(q?.correct_choice_index).toBeDefined();
				const correctIndex = q?.correct_choice_index ?? -1;
				expect(q?.choices?.[correctIndex]).toBe(c.answer);
				const unique = new Set(q?.choices);
				expect(unique.size).toBe(q?.choices?.length);
			});
			it("FRQ grading: correct answer accepted, wrong answer rejected", () => {
				const gen = buildGenerator(1);
				const q = gen.generate({templateIds: [c.templateId], responseMode: "frq"}) as GeneratedQuestion;
				expect(grader.grade(q, c.answer).is_correct).toBe(true);
				expect(grader.grade(q, wrongResponseFor(c)).is_correct).toBe(false);
			});
			it("MCQ grading: correct choice index accepted, wrong index rejected", () => {
				const gen = buildGenerator(1);
				const q = gen.generate({templateIds: [c.templateId], responseMode: "mcq"}) as GeneratedQuestion;
				const correctIndex = q.correct_choice_index ?? -1;
				const wrongIndex = (correctIndex + 1) % (q.choices?.length ?? 1);
				expect(grader.grade(q, c.answer, correctIndex).is_correct).toBe(true);
				expect(grader.grade(q, q.choices?.[wrongIndex] ?? "", wrongIndex).is_correct).toBe(false);
			});
			it("default (undefined) responseMode behaves as FRQ", () => {
				const gen = buildGenerator(1);
				const q = gen.generate({templateIds: [c.templateId]});
				expect(q?.response_mode).toBe("frq");
				expect(q?.choices).toBeUndefined();
			});
		});
	}
	it("covers all 5 question types across both modes (10 generation combinations)", () => {
		const gen = buildGenerator(1);
		const generated: string[] = [];
		for (const c of CASES) {
			for (const mode of ["frq", "mcq"] as ResponseMode[]) {
				const q = gen.generate({templateIds: [c.templateId], responseMode: mode});
				expect(q).not.toBeNull();
				expect(q?.question_type).toBe(c.type);
				generated.push(`${c.type}:${mode}`);
			}
		}
		expect(generated.length).toBe(10);
		expect(new Set(generated).size).toBe(10);
	});
});
function wrongResponseFor(c: MatrixCase): string {
	if (c.type === "TF") {
		return c.answer === "True" ? "False" : "True";
	}
	const num = Number(c.answer);
	return String(num + 100);
}
