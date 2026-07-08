import type {ExpressionEvaluatorLike} from "../contracts";
import {BaseQuestionHandler} from "./BaseQuestionHandler";
/** True/false handler: a non-zero answer means True. Choice assembly (True/False) is handled by the McqAssembler via the BooleanDistractorStrategy. */
export class TrueFalseHandler extends BaseQuestionHandler {
    public readonly type = "TF";
    protected formatAnswer(value: number, _evaluator: ExpressionEvaluatorLike): string {
        return value !== 0 ? "True" : "False";
    }
}
