import type {ExpressionEvaluatorLike} from "../contracts";
import {QUESTION_TYPES} from "../types";
import {BaseQuestionHandler} from "./BaseQuestionHandler";
/** Short-answer handler: the answer is a formatted numeric value (free-response). */
export class ShortAnswerHandler extends BaseQuestionHandler {
    public readonly type = QUESTION_TYPES.SA;
    /** Format the canonical answer as a trailing-zero-stripped numeric string. */
    protected formatAnswer(value: number, evaluator: ExpressionEvaluatorLike): string {
        return evaluator.formatNumeric(value);
    }
}
