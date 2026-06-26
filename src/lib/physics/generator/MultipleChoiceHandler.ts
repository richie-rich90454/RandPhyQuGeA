import type {ExpressionEvaluatorLike, RandomGenerator} from '../contracts';
import type {QuestionTemplate} from '../types';
import {BaseQuestionHandler} from './BaseQuestionHandler';
/** Multiple-choice handler: evaluates each distractor expression, drops any equal to the answer, appends the answer, and shuffles. */
export class MultipleChoiceHandler extends BaseQuestionHandler {
	public readonly type = 'MC';
	protected formatAnswer(value: number, evaluator: ExpressionEvaluatorLike): string {
		return evaluator.formatNumeric(value);
	}
	protected generateChoices(template: QuestionTemplate, variables: Record<string, unknown>, answerValue: number, evaluator: ExpressionEvaluatorLike, random: RandomGenerator): string[] {
		const answerFormatted = evaluator.formatNumeric(answerValue);
		const choices: string[] = [];
		for (const expr of template.distractor_expressions) {
			let val = 0;
			try {
				val = evaluator.evaluate(expr, variables);
				// eslint-disable-next-line brace-style
			} catch {
				continue;
			}
			const formatted = evaluator.formatNumeric(val);
			if (formatted !== answerFormatted) {
				choices.push(formatted);
			}
		}
		choices.push(answerFormatted);
		return random.shuffle(choices);
	}
}
