import type {AnswerGraderLike, ExpressionNormalizerLike, GradeResult} from "../contracts";
import type {GeneratedQuestion} from "../types";
import {QUESTION_TYPES} from "../types";
import {ExpressionNormalizer} from "./ExpressionNormalizer";
import {ScientificNotation} from "../format/ScientificNotation";
/** Default absolute tolerance for numeric-tolerance grading (e.g. 9.8 vs 9.799 passes; 9.8 vs 9.82 fails). */
const DEFAULT_NUMERIC_TOLERANCE = 0.01;
/** Central answer grader: dispatches by response mode (mcq vs frq) and question type (TF boolean, NE/MC numeric-tolerance, SA expression-equivalence, FB exact/numeric). Shared between Single and Mental modes so no grading logic is duplicated. */
export class AnswerGrader implements AnswerGraderLike {
	private readonly normalizer: ExpressionNormalizerLike;
	private readonly numericTolerance: number;
	private readonly sciNotation: ScientificNotation;
	/** Construct the grader. `normalizer` defaults to a new {@link ExpressionNormalizer} (used for SA equivalence); `numericTolerance` defaults to 0.01 (absolute) for NE/MC numeric comparison. */
	public constructor(normalizer?: ExpressionNormalizerLike, numericTolerance?: number) {
		this.normalizer = normalizer ?? new ExpressionNormalizer();
		this.numericTolerance = numericTolerance ?? DEFAULT_NUMERIC_TOLERANCE;
		this.sciNotation = new ScientificNotation();
	}
	/** Grade `response` against `question`. For `response_mode='mcq'`, `selectedIndex` (the chosen choice index) is matched against `correct_choice_index`; for `response_mode='frq'`, grading dispatches by question type (TF boolean, NE/MC numeric-tolerance, SA expression-equivalence, FB exact-or-numeric). */
	public grade(question: GeneratedQuestion, response: string, selectedIndex?: number): GradeResult {
		if (question.response_mode === "mcq") {
			return this.gradeMcq(question, response, selectedIndex);
		}
		return this.gradeFrq(question, response);
	}
	/** MCQ grading: prefer the supplied `selectedIndex` against `correct_choice_index`; otherwise match the response text to a choice index; fall back to exact text comparison. For select-all-that-apply questions carrying `correct_choice_indices`, delegate to {@link gradeMultiSelect}. */
	private gradeMcq(question: GeneratedQuestion, response: string, selectedIndex?: number): GradeResult {
		if (question.correct_choice_indices !== undefined) {
			return this.gradeMultiSelect(question, response);
		}
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
	/** Multi-select (select-all-that-apply) grading: `response` is a comma-separated list of selected choice indices (e.g. "0,2"). Correct iff the selected set exactly equals the {@link GeneratedQuestion.correct_choice_indices} set. */
	private gradeMultiSelect(question: GeneratedQuestion, response: string): GradeResult {
		const correctIndices = question.correct_choice_indices ?? [];
		const selected = response
			.split(",")
			.map(part => parseInt(part.trim(), 10))
			.filter(n => Number.isInteger(n));
		const correctSet: Set<number> = new Set(correctIndices);
		const selectedSet: Set<number> = new Set(selected);
		const isCorrect = this.setsEqual(selectedSet, correctSet);
		const normalizedResponse = [...selectedSet].sort((a, b) => a - b).join(",");
		const normalizedAnswer = [...correctSet].sort((a, b) => a - b).join(",");
		return {is_correct: isCorrect, normalized_response: normalizedResponse, normalized_answer: normalizedAnswer};
	}
	/** Return true when both sets contain exactly the same elements. */
	private setsEqual(a: Set<number>, b: Set<number>): boolean {
		if (a.size !== b.size) {
			return false;
		}
		for (const value of a) {
			if (!b.has(value)) {
				return false;
			}
		}
		return true;
	}
	/** FRQ grading dispatch by question type: TF→boolean, NE/MC→numeric-tolerance, SA→expression-equivalence, else exact-or-numeric. */
	private gradeFrq(question: GeneratedQuestion, response: string): GradeResult {
		const type = question.question_type;
		if (type === QUESTION_TYPES.TF) {
			return this.gradeBoolean(response, question.answer);
		}
		if (type === QUESTION_TYPES.NE || type === QUESTION_TYPES.MC) {
			return this.gradeNumeric(response, question.answer);
		}
		if (type === QUESTION_TYPES.SA) {
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
	/** Numeric grading: correct when |response − answer| ≤ numericTolerance (with a relative epsilon to absorb floating-point rounding at the exact boundary, e.g. |96.01 − 96| = 0.010000000000005116 in IEEE-754); falls back to exact string match when either side is non-numeric. Both plain `e` notation (e.g. "6.674e-11") and LaTeX `\times 10^{n}` notation (e.g. "6.674 \times 10^{-11}") are parsed via {@link ScientificNotation} so the user's input is accepted regardless of the form stored on the question. */
	private gradeNumeric(response: string, answer: string): GradeResult {
		const responseNum = this.parseNumeric(response);
		const answerNum = this.parseNumeric(answer);
		if (Number.isFinite(responseNum) && Number.isFinite(answerNum)) {
			const diff = Math.abs(responseNum - answerNum);
			const magnitude = Math.max(1, Math.abs(responseNum), Math.abs(answerNum));
			const epsilon = magnitude * 1e-12;
			const isCorrect = diff <= this.numericTolerance + epsilon;
			return {is_correct: isCorrect, normalized_response: String(responseNum), normalized_answer: String(answerNum)};
		}
		const normalizedResponse = response.trim().toLowerCase();
		const normalizedAnswer = answer.trim().toLowerCase();
		return {is_correct: normalizedResponse === normalizedAnswer, normalized_response: normalizedResponse, normalized_answer: normalizedAnswer};
	}
	/** Parse a numeric string into a number, accepting plain decimals, `e` notation, and LaTeX `\times 10^{n}` notation. Returns `NaN` when the input is not recognized as a finite number. */
	private parseNumeric(input: string): number {
		const trimmed = input.trim();
		const direct = Number(trimmed);
		if (Number.isFinite(direct)) {
			return direct;
		}
		const parsed = this.sciNotation.parse(trimmed);
		if (parsed !== null) {
			return parsed.value;
		}
		return Number.NaN;
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
