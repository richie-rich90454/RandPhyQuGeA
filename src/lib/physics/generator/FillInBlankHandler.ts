import type {ExpressionEvaluatorLike} from '../contracts';
import {BaseQuestionHandler} from './BaseQuestionHandler';
/** Fill-in-the-blank handler: no choices; the answer is a formatted numeric value. */
export class FillInBlankHandler extends BaseQuestionHandler {
	public readonly type = 'FB';
	protected formatAnswer(value: number, evaluator: ExpressionEvaluatorLike): string {
		return evaluator.formatNumeric(value);
	}
	protected generateChoices(): string[] {
		return [];
	}
}
