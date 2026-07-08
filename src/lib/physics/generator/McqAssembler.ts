import type {DistractorContext, McqAssemblerLike, RandomGenerator} from "../contracts";
import type {GeneratedQuestion} from "../types";
import {UniversalDistractorGenerator} from "./UniversalDistractorGenerator";
/** Default number of choices (1 correct + N distractors) when no explicit count is supplied. */
const DEFAULT_CHOICE_COUNT = 4;
/** Decorates a base free-response {@link GeneratedQuestion} with multiple-choice choices, the correct choice index, and `response_mode='mcq'`, using a {@link UniversalDistractorGenerator} for type-aware distractors. */
export class McqAssembler implements McqAssemblerLike {
    private readonly generator: UniversalDistractorGenerator;
    private readonly defaultChoiceCount: number;
    public constructor(generator?: UniversalDistractorGenerator, defaultChoiceCount?: number) {
        this.generator = generator ?? UniversalDistractorGenerator.createDefault();
        this.defaultChoiceCount = defaultChoiceCount ?? DEFAULT_CHOICE_COUNT;
    }
    public assemble(question: GeneratedQuestion, context: DistractorContext, random: RandomGenerator, choiceCount?: number): GeneratedQuestion {
        const target = choiceCount ?? this.defaultChoiceCount;
        const distractorCount = Math.max(1, target - 1);
        const distractors = this.generator.generate(context, distractorCount, random);
        const choices: string[] = [...distractors, context.answer];
        const shuffled = this.shuffle(choices, random);
        const correctIndex = shuffled.indexOf(context.answer);
        return {
            ...question,
            choices: shuffled,
            correct_choice_index: correctIndex,
            response_mode: "mcq",
        };
    }
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
