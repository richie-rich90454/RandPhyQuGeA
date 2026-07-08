import type {AnswerGraderLike, ExpressionNormalizerLike, GradeResult} from "../contracts";
import type {GeneratedQuestion} from "../types";
import {ExpressionNormalizer} from "./ExpressionNormalizer";
/** Default absolute tolerance for numeric-tolerance grading (e.g. 9.8 vs 9.799 passes; 9.8 vs 9.82 fails). */
const DEFAULT_NUMERIC_TOLERANCE = 0.01;
/** Central answer grader: dispatches by response mode (mcq vs frq) and question type (TF boolean, NE/MC numeric-tolerance, SA expression-equivalence, FB exact/numeric). Shared between Single and Mental modes so no grading logic is duplicated. */
export class AnswerGrader implements AnswerGraderLike {
    private readonly normalizer: ExpressionNormalizerLike;
    private readonly numericTolerance: number;
    /** Construct the grader. `normalizer` defaults to a new {@link ExpressionNormalizer} (used for SA equivalence); `numericTolerance` defaults to 0.01 (absolute) for NE/MC numeric comparison. */
    public constructor(normalizer?: ExpressionNormalizerLike, numericTolerance?: number) {
        this.normalizer = normalizer ?? new ExpressionNormalizer();
        this.numericTolerance = numericTolerance ?? DEFAULT_NUMERIC_TOLERANCE;
    }
    /** Grade `response` against `question`. For `response_mode='mcq'`, `selectedIndex` (the chosen choice index) is matched against `correct_choice_index`; for `response_mode='frq'`, grading dispatches by question type (TF boolean, NE/MC numeric-tolerance, SA expression-equivalence, FB exact-or-numeric). */
    public grade(question: GeneratedQuestion, response: string, selectedIndex?: number): GradeResult {
        if (question.response_mode === "mcq") {
            return this.gradeMcq(question, response, selectedIndex);
        }
        return this.gradeFrq(question, response);
    }
    /** MCQ grading: prefer the supplied `selectedIndex` against `correct_choice_index`; otherwise match the response text to a choice index; fall back to exact text comparison. */
    private gradeMcq(question: GeneratedQuestion, response: string, selectedIndex?: number): GradeResult {
        const normalizedResponse = response.trim().toLowerCase();
        const normalizedAnswer = question.answer.trim().toLowerCase();
        if (selectedIndex !== undefined && question.correct_choice_index !== undefined) {
            const isCorrect = selectedIndex === question.correct_choice_index;
            return {is_correct: isCorrect, normalized_response: String(selectedIndex), normalized_answer: String(question.correct_choice_index)};
        }
        if (question.choices !== undefined) {
            const matchIdx = question.choices.findIndex(c => c.trim().toLowerCase() === normalizedResponse);
            if (matchIdx >= 0 && question.correct_choice_index !== undefined) {
                const isCorrect = matchIdx === question.correct_choice_index;
                return {is_correct: isCorrect, normalized_response: String(matchIdx), normalized_answer: String(question.correct_choice_index)};
            }
        }
        const isExact = normalizedResponse === normalizedAnswer;
        return {is_correct: isExact, normalized_response: normalizedResponse, normalized_answer: normalizedAnswer};
    }
    /** FRQ grading dispatch by question type: TF→boolean, NE/MC→numeric-tolerance, SA→expression-equivalence, else exact-or-numeric. */
    private gradeFrq(question: GeneratedQuestion, response: string): GradeResult {
        const type = question.question_type;
        if (type === "TF") {
            return this.gradeBoolean(response, question.answer);
        }
        if (type === "NE" || type === "MC") {
            return this.gradeNumeric(response, question.answer);
        }
        if (type === "SA") {
            return this.gradeExpression(response, question.answer);
        }
        return this.gradeExactOrNumeric(response, question.answer);
    }
    /** Boolean grading: normalizes true/false/t/1/f/0 (case-insensitive) and compares. */
    private gradeBoolean(response: string, answer: string): GradeResult {
        const normalizedResponse = this.normalizeBoolean(response);
        const normalizedAnswer = this.normalizeBoolean(answer);
        return {is_correct: normalizedResponse === normalizedAnswer, normalized_response: normalizedResponse, normalized_answer: normalizedAnswer};
    }
    /** Normalize a boolean-ish string to "true"/"false" (preserving unknown values lowercased for diagnostics). */
    private normalizeBoolean(value: string): string {
        const lower = value.trim().toLowerCase();
        if (lower === "true" || lower === "t" || lower === "1") {
            return "true";
        }
        if (lower === "false" || lower === "f" || lower === "0") {
            return "false";
        }
        return lower;
    }
    /** Numeric grading: correct when |response − answer| ≤ numericTolerance; falls back to exact string match when either side is non-numeric. */
    private gradeNumeric(response: string, answer: string): GradeResult {
        const responseNum = Number(response.trim());
        const answerNum = Number(answer.trim());
        if (Number.isFinite(responseNum) && Number.isFinite(answerNum)) {
            const isCorrect = Math.abs(responseNum - answerNum) <= this.numericTolerance;
            return {is_correct: isCorrect, normalized_response: String(responseNum), normalized_answer: String(answerNum)};
        }
        const normalizedResponse = response.trim().toLowerCase();
        const normalizedAnswer = answer.trim().toLowerCase();
        return {is_correct: normalizedResponse === normalizedAnswer, normalized_response: normalizedResponse, normalized_answer: normalizedAnswer};
    }
    /** Expression grading: correct when the normalizer equates response and answer; otherwise falls back to numeric-tolerance comparison. */
    private gradeExpression(response: string, answer: string): GradeResult {
        const normalizedResponse = this.normalizer.normalize(response);
        const normalizedAnswer = this.normalizer.normalize(answer);
        if (normalizedResponse === normalizedAnswer) {
            return {is_correct: true, normalized_response: normalizedResponse, normalized_answer: normalizedAnswer};
        }
        return this.gradeNumeric(response, answer);
    }
    /** Default FRQ grading for unrecognized types: exact (case-insensitive, trimmed) match, then numeric-tolerance fallback. */
    private gradeExactOrNumeric(response: string, answer: string): GradeResult {
        const normalizedResponse = response.trim().toLowerCase();
        const normalizedAnswer = answer.trim().toLowerCase();
        if (normalizedResponse === normalizedAnswer) {
            return {is_correct: true, normalized_response: normalizedResponse, normalized_answer: normalizedAnswer};
        }
        return this.gradeNumeric(response, answer);
    }
}
