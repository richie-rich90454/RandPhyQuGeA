import type {DistractorContext, RandomGenerator, ResponseFormatStrategy} from "../../contracts";
import {QUESTION_TYPES} from "../../types";
/** Boolean distractor strategy for TF question types: the single distractor is the boolean opposite of the correct answer. */
export class BooleanDistractorStrategy implements ResponseFormatStrategy {
    public readonly questionType = QUESTION_TYPES.TF;
    /** Return the single boolean opposite of the correct answer (["False"] when answer is "True", ["True"] otherwise); returns `[]` when `count` is 0. */
    public generateDistractors(context: DistractorContext, count: number, _random: RandomGenerator): string[] {
        const opposite = context.answer === "True" ? "False" : "True";
        return count > 0 ? [opposite] : [];
    }
}
