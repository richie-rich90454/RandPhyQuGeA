import type {DistractorContext, RandomGenerator, ResponseFormatStrategy} from "../../contracts";
/** Boolean distractor strategy for TF question types: the single distractor is the boolean opposite of the correct answer. */
export class BooleanDistractorStrategy implements ResponseFormatStrategy {
    public readonly questionType = "TF";
    public generateDistractors(context: DistractorContext, count: number, _random: RandomGenerator): string[] {
        const opposite = context.answer === "True" ? "False" : "True";
        return count > 0 ? [opposite] : [];
    }
}
