import type {ExpressionEvaluatorLike} from "../contracts";
import {QUESTION_TYPES} from "../types";
import {BaseQuestionHandler} from "./BaseQuestionHandler";
/** True/false handler: a non-zero answer means True. Choice assembly (True/False) is handled by the McqAssembler via the BooleanDistractorStrategy. */
export class TrueFalseHandler extends BaseQuestionHandler {
	public readonly type = QUESTION_TYPES.TF;
	/** Format the canonical answer as "True" when `value` is non-zero, "False" when zero. */
	protected formatAnswer(value: number, _evaluator: ExpressionEvaluatorLike): string {
		return value !== 0 ? "True" : "False";
	}
}
