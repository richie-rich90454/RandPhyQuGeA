/**
 * Canonical TypeScript domain models for the physics question generator.
 *
 * Field names use snake_case to match the specification file format and
 * the internal parser/exporter conventions used by the pure-TypeScript core.
 */
/** Practice mode for a study session: Single (deep focus) or Mental (timed drill). */
export type PracticeMode = "Single" | "Mental";
/** Supported question template types. */
export type QuestionType = "MC" | "SA" | "TF" | "FB" | "NE";
/** Response format dimension, orthogonal to {@link QuestionType}: 'mcq' (multiple-choice) or 'frq' (free-response). */
export type ResponseMode = "mcq" | "frq";
export const QUESTION_TYPES = {
	MC: "MC" as const,
	SA: "SA" as const,
	TF: "TF" as const,
	FB: "FB" as const,
	NE: "NE" as const,
} satisfies Record<string, QuestionType>;
/** Canonical aliases mapping full spec names (e.g. "MultipleChoice") and short codes (e.g. "MC") to the canonical {@link QuestionType} code. Single source of truth for parser normalization so 'MultipleChoice' vs 'MC' string drift cannot cause a missed grading branch. */
export const QUESTION_TYPE_ALIASES: Record<string, QuestionType> = {
	MultipleChoice: QUESTION_TYPES.MC,
	ShortAnswer: QUESTION_TYPES.SA,
	TrueFalse: QUESTION_TYPES.TF,
	FillInBlank: QUESTION_TYPES.FB,
	NumericEntry: QUESTION_TYPES.NE,
	MC: QUESTION_TYPES.MC,
	SA: QUESTION_TYPES.SA,
	TF: QUESTION_TYPES.TF,
	FB: QUESTION_TYPES.FB,
	NE: QUESTION_TYPES.NE,
};
/** Normalize a raw question-type string to its canonical {@link QuestionType} code; unknown values pass through unchanged so custom handlers still resolve via the registry. */
export function normalizeQuestionType(raw: string): string {
	const canonical = QUESTION_TYPE_ALIASES[raw];
	return canonical !== undefined ? canonical : raw;
}
/** Supported export formats for the question exporters. */
export type ExportFormat = "html" | "pdf" | "markdown" | "text" | "json" | "csv" | "latex" | "anki" | "quizlet";
/** A top-level organizational unit (e.g. "Mechanics"). */
export interface Unit {
	id: string;
	name: string;
	description: string;
}
/** A topic belonging to a unit. */
export interface Topic {
	id: string;
	name: string;
	unit_id: string;
	description: string;
}
/** A skill belonging to a topic. */
export interface Skill {
	id: string;
	name: string;
	topic_id: string;
	description: string;
}
/** Definition of a variable used inside a question template. */
export interface VariableDefinition {
	name: string;
	var_type: string;
	min?: number;
	max?: number;
	step?: number;
	enum_values?: string[];
}
/** A reusable question template with templated text and expressions. */
export interface QuestionTemplate {
	id: string;
	topic_id: string;
	skill_id: string;
	question_type: string;
	difficulty: number;
	text_template: string;
	answer_expression: string;
	solution_template: string;
	/** KaTeX-renderable LaTeX solution template (substituted with variables and {answer}); empty when not provided. */
	solution_latex_template: string;
	/** Optional SVG diagram template (supports {var} and {answer} substitution); undefined when no diagram is provided. */
	diagram_svg?: string;
	variable_definitions: VariableDefinition[];
	distractor_expressions: string[];
}
/** A concrete generated question ready to be presented to the user. */
export interface GeneratedQuestion {
	id: string;
	topic_id: string;
	skill_id: string;
	question_type: string;
	difficulty: number;
	text: string;
	answer: string;
	choices?: string[];
	response_mode: ResponseMode;
	correct_choice_index?: number;
	/** Indices of all correct choices for select-all-that-apply (Multiple Response) MCQ questions; mutually exclusive with {@link correct_choice_index}. */
	correct_choice_indices?: number[];
	grader_hint?: string;
	solution_text: string;
	solution_latex: string;
	/** Substituted SVG diagram markup for the question; undefined when no diagram is provided. */
	diagram_svg?: string;
	variables: Record<string, unknown>;
}
/** A diagram block referencing a template by id with substitutable SVG markup. */
export interface Diagram {
	id: string;
	template_id: string;
	caption?: string;
	svg: string;
}
/** A hint block referencing a template by id with optional difficulty gating. */
export interface Hint {
	id: string;
	template_id: string;
	text: string;
	difficulty?: number;
}
/** A unit conversion rule with a multiplicative factor and an optional additive offset. */
export interface UnitConversion {
	id: string;
	from_unit: string;
	to_unit: string;
	factor: number;
	offset?: number;
}
/** A full specification parsed from a spec text file. */
export interface Specification {
	units: Unit[];
	topics: Topic[];
	skills: Skill[];
	templates: QuestionTemplate[];
	/** Diagram blocks parsed from [DIAGRAM] sections; undefined when none are present. */
	diagrams?: Diagram[];
	/** Hint blocks parsed from [HINT] sections; undefined when none are present. */
	hints?: Hint[];
	/** Unit conversion rules parsed from [UNIT_CONVERT] sections; undefined when none are present. */
	unit_conversions?: UnitConversion[];
}
/** The result of a single practice attempt. */
export interface PracticeResult {
	id: string;
	question_id: string;
	topic_id: string;
	skill_id: string;
	is_correct: boolean;
	time_taken_ms: number;
	user_answer: string;
	timestamp: string;
	mode: PracticeMode;
	difficulty: number;
}
/** A formula reference entry for the formula library. */
export interface FormulaEntry {
	name: string;
	latex: string;
	description: string;
	variables: string[];
	topic_id?: string;
}
