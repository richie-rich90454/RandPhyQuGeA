/**
 * TypeScript domain models mirroring the `physics_core` Rust crate types.
 *
 * Field names are kept in snake_case to match the JSON serialization
 * produced by serde on the Rust side, so no runtime key transformation
 * is required when crossing the Tauri/WASM boundary.
 */

/** Practice mode for a study session. Matches the Rust `PracticeMode` enum. */
export type PracticeMode = 'Mental' | 'Focused';

/** Supported question template types. */
export type QuestionType = 'MultipleChoice' | 'ShortAnswer';

/** Supported export formats for the question exporters. */
export type ExportFormat =
  | 'html'
  | 'pdf'
  | 'markdown'
  | 'text'
  | 'json'
  | 'csv'
  | 'latex';

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
  solution_text: string;
  solution_latex: string;
  variables: Record<string, unknown>;
}

/** A full specification parsed from a spec text file. */
export interface Specification {
  units: Unit[];
  topics: Topic[];
  skills: Skill[];
  templates: QuestionTemplate[];
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
