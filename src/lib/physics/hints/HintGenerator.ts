/**
 * Partial-credit hint generator.
 *
 * Produces an ordered list of progressively more revealing hints for a
 * question, given a {@link HintContext} (formula, variables, units, solution
 * steps, correct answer). Hints advance from a generic formula reminder to
 * variable values, then to solution steps, the unit, and finally the answer.
 * The generator also supports fetching the next un-revealed hint for a
 * partial-credit workflow. Pure-TS, no DOM dependencies.
 */
export type HintKind = "formula" | "variables" | "step" | "unit" | "answer";
export interface Hint {
	/** Level 1 is the least specific; higher levels reveal more. */
	level: number;
	/** The category of hint. */
	kind: HintKind;
	/** Human-readable hint text. */
	text: string;
}
export interface HintContext {
	/** Optional LaTeX for the governing formula. */
	formulaLatex?: string;
	/** Optional human-readable name for the formula. */
	formulaName?: string;
	/** Optional map of variable name to value used in the question. */
	variables?: Record<string, number | string>;
	/** Optional expected unit for the answer (e.g. "m/s"). */
	answerUnits?: string;
	/** Optional ordered list of textual solution steps. */
	solutionSteps?: string[];
	/** Optional correct answer string. */
	correctAnswer?: string;
}
export class HintGenerator {
	/** Generate the full ordered list of hints available for `context`, capped at `maxLevel` when provided. */
	public generate(context: HintContext, maxLevel?: number): Hint[] {
		const hints: Hint[] = [];
		let level = 0;
		if (context.formulaName !== undefined) {
			level += 1;
			hints.push({level, kind: "formula", text: `Recall the formula: ${context.formulaName}.`});
		} else if (context.formulaLatex !== undefined) {
			level += 1;
			hints.push({level, kind: "formula", text: `The relevant formula is ${context.formulaLatex}.`});
		}
		if (context.variables !== undefined) {
			const entries = Object.entries(context.variables);
			if (entries.length > 0) {
				level += 1;
				const pairs = entries.map(([k, v]) => `${k} = ${v}`).join(", ");
				hints.push({level, kind: "variables", text: `Use the given values: ${pairs}.`});
			}
		}
		if (context.solutionSteps !== undefined) {
			for (const step of context.solutionSteps) {
				level += 1;
				hints.push({level, kind: "step", text: step});
			}
		}
		if (context.answerUnits !== undefined) {
			level += 1;
			hints.push({level, kind: "unit", text: `Express your answer in ${context.answerUnits}.`});
		}
		if (context.correctAnswer !== undefined) {
			level += 1;
			hints.push({level, kind: "answer", text: `The correct answer is ${context.correctAnswer}.`});
		}
		if (maxLevel !== undefined) {
			return hints.filter(h => h.level <= maxLevel);
		}
		return hints;
	}
	/** Return the first hint whose level is greater than all `revealedLevels`, or null when none remain. */
	public nextHint(context: HintContext, revealedLevels: number[]): Hint | null {
		const hints = this.generate(context);
		const maxRevealed = revealedLevels.length === 0 ? 0 : Math.max(...revealedLevels);
		for (const h of hints) {
			if (h.level > maxRevealed) {
				return h;
			}
		}
		return null;
	}
	/** Return true when at least one hint can still be revealed beyond `revealedLevels`. */
	public hasMoreHints(context: HintContext, revealedLevels: number[]): boolean {
		return this.nextHint(context, revealedLevels) !== null;
	}
}
