import type {ExpressionEvaluatorLike} from "../contracts";
import {BaseQuestionHandler} from "./BaseQuestionHandler";
/** Short-answer handler: the answer is a formatted numeric value (free-response). */
export class ShortAnswerHandler extends BaseQuestionHandler {
    public readonly type = "SA";
    protected formatAnswer(value: number, evaluator: ExpressionEvaluatorLike): string {
        return evaluator.formatNumeric(value);
    }
}
