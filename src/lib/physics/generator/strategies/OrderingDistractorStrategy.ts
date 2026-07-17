import type {DistractorContext, RandomGenerator, ResponseFormatStrategy} from "../../contracts";
import {joinOrder, parseOrderingItems} from "../OrderingHandler";
/** Ordering distractor strategy: produces alternative orderings (permutations) of the canonical item list as distractor choices. Candidates are generated systematically (reverse, adjacent swaps, rotations) and topped up with random shuffles, then de-duplicated against the correct answer and shuffled before returning. */
export class OrderingDistractorStrategy implements ResponseFormatStrategy {
    public readonly questionType = "ORDERING";
    /** Generate up to `count` unique alternative orderings (excluding the correct order), shuffled by `random`. Returns an empty array when fewer than two items are present (no alternative ordering is possible). */
    public generateDistractors(context: DistractorContext, count: number, random: RandomGenerator): string[] {
        const items = parseOrderingItems(context.template);
        const correct = joinOrder(items);
        if (items.length < 2) {
            return [];
        }
        const seen: Set<string> = new Set([correct]);
        const distractors: string[] = [];
        const candidates: string[][] = this.systematicPermutations(items);
        for (const candidate of candidates) {
            if (distractors.length >= count) {
                break;
            }
            const joined = joinOrder(candidate);
            if (seen.has(joined)) {
                continue;
            }
            seen.add(joined);
            distractors.push(joined);
        }
        let attempts = 0;
        const maxAttempts = count * 10;
        while (distractors.length < count && attempts < maxAttempts) {
            const perm = random.shuffle([...items]);
            const joined = joinOrder(perm);
            if (!seen.has(joined)) {
                seen.add(joined);
                distractors.push(joined);
            }
            attempts++;
        }
        random.shuffle(distractors);
        return distractors.slice(0, Math.max(0, count));
    }
    /** Build systematic alternative orderings: the reverse, every adjacent-pair swap, and every non-zero rotation. */
    private systematicPermutations(items: readonly string[]): string[][] {
        const result: string[][] = [];
        result.push(items.toReversed());
        for (let i = 0; i < items.length - 1; i++) {
            const copy = [...items];
            const tmp = copy[i]!;
            copy[i] = copy[i + 1]!;
            copy[i + 1] = tmp;
            result.push(copy);
        }
        for (let r = 1; r < items.length; r++) {
            result.push([...items.slice(r), ...items.slice(0, r)]);
        }
        return result;
    }
}
