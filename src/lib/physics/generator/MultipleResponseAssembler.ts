import type {RandomGenerator} from "../contracts";
import type {GeneratedQuestion, QuestionTemplate} from "../types";
import {parseMultipleResponseOptions} from "./MultipleResponseHandler";
/** Assembles a select-all-that-apply (Multiple Response) MCQ question from a free-response base: shuffles all options into `choices` and records the indices of the correct options in `correct_choice_indices`. Unlike {@link McqAssembler} (which adds N distractors alongside a single correct answer), every option becomes a choice and multiple may be correct. */
export class MultipleResponseAssembler {
	/** Decorate `base` with all shuffled options as `choices`, `correct_choice_indices`, and `response_mode='mcq'`. When the template has no options the base is returned with a `mcq-unavailable-fallback` grader hint in free-response mode. */
	public assemble(base: GeneratedQuestion, template: QuestionTemplate, random: RandomGenerator): GeneratedQuestion {
		const options = parseMultipleResponseOptions(template);
		if (options.length === 0) {
			return {
				...base,
				response_mode: "frq",
				grader_hint: "mcq-unavailable-fallback",
			};
		}
		const shuffled = random.shuffle([...options]);
		const choices = shuffled.map(o => o.label);
		const correctChoiceIndices: number[] = [];
		shuffled.forEach((option, index) => {
			if (option.correct) {
				correctChoiceIndices.push(index);
			}
		});
		return {
			...base,
			choices,
			correct_choice_indices: correctChoiceIndices,
			response_mode: "mcq",
		};
	}
}
