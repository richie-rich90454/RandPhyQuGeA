import type {DistractorContext, RandomGenerator, ResponseFormatStrategy, UniversalDistractorGeneratorLike} from "../contracts";
import {NumericDistractorStrategy} from "./strategies/NumericDistractorStrategy";
import {BooleanDistractorStrategy} from "./strategies/BooleanDistractorStrategy";
import {BlankTokenDistractorStrategy} from "./strategies/BlankTokenDistractorStrategy";
import {ShortAnswerNeighborStrategy} from "./strategies/ShortAnswerNeighborStrategy";
/** Picks the right {@link ResponseFormatStrategy} per question type, generates distractors, dedupes against the correct answer, and scales to the requested count. */
export class UniversalDistractorGenerator implements UniversalDistractorGeneratorLike {
    private readonly strategies: Map<string, ResponseFormatStrategy>;
    private readonly fallback: ResponseFormatStrategy;
    public constructor(strategies?: ResponseFormatStrategy[]) {
        this.strategies = new Map();
        this.fallback = new ShortAnswerNeighborStrategy();
        if (strategies !== undefined) {
            for (const s of strategies) {
                this.register(s);
            }
        } else {
            this.registerDefaults();
        }
    }
    public register(strategy: ResponseFormatStrategy): void {
        this.strategies.set(strategy.questionType, strategy);
    }
    public get(questionType: string): ResponseFormatStrategy | undefined {
        return this.strategies.get(questionType);
    }
    public generate(context: DistractorContext, count: number, random: RandomGenerator): string[] {
        const strategy = this.strategies.get(context.template.question_type) ?? this.fallback;
        const raw = strategy.generateDistractors(context, count, random);
        const seen: Set<string> = new Set([context.answer]);
        const deduped: string[] = [];
        for (const d of raw) {
            if (seen.has(d)) {
                continue;
            }
            seen.add(d);
            deduped.push(d);
            if (deduped.length >= count) {
                break;
            }
        }
        return deduped;
    }
    public static createDefault(): UniversalDistractorGenerator {
        return new UniversalDistractorGenerator();
    }
    private registerDefaults(): void {
        const numeric = new NumericDistractorStrategy();
        this.strategies.set("NE", numeric);
        this.strategies.set("MC", numeric);
        this.strategies.set("TF", new BooleanDistractorStrategy());
        this.strategies.set("FB", new BlankTokenDistractorStrategy());
        this.strategies.set("SA", new ShortAnswerNeighborStrategy());
    }
}
