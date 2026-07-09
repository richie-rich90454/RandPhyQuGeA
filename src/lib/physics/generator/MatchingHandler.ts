import type {ExpressionEvaluatorLike, QuestionTypeHandler, RandomGenerator} from "../contracts";
import type {GeneratedQuestion, QuestionTemplate} from "../types";
import {TemplateSubstituter} from "../random/TemplateSubstituter";
/** A single left->right matching pair. */
export interface MatchingPair {
	/** The left-side prompt item. */
	readonly left: string;
	/** The right-side matching item. */
	readonly right: string;
}
function generateId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
/**
 * Matching question type handler.
 *
 * Matching questions present a left item and ask which right item corresponds
 * to it. Pairs are encoded in the template's `distractor_expressions` array as
 * `"left=right"` strings. The handler picks one pair as the prompt (the left
 * item is substituted into `{prompt}` in the text template) and sets the
 * canonical answer to the matching right item. In MCQ mode the
 * {@link MatchingDistractorStrategy} supplies the other right items as
 * distractor choices. Pure-TS, no DOM dependencies.
 */
export class MatchingHandler implements QuestionTypeHandler {
	public readonly type = "MATCHING";
	private readonly substituter: TemplateSubstituter;
	/** Construct a matching handler. */
	public constructor() {
		this.substituter = new TemplateSubstituter();
	}
	/** Build a free-response matching question: substitute the text/solution templates, pick a prompt pair, and set the answer to the matching right item. */
	public handle(template: QuestionTemplate, variables: Record<string, unknown>, _evaluator: ExpressionEvaluatorLike, random: RandomGenerator): GeneratedQuestion {
		const pairs = parseMatchingPairs(template);
		const baseText = this.substituter.substitute(template.text_template, variables);
		let answer = "";
		let promptLeft = "";
		if (pairs.length > 0) {
			const idx = random.nextInt(0, pairs.length - 1);
			const pair = pairs[idx]!;
			promptLeft = pair.left;
			answer = pair.right;
		}
		const promptValue = promptLeft.length > 0 ? promptLeft : "?";
		const text = baseText.replaceAll("{prompt}", promptValue);
		const solutionText = this.substituter.substitute(template.solution_template, variables).replaceAll("{prompt}", promptValue).replaceAll("{answer}", answer);
		const solutionLatex =
			template.solution_latex_template.trim().length > 0 ? this.substituter.substitute(template.solution_latex_template, variables).replaceAll("{prompt}", promptValue).replaceAll("{answer}", answer) : solutionText;
		const diagramSvg = template.diagram_svg !== undefined ? this.substituter.substituteDiagram(template.diagram_svg, variables, answer) : undefined;
		return {
			id: generateId(),
			topic_id: template.topic_id,
			skill_id: template.skill_id,
			question_type: template.question_type,
			difficulty: template.difficulty,
			text,
			answer,
			response_mode: "frq",
			solution_text: solutionText,
			solution_latex: solutionLatex,
			diagram_svg: diagramSvg,
			variables,
		};
	}
}
/** Parse matching pairs from a template's `distractor_expressions` (`"left=right"` entries). Entries without an `=` or with empty sides are skipped. */
export function parseMatchingPairs(template: QuestionTemplate): MatchingPair[] {
	const pairs: MatchingPair[] = [];
	for (const raw of template.distractor_expressions) {
		const idx = raw.indexOf("=");
		if (idx <= 0) {
			continue;
		}
		const left = raw.slice(0, idx).trim();
		const right = raw.slice(idx + 1).trim();
		if (left === "" || right === "") {
			continue;
		}
		pairs.push({left, right});
	}
	return pairs;
}
