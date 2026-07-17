import type {ExpressionEvaluatorLike, QuestionTypeHandler, RandomGenerator} from "../contracts";
import type {GeneratedQuestion, QuestionTemplate} from "../types";
import {TemplateSubstituter} from "../random/TemplateSubstituter";
function generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
/** Shared base for question type handlers: substitutes templates, evaluates the answer, and builds the GeneratedQuestion in free-response mode (answer + solution only). Choice generation is handled by the McqAssembler, not the handler. */
export abstract class BaseQuestionHandler implements QuestionTypeHandler {
    public abstract readonly type: string;
    private readonly substituter: TemplateSubstituter;
    public constructor() {
        this.substituter = new TemplateSubstituter();
    }
    /** Build a free-response {@link GeneratedQuestion} from `template` + resolved `variables`: substitute the text/solution templates, evaluate the answer expression (falling back to 0 on error), format the answer via {@link formatAnswer}, and substitute `{answer}` into the solution templates. Choice generation is NOT performed here — McqAssembler decorates the result when `response_mode='mcq'` is requested. */
    public handle(template: QuestionTemplate, variables: Record<string, unknown>, evaluator: ExpressionEvaluatorLike, _random: RandomGenerator): GeneratedQuestion {
        const text = this.substituter.substitute(template.text_template, variables);
        let answerValue: number;
        try {
            answerValue = evaluator.evaluate(template.answer_expression, variables);
        } catch {
            answerValue = 0;
        }
        const answer = this.formatAnswer(answerValue, evaluator);
        const answerForLatex = this.formatAnswerForLatex(answer, answerValue);
        const solutionText = this.substituter.substitute(template.solution_template, variables).replaceAll("{answer}", answer);
        const solutionLatex = template.solution_latex_template.trim().length > 0 ? this.substituter.substitute(template.solution_latex_template, variables).replaceAll("{answer}", answerForLatex) : "";
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
    /** Format the answer for inclusion in solution_latex: numeric answers use LaTeX numeric format; text answers (e.g. True/False) are wrapped in \\text{...}. */
    protected formatAnswerForLatex(answer: string, value: number): string {
        if (!isNaN(Number(answer))) {
            return this.substituter.formatValue(value);
        }
        return `\\text{${answer}}`;
    }
    /** Format the evaluated numeric `value` into the canonical answer string for this question type (e.g. "True"/"False" for TF, a formatted number for MC/SA/FB/NE). */
    protected abstract formatAnswer(value: number, evaluator: ExpressionEvaluatorLike): string;
}
