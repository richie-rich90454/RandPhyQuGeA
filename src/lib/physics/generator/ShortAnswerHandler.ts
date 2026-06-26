import type {ExpressionEvaluatorLike} from '../contracts';
import {BaseQuestionHandler} from './BaseQuestionHandler';
/** Short-answer handler: no choices; the answer is a formatted numeric value. */
export class ShortAnswerHandler extends BaseQuestionHandler {
	public readonly type = 'SA';
	protected formatAnswer(value: number, evaluator: ExpressionEvaluatorLike): string {
		return evaluator.formatNumeric(value);
	}
	protected generateChoices(): string[] {
		return [];
	}
}
