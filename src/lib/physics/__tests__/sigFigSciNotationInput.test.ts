import {describe, it, expect} from "vitest";
import {AnswerGrader} from "../grader/AnswerGrader";
import {ExpressionNormalizer} from "../grader/ExpressionNormalizer";
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
describe("Task 5.61 — scientific-notation input parsing (AnswerGrader)", () => {
    const grader = new AnswerGrader();
    it("grades a plain e-notation response against a plain e-notation answer", () => {
        const q = buildQuestion({question_type: "NE", answer: "6.674e-11"});
        expect(grader.grade(q, "6.674e-11").is_correct).toBe(true);
    });
    it("grades a plain e-notation response against a LaTeX sci-notation answer", () => {
        const q = buildQuestion({question_type: "NE", answer: "6.674 \\times 10^{-11}"});
        expect(grader.grade(q, "6.674e-11").is_correct).toBe(true);
    });
    it("grades a LaTeX sci-notation response against a plain e-notation answer", () => {
        const q = buildQuestion({question_type: "NE", answer: "6.674e-11"});
        expect(grader.grade(q, "6.674 \\times 10^{-11}").is_correct).toBe(true);
    });
    it("grades a LaTeX sci-notation response against a LaTeX sci-notation answer", () => {
        const q = buildQuestion({question_type: "NE", answer: "6.674 \\times 10^{-11}"});
        expect(grader.grade(q, "6.674 \\times 10^{-11}").is_correct).toBe(true);
    });
    it("grades a star-10 response against a LaTeX sci-notation answer", () => {
        const q = buildQuestion({question_type: "NE", answer: "6.674 \\times 10^{-11}"});
        expect(grader.grade(q, "6.674 * 10^-11").is_correct).toBe(true);
    });
    it("grades a large-exponent positive sci-notation correctly", () => {
        const q = buildQuestion({question_type: "NE", answer: "2.998 \\times 10^{8}"});
        expect(grader.grade(q, "2.998e8").is_correct).toBe(true);
    });
    it("grades a braced LaTeX sci-notation answer (with leading/trailing braces)", () => {
        const q = buildQuestion({question_type: "NE", answer: "{6.674 \\times 10^{-11}}"});
        expect(grader.grade(q, "6.674e-11").is_correct).toBe(true);
    });
    it("still rejects a numerically-different sci-notation response", () => {
        const q = buildQuestion({question_type: "NE", answer: "2.998 \\times 10^{8}"});
        expect(grader.grade(q, "5.0e8").is_correct).toBe(false);
    });
    it("still grades plain numeric answers correctly (regression)", () => {
        const q = buildQuestion({question_type: "NE", answer: "5"});
        expect(grader.grade(q, "5").is_correct).toBe(true);
        expect(grader.grade(q, "5.001").is_correct).toBe(true);
        expect(grader.grade(q, "5.02").is_correct).toBe(false);
    });
    it("grades MC FRQ with LaTeX sci-notation answer", () => {
        const q = buildQuestion({question_type: "MC", answer: "1.5 \\times 10^{3}"});
        expect(grader.grade(q, "1500").is_correct).toBe(true);
    });
    it("grades FB with LaTeX sci-notation answer", () => {
        const q = buildQuestion({question_type: "FB", answer: "3.0 \\times 10^{8}"});
        expect(grader.grade(q, "3e8").is_correct).toBe(true);
    });
});
describe("Task 5.61 — scientific-notation normalization (ExpressionNormalizer)", () => {
    const normalizer = new ExpressionNormalizer();
    it("does not mangle plain e-notation (6.022e23 stays as 6.022e23)", () => {
        expect(normalizer.normalize("6.022e23")).toBe("6.022e23");
    });
    it("does not mangle negative-exponent e-notation (6.674e-11)", () => {
        expect(normalizer.normalize("6.674e-11")).toBe("6.674e-11");
    });
    it("treats plain e-notation and LaTeX \\times 10^{n} as equivalent", () => {
        expect(normalizer.isEquivalent("6.022e23", "6.022 \\times 10^{23}")).toBe(true);
    });
    it("treats negative-exponent plain and LaTeX forms as equivalent", () => {
        expect(normalizer.isEquivalent("6.674e-11", "6.674 \\times 10^{-11}")).toBe(true);
    });
    it("treats star-10 and e-notation as equivalent", () => {
        expect(normalizer.isEquivalent("1.5 * 10^3", "1.5e3")).toBe(true);
    });
    it("still treats 2x and 2*x as equivalent (regression)", () => {
        expect(normalizer.isEquivalent("2x", "2*x")).toBe(true);
    });
    it("still treats a+b and b+a as equivalent (regression)", () => {
        expect(normalizer.isEquivalent("a+b", "b+a")).toBe(true);
    });
    it("still treats LaTeX \\times multiplication as explicit * (regression)", () => {
        expect(normalizer.isEquivalent("a\\times b", "a*b")).toBe(true);
    });
    it("still treats fractions and decimals as equivalent (regression)", () => {
        expect(normalizer.isEquivalent("1/2", "0.5")).toBe(true);
    });
    it("still strips trailing zeros (regression)", () => {
        expect(normalizer.normalize("1.0")).toBe("1");
        expect(normalizer.normalize("2.50")).toBe("2.5");
    });
});
describe("Task 5.61 — SA expression grading with scientific notation", () => {
    const grader = new AnswerGrader();
    it("grades SA where answer is LaTeX sci-notation and response is e-notation", () => {
        const q = buildQuestion({question_type: "SA", answer: "6.022 \\times 10^{23}"});
        expect(grader.grade(q, "6.022e23").is_correct).toBe(true);
    });
    it("grades SA where both answer and response are LaTeX sci-notation", () => {
        const q = buildQuestion({question_type: "SA", answer: "6.674 \\times 10^{-11}"});
        expect(grader.grade(q, "6.674 \\times 10^{-11}").is_correct).toBe(true);
    });
    it("rejects SA with a different sci-notation value", () => {
        const q = buildQuestion({question_type: "SA", answer: "6.022 \\times 10^{23}"});
        expect(grader.grade(q, "3.0e23").is_correct).toBe(false);
    });
});
