import type {ExpressionEvaluatorLike, QuestionTypeHandler, RandomGenerator} from "../contracts";
import type {GeneratedQuestion, QuestionTemplate} from "../types";
import {TemplateSubstituter} from "../random/TemplateSubstituter";
/** Separator used when joining the correct option labels into the canonical answer string. */
const ANSWER_SEPARATOR = ", ";
function generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
/** A single selectable option with its correctness flag. */
export interface MultipleResponseOption {
    /** The option label shown to the student. */
    readonly label: string;
    /** Whether this option should be selected (true) or left unselected (false). */
    readonly correct: boolean;
}
/**
 * Multiple Response (select-all-that-apply) question type handler.
 *
 * Options are encoded in the template's `distractor_expressions` array as
 * `"label=true"` (a correct option to select) or `"label=false"` (an incorrect
 * option to leave unselected). The handler builds a free-response base question
 * whose canonical `answer` is the correct labels joined by `", "` and whose
 * text supports an `{options}` token substituted with all option labels. In MCQ
 * mode the {@link MultipleResponseAssembler} decorates the base with all options
 * as `choices` and `correct_choice_indices` marking the correct ones. Pure-TS,
 * no DOM dependencies.
 */
export class MultipleResponseHandler implements QuestionTypeHandler {
    public readonly type = "MULTI_RESPONSE";
    private readonly substituter: TemplateSubstituter;
    /** Construct a multiple-response handler. */
    public constructor() {
        this.substituter = new TemplateSubstituter();
    }
    /** Build a free-response multiple-response question: substitute the text/solution templates, join the correct option labels into the answer, and substitute `{options}` with all labels. */
    public handle(template: QuestionTemplate, variables: Record<string, unknown>, _evaluator: ExpressionEvaluatorLike, _random: RandomGenerator): GeneratedQuestion {
        const options = parseMultipleResponseOptions(template);
        const correctLabels = options.filter(o => o.correct).map(o => o.label);
        const answer = correctLabels.join(ANSWER_SEPARATOR);
        const allLabels = options.map(o => o.label).join(ANSWER_SEPARATOR);
        const baseText = this.substituter.substitute(template.text_template, variables).replaceAll("{options}", allLabels);
        const solutionText = this.substituter.substitute(template.solution_template, variables).replaceAll("{options}", allLabels).replaceAll("{answer}", answer);
        const solutionLatex =
            template.solution_latex_template.trim().length > 0
                ? this.substituter.substitute(template.solution_latex_template, variables).replaceAll("{options}", allLabels).replaceAll("{answer}", answer)
                : "";
        const diagramSvg = template.diagram_svg !== undefined ? this.substituter.substituteDiagram(template.diagram_svg, variables, answer) : undefined;
        return {
            id: generateId(),
            topic_id: template.topic_id,
            skill_id: template.skill_id,
            question_type: template.question_type,
            difficulty: template.difficulty,
            text: baseText,
            answer,
            response_mode: "frq",
            solution_text: solutionText,
            solution_latex: solutionLatex,
            diagram_svg: diagramSvg,
            variables,
        };
    }
}
/** Parse select-all-that-apply options from a template's `distractor_expressions` (`"label=true"`/`"label=false"` entries). Entries without an `=`, with an empty label, or with an unrecognized flag are skipped. Recognized truthy flags: true/1/yes; falsy flags: false/0/no. */
export function parseMultipleResponseOptions(template: QuestionTemplate): MultipleResponseOption[] {
    const options: MultipleResponseOption[] = [];
    for (const raw of template.distractor_expressions) {
        const idx = raw.indexOf("=");
        if (idx <= 0) {
            continue;
        }
        const label = raw.slice(0, idx).trim();
        const flag = raw
            .slice(idx + 1)
            .trim()
            .toLowerCase();
        if (label === "") {
            continue;
        }
        if (flag === "true" || flag === "1" || flag === "yes") {
            options.push({label, correct: true});
        } else if (flag === "false" || flag === "0" || flag === "no") {
            options.push({label, correct: false});
        }
    }
    return options;
}
