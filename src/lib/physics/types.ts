/**
 * Physics-core domain types.
 *
 * Re-exports the shared domain models from `../../types/models` so the
 * physics core exposes a single import surface, and adds core-only types
 * used by the parser and generator.
 */
import type {ResponseMode} from "../../types/models";
export * from "../../types/models";
/** A single parse error with line number and message. */
export interface ParseError {
    line: number;
    message: string;
}
/** Aggregate parse exception carrying multiple errors. */
export class ParseException extends Error {
    public readonly errors: ParseError[];
    constructor(errors: ParseError[]) {
        super(`Parse errors: ${JSON.stringify(errors)}`);
        this.name = "ParseException";
        this.errors = errors;
    }
}
/** Filter options for question generation. */
export interface QuestionFilter {
    topicId?: string;
    skillId?: string;
    minDifficulty?: number;
    maxDifficulty?: number;
    questionType?: string;
    excludeIds?: string[];
    templateIds?: string[];
    /** Response format requested for generation; orthogonal to questionType. Undefined defaults to 'frq'. */
    responseMode?: ResponseMode;
}
