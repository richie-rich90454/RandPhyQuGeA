import type {ExpressionEvaluatorLike} from "../contracts";
import {BaseQuestionHandler} from "./BaseQuestionHandler";
/** Multiple-choice handler: formats the canonical numeric answer. Choice assembly is handled by the McqAssembler (not the handler), using the template's distractor_expressions as hints for the NumericDistractorStrategy. */
export class MultipleChoiceHandler extends BaseQuestionHandler {
    public readonly type = "MC";
    /** Format the canonical answer as a trailing-zero-stripped numeric string. */
    protected formatAnswer(value: number, evaluator: ExpressionEvaluatorLike): string {
        return evaluator.formatNumeric(value);
    }
}
