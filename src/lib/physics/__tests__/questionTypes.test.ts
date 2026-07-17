import {describe, it, expect} from "vitest";
import {SpecificationParser} from "../SpecificationParser";
import {AnswerGrader} from "../grader/AnswerGrader";
import {QUESTION_TYPES, QUESTION_TYPE_ALIASES, normalizeQuestionType} from "../types";
import type {GeneratedQuestion} from "../types";
function buildQuestion(overrides: Partial<GeneratedQuestion>): GeneratedQuestion {
    const base: GeneratedQuestion = {
        id: "q1",
        topic_id: "T1",
        skill_id: "S1",
        question_type: QUESTION_TYPES.MC,
        difficulty: 1,
        text: "text",
        answer: "5",
        response_mode: "frq",
        solution_text: "",
        solution_latex: "",
        variables: {},
    };
    return {...base, ...overrides};
}
const FULL_NAME_SPECS = {
    MultipleChoice: "MC",
    ShortAnswer: "SA",
    TrueFalse: "TF",
    FillInBlank: "FB",
    NumericEntry: "NE",
};
describe("QUESTION_TYPES constant (task 5.6)", () => {
    it("exposes canonical short codes for all five built-in types", () => {
        expect(QUESTION_TYPES.MC).toBe("MC");
        expect(QUESTION_TYPES.SA).toBe("SA");
        expect(QUESTION_TYPES.TF).toBe("TF");
        expect(QUESTION_TYPES.FB).toBe("FB");
        expect(QUESTION_TYPES.NE).toBe("NE");
    });
    it("QUESTION_TYPE_ALIASES maps every full spec name to its canonical code (regression 5.6)", () => {
        for (const [full, short] of Object.entries(FULL_NAME_SPECS)) {
            expect(QUESTION_TYPE_ALIASES[full]).toBe(short);
        }
    });
    it("QUESTION_TYPE_ALIASES maps every short code to itself (regression 5.6)", () => {
        for (const short of Object.values(FULL_NAME_SPECS)) {
            expect(QUESTION_TYPE_ALIASES[short]).toBe(short);
        }
    });
    it("normalizeQuestionType canonicalizes full names and passes unknowns through (regression 5.6)", () => {
        expect(normalizeQuestionType("MultipleChoice")).toBe(QUESTION_TYPES.MC);
        expect(normalizeQuestionType("ShortAnswer")).toBe(QUESTION_TYPES.SA);
        expect(normalizeQuestionType("TrueFalse")).toBe(QUESTION_TYPES.TF);
        expect(normalizeQuestionType("FillInBlank")).toBe(QUESTION_TYPES.FB);
        expect(normalizeQuestionType("NumericEntry")).toBe(QUESTION_TYPES.NE);
        expect(normalizeQuestionType("MC")).toBe(QUESTION_TYPES.MC);
        expect(normalizeQuestionType("CustomType")).toBe("CustomType");
    });
});
const BASE_SPEC = (questionTypeLine: string): string =>
    [
        "[UNIT]",
        "Id: U1",
        "Name: Mechanics",
        "[TOPIC]",
        "Id: T1",
        "Name: Kinematics",
        "UnitId: U1",
        "[SKILL]",
        "Id: S1",
        "Name: Skill",
        "TopicId: T1",
        "[TEMPLATE]",
        "Id: Q1",
        "TopicId: T1",
        "SkillId: S1",
        questionTypeLine,
        "Difficulty: 2",
        "TextTemplate: A car accelerates.",
        "AnswerExpression: (v - v0) / t",
        "SolutionTemplate: Use a = (v - v0) / t.",
        "Var.v0: Type=double;Min=0;Max=20;Step=1",
        "Var.v: Type=double;Min=20;Max=40;Step=1",
        "Var.t: Type=double;Min=1;Max=10;Step=0.5",
    ].join("\n");
describe("Parser uses canonical QUESTION_TYPES (regression 5.6)", () => {
    it("parses 'QuestionType: MultipleChoice' to canonical MC code", () => {
        const parser = new SpecificationParser();
        const spec = parser.parse(BASE_SPEC("QuestionType: MultipleChoice"));
        expect(spec.templates[0]?.question_type).toBe(QUESTION_TYPES.MC);
    });
    it("parses 'QuestionType: MC' to canonical MC code (no drift between full and short forms)", () => {
        const parser = new SpecificationParser();
        const spec = parser.parse(BASE_SPEC("QuestionType: MC"));
        expect(spec.templates[0]?.question_type).toBe(QUESTION_TYPES.MC);
    });
    it("parses every full spec name to its canonical short code", () => {
        for (const [full, short] of Object.entries(FULL_NAME_SPECS)) {
            const parser = new SpecificationParser();
            const spec = parser.parse(BASE_SPEC(`QuestionType: ${full}`));
            expect(spec.templates[0]?.question_type).toBe(short);
        }
    });
});
describe("Grader reaches the MC numeric branch (regression 5.6 - Bug 2)", () => {
    const grader = new AnswerGrader();
    it("grades an MC question via numeric tolerance (within tolerance is correct)", () => {
        const q = buildQuestion({question_type: QUESTION_TYPES.MC, answer: "5", response_mode: "frq"});
        const result = grader.grade(q, "5.005");
        expect(result.is_correct).toBe(true);
        expect(result.normalized_response).toBe("5.005");
        expect(result.normalized_answer).toBe("5");
    });
    it("grades an MC question via numeric tolerance (outside tolerance is incorrect)", () => {
        const q = buildQuestion({question_type: QUESTION_TYPES.MC, answer: "5", response_mode: "frq"});
        const result = grader.grade(q, "6");
        expect(result.is_correct).toBe(false);
    });
    it("grades a TF question via the boolean branch (not numeric)", () => {
        const q = buildQuestion({question_type: QUESTION_TYPES.TF, answer: "True", response_mode: "frq"});
        const result = grader.grade(q, "1");
        expect(result.is_correct).toBe(true);
        expect(result.normalized_response).toBe("true");
        expect(result.normalized_answer).toBe("true");
    });
});
