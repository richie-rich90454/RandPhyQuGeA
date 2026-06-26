import {BaseQuestionHandler} from './BaseQuestionHandler';
/** True/false handler: choices are always ["True", "False"]; a non-zero answer means True. */
export class TrueFalseHandler extends BaseQuestionHandler {
	public readonly type = 'TF';
	protected formatAnswer(value: number): string {
		return value !== 0 ? 'True' : 'False';
	}
	protected generateChoices(): string[] {
		return ['True', 'False'];
	}
}
