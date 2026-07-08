import type {DistractorContext, McqAssemblerLike, RandomGenerator} from "../contracts";
import type {GeneratedQuestion} from "../types";
import {SeededRandom} from "../random/SeededRandom";
import {UniversalDistractorGenerator} from "./UniversalDistractorGenerator";
/** Default number of choices (1 correct + N distractors) when no explicit count is supplied. */
const DEFAULT_CHOICE_COUNT = 4;
/** Decorates a base free-response {@link GeneratedQuestion} with multiple-choice choices, the correct choice index, and `response_mode='mcq'`, using a {@link UniversalDistractorGenerator} for type-aware distractors. */
export class McqAssembler implements McqAssemblerLike {
    private readonly generator: UniversalDistractorGenerator;
    private readonly defaultChoiceCount: number;
    /** Construct an assembler; when `generator` is omitted a default {@link UniversalDistractorGenerator} is used, and `defaultChoiceCount` defaults to 4. */
    public constructor(generator?: UniversalDistractorGenerator, defaultChoiceCount?: number) {
        this.generator = generator ?? UniversalDistractorGenerator.createDefault();
        this.defaultChoiceCount = defaultChoiceCount ?? DEFAULT_CHOICE_COUNT;
    }
    /** Decorate `question` with shuffled choices and `correct_choice_index`. When `seed` is supplied, distractor generation and the Fisher-Yates shuffle use a {@link SeededRandom} so ordering is stable for that seed; otherwise the passed `random` is used. When the strategy yields zero distractors the question falls back to `response_mode='frq'` with `grader_hint='mcq-unavailable-fallback'`. When it yields fewer distractors than requested (but at least one) the choices are padded with a single literal `"None of the above"` choice that is never marked correct. */
    public assemble(question: GeneratedQuestion, context: DistractorContext, random: RandomGenerator, choiceCount?: number, seed?: number): GeneratedQuestion {
        const target = choiceCount ?? this.defaultChoiceCount;
        const distractorCount = Math.max(1, target - 1);
        const rng: RandomGenerator = seed !== undefined ? new SeededRandom(seed) : random;
        const distractors = this.generator.generate(context, distractorCount, rng);
        if (distractors.length === 0) {
            // No distractors available: fall back to free-response mode with a grader hint.
            return {
                ...question,
                response_mode: "frq",
                grader_hint: "mcq-unavailable-fallback",
            };
        }
        const choices: string[] = [...distractors, context.answer];
        if (choices.length < target && !choices.includes("None of the above")) {
            // Strategy yielded fewer unique distractors than requested: pad with a literal
            // "None of the above" choice that is never the correct answer.
            choices.push("None of the above");
        }
        const shuffled = this.shuffle(choices, rng);
        const correctIndex = shuffled.indexOf(context.answer);
        return {
            ...question,
            choices: shuffled,
            correct_choice_index: correctIndex,
            response_mode: "mcq",
        };
    }
    /** Fisher-Yates shuffle returning a new array; the input is not mutated. */
    private shuffle<T>(items: T[], random: RandomGenerator): T[] {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = random.nextInt(0, i);
            const tmp = copy[i]!;
            copy[i] = copy[j]!;
            copy[j] = tmp;
        }
        return copy;
    }
}
