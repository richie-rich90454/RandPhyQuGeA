import type {ExpressionEvaluatorLike} from "../contracts";
import {BaseQuestionHandler} from "./BaseQuestionHandler";
/** Numeric-entry handler: the answer is a formatted numeric value (free-response). */
export class NumericEntryHandler extends BaseQuestionHandler {
    public readonly type = "NE";
    protected formatAnswer(value: number, evaluator: ExpressionEvaluatorLike): string {
        return evaluator.formatNumeric(value);
    }
}
