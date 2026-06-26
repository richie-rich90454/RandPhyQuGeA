import type {ExpressionEvaluatorLike, QuestionTypeHandler, RandomGenerator} from '../contracts';
import type {GeneratedQuestion, QuestionTemplate} from '../types';
import {TemplateSubstituter} from '../random/TemplateSubstituter';
function generateId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
/** Shared base for question type handlers: substitutes templates, evaluates the answer, and builds the GeneratedQuestion, delegating answer formatting and choice generation to subclasses. */
export abstract class BaseQuestionHandler implements QuestionTypeHandler {
	public abstract readonly type: string;
	private readonly substituter: TemplateSubstituter;
	public constructor() {
		this.substituter = new TemplateSubstituter();
	}
	public handle(template: QuestionTemplate, variables: Record<string, unknown>, evaluator: ExpressionEvaluatorLike, random: RandomGenerator): GeneratedQuestion {
		const text = this.substituter.substitute(template.text_template, variables);
		let answerValue = 0;
		try {
			answerValue = evaluator.evaluate(template.answer_expression, variables);
			// eslint-disable-next-line brace-style
		} catch {
			answerValue = 0;
		}
		const answer = this.formatAnswer(answerValue, evaluator);
		const choices = this.generateChoices(template, variables, answerValue, evaluator, random);
		const solutionText = this.substituter.substitute(template.solution_template, variables).replaceAll('{answer}', answer);
		return {
			id: generateId(),
			topic_id: template.topic_id,
			skill_id: template.skill_id,
			question_type: template.question_type,
			difficulty: template.difficulty,
			text,
			answer,
			choices: choices.length > 0 ? choices : undefined,
			solution_text: solutionText,
			solution_latex: template.solution_template,
			variables
		};
	}
	protected abstract formatAnswer(value: number, evaluator: ExpressionEvaluatorLike): string;
	protected abstract generateChoices(template: QuestionTemplate, variables: Record<string, unknown>, answerValue: number, evaluator: ExpressionEvaluatorLike, random: RandomGenerator): string[];
}
