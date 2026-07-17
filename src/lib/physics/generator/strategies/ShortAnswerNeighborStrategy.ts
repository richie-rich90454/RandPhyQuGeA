import type {DistractorContext, RandomGenerator, ResponseFormatStrategy} from "../../contracts";
import {QUESTION_TYPES} from "../../types";
/** Short-answer neighbor strategy for SA question types: evaluates template distractor expressions, then produces numeric neighbors of the answer (off-by-one, scaling, sign flip) as plausible short-answer distractors. */
export class ShortAnswerNeighborStrategy implements ResponseFormatStrategy {
    public readonly questionType = QUESTION_TYPES.SA;
    /** Generate up to `count` short-answer distractors: first evaluates `template.distractor_expressions`, then falls back to numeric neighbors of the answer (off-by-one, scaling, sign flip, ±10), shuffled by `random`. Distractors equal to the correct answer or already collected are skipped. */
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
            const neighbors = [answerValue + 1, answerValue - 1, answerValue * 2, answerValue / 2, answerValue + 2, answerValue - 2, -answerValue, answerValue + 10, answerValue - 10];
            random.shuffle(neighbors);
            for (const val of neighbors) {
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
