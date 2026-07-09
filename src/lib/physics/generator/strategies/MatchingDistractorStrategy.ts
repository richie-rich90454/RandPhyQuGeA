import type {DistractorContext, RandomGenerator, ResponseFormatStrategy} from "../../contracts";
import {parseMatchingPairs} from "../MatchingHandler";
/** Matching distractor strategy: returns the right-side items that do not match the prompt (shuffled), so the McqAssembler can present them as choices alongside the correct match. */
export class MatchingDistractorStrategy implements ResponseFormatStrategy {
	public readonly questionType = "MATCHING";
	/** Generate up to `count` distractor right items (excluding `context.answer`), de-duplicated and shuffled by `random`. */
	public generateDistractors(context: DistractorContext, count: number, random: RandomGenerator): string[] {
		const pairs = parseMatchingPairs(context.template);
		const seen: Set<string> = new Set([context.answer]);
		const rights: string[] = [];
		for (const p of pairs) {
			if (p.right === context.answer) {
				continue;
			}
			if (seen.has(p.right)) {
				continue;
			}
			seen.add(p.right);
			rights.push(p.right);
		}
		random.shuffle(rights);
		return rights.slice(0, Math.max(0, count));
	}
}
