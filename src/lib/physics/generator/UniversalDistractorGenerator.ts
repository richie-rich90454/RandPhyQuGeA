import type {DistractorContext, RandomGenerator, ResponseFormatStrategy, UniversalDistractorGeneratorLike} from "../contracts";
import {NumericDistractorStrategy} from "./strategies/NumericDistractorStrategy";
import {BooleanDistractorStrategy} from "./strategies/BooleanDistractorStrategy";
import {BlankTokenDistractorStrategy} from "./strategies/BlankTokenDistractorStrategy";
import {ShortAnswerNeighborStrategy} from "./strategies/ShortAnswerNeighborStrategy";
import {MatchingDistractorStrategy} from "./strategies/MatchingDistractorStrategy";
import {OrderingDistractorStrategy} from "./strategies/OrderingDistractorStrategy";
/** Picks the right {@link ResponseFormatStrategy} per question type, generates distractors, dedupes against the correct answer, and scales to the requested count. */
export class UniversalDistractorGenerator implements UniversalDistractorGeneratorLike {
    private readonly strategies: Map<string, ResponseFormatStrategy>;
    private readonly fallback: ResponseFormatStrategy;
    /** Construct the generator. When `strategies` is omitted the five default strategies (NE/MC numeric, TF boolean, FB blank-token, SA short-answer-neighbor) are registered; the {@link ShortAnswerNeighborStrategy} is always installed as the fallback for unregistered question types. */
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
    /** Register (or replace) the strategy for its `questionType` key (open-closed extension point). */
    public register(strategy: ResponseFormatStrategy): void {
        this.strategies.set(strategy.questionType, strategy);
    }
    /** Look up the strategy registered for `questionType`, or `undefined` when none is registered (the fallback is applied by {@link generate}). */
    public get(questionType: string): ResponseFormatStrategy | undefined {
        return this.strategies.get(questionType);
    }
    /** Generate up to `count` unique distractor strings for `context.template.question_type`, excluding `context.answer`. Selects the registered strategy (or the fallback), then dedupes raw output against the correct answer and itself, stopping once `count` unique items are collected. The returned array may be shorter than `count` when the strategy cannot produce enough unique distractors. */
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
    /** Convenience factory returning a generator pre-loaded with the five default strategies. */
    public static createDefault(): UniversalDistractorGenerator {
        return new UniversalDistractorGenerator();
    }
    /** Register the built-in strategies: NE/MC numeric, TF boolean, FB blank-token, SA short-answer-neighbor. */
    private registerDefaults(): void {
        const numeric = new NumericDistractorStrategy();
        this.strategies.set("NE", numeric);
        this.strategies.set("MC", numeric);
        this.strategies.set("TF", new BooleanDistractorStrategy());
        this.strategies.set("FB", new BlankTokenDistractorStrategy());
        this.strategies.set("SA", new ShortAnswerNeighborStrategy());
        this.strategies.set("MATCHING", new MatchingDistractorStrategy());
        this.strategies.set("ORDERING", new OrderingDistractorStrategy());
    }
}
