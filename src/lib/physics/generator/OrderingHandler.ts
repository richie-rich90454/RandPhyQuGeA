import type {ExpressionEvaluatorLike, QuestionTypeHandler, RandomGenerator} from "../contracts";
import type {GeneratedQuestion, QuestionTemplate} from "../types";
import {TemplateSubstituter} from "../random/TemplateSubstituter";
/** Separator used when joining ordered items into a single answer/choice string. */
const ORDER_SEPARATOR = ", ";
function generateId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
/**
 * Ordering question type handler.
 *
 * Ordering questions present a jumbled list of items and ask the student to
 * arrange them into the correct sequence. The correct order is encoded in the
 * template's `distractor_expressions` array (each entry is one item, listed in
 * the canonical order). The handler shuffles the items for display (substituted
 * into `{prompt}` in the text template) and sets the canonical answer to the
 * items joined in the correct order. In MCQ mode the
 * {@link OrderingDistractorStrategy} supplies alternative orderings as
 * distractor choices. Pure-TS, no DOM dependencies.
 */
export class OrderingHandler implements QuestionTypeHandler {
	public readonly type = "ORDERING";
	private readonly substituter: TemplateSubstituter;
	/** Construct an ordering handler. */
	public constructor() {
		this.substituter = new TemplateSubstituter();
	}
	/** Build a free-response ordering question: substitute the text/solution templates, shuffle the items for the prompt, and set the answer to the correctly-ordered item list. */
	public handle(template: QuestionTemplate, variables: Record<string, unknown>, _evaluator: ExpressionEvaluatorLike, random: RandomGenerator): GeneratedQuestion {
		const items = parseOrderingItems(template);
		const correct = joinOrder(items);
		const baseText = this.substituter.substitute(template.text_template, variables);
		const shuffled = random.shuffle([...items]);
		const promptValue = joinOrder(shuffled);
		const text = baseText.replaceAll("{prompt}", promptValue);
		const solutionText = this.substituter.substitute(template.solution_template, variables).replaceAll("{prompt}", promptValue).replaceAll("{answer}", correct);
		const solutionLatex =
			template.solution_latex_template.trim().length > 0 ? this.substituter.substitute(template.solution_latex_template, variables).replaceAll("{prompt}", promptValue).replaceAll("{answer}", correct) : "";
		const diagramSvg = template.diagram_svg !== undefined ? this.substituter.substituteDiagram(template.diagram_svg, variables, correct) : undefined;
		return {
			id: generateId(),
			topic_id: template.topic_id,
			skill_id: template.skill_id,
			question_type: template.question_type,
			difficulty: template.difficulty,
			text,
			answer: correct,
			response_mode: "frq",
			solution_text: solutionText,
			solution_latex: solutionLatex,
			diagram_svg: diagramSvg,
			variables,
		};
	}
}
/** Parse the canonical ordering items from a template's `distractor_expressions` (non-empty, trimmed entries, preserving order). */
export function parseOrderingItems(template: QuestionTemplate): string[] {
	const items: string[] = [];
	for (const raw of template.distractor_expressions) {
		const trimmed = raw.trim();
		if (trimmed.length > 0) {
			items.push(trimmed);
		}
	}
	return items;
}
/** Join an ordered list of items into a single display string using {@link ORDER_SEPARATOR}. */
export function joinOrder(items: readonly string[]): string {
	return items.join(ORDER_SEPARATOR);
}
