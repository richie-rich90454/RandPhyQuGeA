import type {DistractorContext, RandomGenerator, ResponseFormatStrategy} from "../../contracts";
import {QUESTION_TYPES} from "../../types";
/** Blank-token distractor strategy for FB question types: evaluates template distractor expressions, then perturbs the numeric answer (off-by-one, doubling, halving) to fill in alternate blank tokens. */
export class BlankTokenDistractorStrategy implements ResponseFormatStrategy {
	public readonly questionType = QUESTION_TYPES.FB;
	/** Generate up to `count` blank-token distractors: first evaluates `template.distractor_expressions`, then falls back to numeric perturbations of the answer (off-by-one, doubling, halving, ±2), shuffled by `random`. Distractors equal to the correct answer or already collected are skipped. */
	public generateDistractors(context: DistractorContext, count: number, random: RandomGenerator): string[] {
		const {answer, answerValue, template, variables, evaluator} = context;
		const seen: Set<string> = new Set([answer]);
		const distractors: string[] = [];
		for (const expr of template.distractor_expressions) {
			if (distractors.length >= count) {
				break;
			}
			let val: number;
			try {
				val = evaluator.evaluate(expr, variables);
			} catch {
				continue;
			}
			if (!Number.isFinite(val)) {
				continue;
			}
			const formatted = evaluator.formatNumeric(val);
			if (seen.has(formatted)) {
				continue;
			}
			seen.add(formatted);
			distractors.push(formatted);
		}
		if (distractors.length < count && Number.isFinite(answerValue)) {
			const perturbations = [answerValue + 1, answerValue - 1, answerValue * 2, answerValue / 2, answerValue + 2, answerValue - 2];
			random.shuffle(perturbations);
			for (const val of perturbations) {
				if (distractors.length >= count) {
					break;
				}
				const formatted = evaluator.formatNumeric(val);
				if (seen.has(formatted)) {
					continue;
				}
				seen.add(formatted);
				distractors.push(formatted);
			}
		}
		return distractors;
	}
}
