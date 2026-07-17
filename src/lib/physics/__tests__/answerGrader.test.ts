import {describe, it, expect} from "vitest";
import {AnswerGrader} from "../grader/AnswerGrader";
import type {GeneratedQuestion} from "../types";
function buildQuestion(overrides: Partial<GeneratedQuestion>): GeneratedQuestion {
    const base: GeneratedQuestion = {
        id: "q1",
        topic_id: "T1",
        skill_id: "S1",
        question_type: "NE",
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
describe("AnswerGrader", () => {
    const grader = new AnswerGrader();
    describe("MCQ mode (response_mode = 'mcq')", () => {
        const mcqQuestion = buildQuestion({
            question_type: "MC",
            answer: "5",
            response_mode: "mcq",
            choices: ["4", "5", "6", "7"],
            correct_choice_index: 1,
        });
        it("marks the response correct when selectedIndex matches correct_choice_index", () => {
            const result = grader.grade(mcqQuestion, "5", 1);
            expect(result.is_correct).toBe(true);
        });
        it("marks the response incorrect when selectedIndex differs from correct_choice_index", () => {
            const result = grader.grade(mcqQuestion, "4", 0);
            expect(result.is_correct).toBe(false);
        });
        it("matches by choice text when selectedIndex is omitted (correct text)", () => {
            const result = grader.grade(mcqQuestion, "5");
            expect(result.is_correct).toBe(true);
        });
        it("matches by choice text when selectedIndex is omitted (wrong text)", () => {
            const result = grader.grade(mcqQuestion, "6");
            expect(result.is_correct).toBe(false);
        });
        it("falls back to exact answer comparison when the text is not a choice", () => {
            const result = grader.grade(mcqQuestion, "5");
            expect(result.is_correct).toBe(true);
        });
    });
    describe("FRQ TF (boolean)", () => {
        const tfQuestion = buildQuestion({question_type: "TF", answer: "True"});
        it("accepts an exact True response", () => {
            expect(grader.grade(tfQuestion, "True").is_correct).toBe(true);
        });
        it("accepts case-insensitive and abbreviated boolean forms", () => {
            expect(grader.grade(tfQuestion, "true").is_correct).toBe(true);
            expect(grader.grade(tfQuestion, "t").is_correct).toBe(true);
            expect(grader.grade(tfQuestion, "1").is_correct).toBe(true);
        });
        it("rejects the opposite boolean", () => {
            expect(grader.grade(tfQuestion, "False").is_correct).toBe(false);
            expect(grader.grade(tfQuestion, "f").is_correct).toBe(false);
            expect(grader.grade(tfQuestion, "0").is_correct).toBe(false);
        });
    });
    describe("FRQ NE (numeric tolerance)", () => {
        const neQuestion = buildQuestion({question_type: "NE", answer: "5"});
        it("accepts an exact numeric response", () => {
            expect(grader.grade(neQuestion, "5").is_correct).toBe(true);
        });
        it("accepts a response within the default tolerance (0.01)", () => {
            expect(grader.grade(neQuestion, "5.001").is_correct).toBe(true);
            expect(grader.grade(neQuestion, "4.999").is_correct).toBe(true);
        });
        it("rejects a response outside the tolerance", () => {
            expect(grader.grade(neQuestion, "5.02").is_correct).toBe(false);
            expect(grader.grade(neQuestion, "6").is_correct).toBe(false);
        });
    });
    describe("FRQ MC (numeric tolerance fallback)", () => {
        const mcFrqQuestion = buildQuestion({question_type: "MC", answer: "10"});
        it("accepts an exact numeric response", () => {
            expect(grader.grade(mcFrqQuestion, "10").is_correct).toBe(true);
        });
        it("accepts a response within tolerance", () => {
            expect(grader.grade(mcFrqQuestion, "10.005").is_correct).toBe(true);
        });
        it("rejects a wrong numeric response", () => {
            expect(grader.grade(mcFrqQuestion, "11").is_correct).toBe(false);
        });
    });
    describe("FRQ SA (expression equivalence with numeric fallback)", () => {
        const saQuestion = buildQuestion({question_type: "SA", answer: "2*x"});
        it("accepts an expression-equivalent response", () => {
            expect(grader.grade(saQuestion, "2x").is_correct).toBe(true);
            expect(grader.grade(saQuestion, "x*2").is_correct).toBe(true);
        });
        it("accepts an exact numeric match via the numeric fallback", () => {
            const numericSa = buildQuestion({question_type: "SA", answer: "3"});
            expect(grader.grade(numericSa, "3").is_correct).toBe(true);
            expect(grader.grade(numericSa, "3.001").is_correct).toBe(true);
        });
        it("rejects a non-equivalent expression", () => {
            expect(grader.grade(saQuestion, "2+x").is_correct).toBe(false);
        });
    });
    describe("FRQ FB (exact or numeric)", () => {
        const fbQuestion = buildQuestion({question_type: "FB", answer: "8"});
        it("accepts an exact response", () => {
            expect(grader.grade(fbQuestion, "8").is_correct).toBe(true);
        });
        it("accepts a numerically-equal response via the numeric fallback", () => {
            expect(grader.grade(fbQuestion, "8.0").is_correct).toBe(true);
            expect(grader.grade(fbQuestion, "8.001").is_correct).toBe(true);
        });
        it("rejects a wrong response", () => {
            expect(grader.grade(fbQuestion, "9").is_correct).toBe(false);
        });
    });
    describe("custom tolerance", () => {
        it("honors an injected numeric tolerance", () => {
            const looseGrader = new AnswerGrader(undefined, 1);
            const q = buildQuestion({question_type: "NE", answer: "5"});
            expect(looseGrader.grade(q, "5.5").is_correct).toBe(true);
            expect(looseGrader.grade(q, "6.5").is_correct).toBe(false);
        });
    });
    describe("FRQ NE numeric-tolerance floating-point boundary", () => {
        it("accepts a response at the exact tolerance boundary where IEEE-754 rounding pushes |diff| slightly above tol (96.01 vs 96 with tol 0.01)", () => {
            const q = buildQuestion({question_type: "NE", answer: "96"});
            expect(Math.abs(96.01 - 96)).toBeGreaterThan(0.01);
            expect(grader.grade(q, "96.01").is_correct).toBe(true);
        });
        it("accepts a response at the exact tolerance boundary on the low side (95.99 vs 96 with tol 0.01)", () => {
            const q = buildQuestion({question_type: "NE", answer: "96"});
            expect(grader.grade(q, "95.99").is_correct).toBe(true);
        });
        it("still rejects a response clearly outside the tolerance (96.02 vs 96 with tol 0.01)", () => {
            const q = buildQuestion({question_type: "NE", answer: "96"});
            expect(grader.grade(q, "96.02").is_correct).toBe(false);
        });
        it("accepts the boundary for a larger-magnitude answer (100.01 vs 100 with tol 0.01)", () => {
            const q = buildQuestion({question_type: "NE", answer: "100"});
            expect(Math.abs(100.01 - 100)).toBeGreaterThan(0.01);
            expect(grader.grade(q, "100.01").is_correct).toBe(true);
        });
        it("accepts the boundary with a custom tolerance of 1 (97 vs 96)", () => {
            const looseGrader = new AnswerGrader(undefined, 1);
            const q = buildQuestion({question_type: "NE", answer: "96"});
            expect(looseGrader.grade(q, "97").is_correct).toBe(true);
        });
    });
    describe("GradeResult shape", () => {
        it("returns normalized_response and normalized_answer strings", () => {
            const q = buildQuestion({question_type: "NE", answer: "5"});
            const result = grader.grade(q, "5");
            expect(typeof result.normalized_response).toBe("string");
            expect(typeof result.normalized_answer).toBe("string");
            expect(result.normalized_response.length).toBeGreaterThan(0);
        });
    });
    describe("MCQ edge cases", () => {
        it("falls back to exact comparison when an MCQ question has no choices", () => {
            const q = buildQuestion({
                question_type: "MC",
                answer: "42",
                response_mode: "mcq",
                correct_choice_index: 0,
            });
            const result = grader.grade(q, "42");
            expect(result.is_correct).toBe(true);
        });
        it("falls back to exact comparison when the response text matches no choice", () => {
            const q = buildQuestion({
                question_type: "MC",
                answer: "42",
                response_mode: "mcq",
                choices: ["10", "20", "30"],
                correct_choice_index: 0,
            });
            const result = grader.grade(q, "42");
            expect(result.is_correct).toBe(true);
        });
    });
    describe("multi-select setsEqual same-size different elements", () => {
        it("marks incorrect when the selected set and correct set have the same size but different elements", () => {
            const q = buildQuestion({
                question_type: "MC",
                answer: "0,2",
                response_mode: "mcq",
                choices: ["a", "b", "c", "d"],
                correct_choice_indices: [0, 2],
            });
            const result = grader.grade(q, "0,1");
            expect(result.is_correct).toBe(false);
        });
    });
    describe("TF non-boolean response", () => {
        it("normalizes a non-boolean TF response to its lowercased form", () => {
            const q = buildQuestion({question_type: "TF", answer: "True"});
            const result = grader.grade(q, "maybe");
            expect(result.is_correct).toBe(false);
            expect(result.normalized_response).toBe("maybe");
        });
    });
});
