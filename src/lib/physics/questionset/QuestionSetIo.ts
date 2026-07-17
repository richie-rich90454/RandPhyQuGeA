import {type QuestionSet, QuestionSetStore} from "./QuestionSet";
/**
 * JSON import/export for question sets.
 *
 * Serializes {@link QuestionSet} arrays into a versioned JSON envelope and
 * parses them back with strict validation. `importInto` merges parsed sets
 * into a {@link QuestionSetStore} with fresh ids (avoiding collisions with
 * existing sets). Pure-TS, no storage dependencies.
 */
/** Schema version for the question-set export file. */
export const QUESTION_SET_IO_VERSION: number = 1;
/** Envelope wrapping an exported collection of question sets. */
export interface QuestionSetExport {
    /** Schema version for forward compatibility. */
    version: number;
    /** Epoch milliseconds when the export was produced. */
    exportedAt: number;
    /** The exported question sets. */
    sets: QuestionSet[];
}
/** Encodes/decodes question sets to/from a versioned JSON envelope. */
export class QuestionSetIo {
    /** Serialize an array of question sets to a pretty-printed JSON string. */
    public exportSets(sets: QuestionSet[], now: number = Date.now()): string {
        const payload: QuestionSetExport = {version: QUESTION_SET_IO_VERSION, exportedAt: now, sets: sets.map(s => this.clone(s))};
        return JSON.stringify(payload, null, 2);
    }
    /** Serialize all sets in a store to a pretty-printed JSON string. */
    public exportStore(store: QuestionSetStore, now: number = Date.now()): string {
        return this.exportSets(store.getAll(), now);
    }
    /** Parse a JSON string into an array of question sets (preserving original ids). Throws on malformed input. */
    public importSets(json: string): QuestionSet[] {
        const parsed: unknown = JSON.parse(json);
        return this.validate(parsed).sets;
    }
    /** Parse a JSON string and create new sets in `store` (with fresh ids). Returns the newly created sets. Throws on malformed input. */
    public importInto(store: QuestionSetStore, json: string, now: number = Date.now()): QuestionSet[] {
        const sets: QuestionSet[] = this.importSets(json);
        const created: QuestionSet[] = [];
        for (const s of sets) {
            const fresh: QuestionSet = store.create(s.name, s.description, now);
            store.setTemplates(fresh.id, s.templateIds, now);
            for (const tag of s.tags) {
                store.addTag(fresh.id, tag, now);
            }
            created.push(store.get(fresh.id) as QuestionSet);
        }
        return created;
    }
    /** Validate the parsed envelope shape and return a typed export. */
    private validate(parsed: unknown): QuestionSetExport {
        if (typeof parsed !== "object" || parsed === null) {
            throw new Error("Invalid question-set file: payload is not an object");
        }
        const obj: Record<string, unknown> = parsed as Record<string, unknown>;
        const version: unknown = obj["version"];
        if (typeof version !== "number") {
            throw new Error("Invalid question-set file: missing version");
        }
        const exportedAt: unknown = obj["exportedAt"];
        if (typeof exportedAt !== "number") {
            throw new Error("Invalid question-set file: missing exportedAt");
        }
        const sets: unknown = obj["sets"];
        if (!Array.isArray(sets)) {
            throw new Error("Invalid question-set file: sets is not an array");
        }
        const setList: unknown[] = sets as unknown[];
        const validated: QuestionSet[] = [];
        for (const s of setList) {
            validated.push(this.validateSet(s));
        }
        return {version, exportedAt, sets: validated};
    }
    /** Validate a single question set object. `templateIds` and `tags` are deduplicated (preserving first-occurrence order) so the returned set honors the {@link QuestionSet} no-duplicates invariant. */
    private validateSet(s: unknown): QuestionSet {
        if (typeof s !== "object" || s === null) {
            throw new Error("Invalid question set: not an object");
        }
        const obj: Record<string, unknown> = s as Record<string, unknown>;
        const id: unknown = obj["id"];
        if (typeof id !== "string") {
            throw new Error("Invalid question set: missing id");
        }
        const name: unknown = obj["name"];
        if (typeof name !== "string") {
            throw new Error("Invalid question set: missing name");
        }
        const templateIds: unknown = obj["templateIds"];
        if (!Array.isArray(templateIds)) {
            throw new Error("Invalid question set: templateIds must be a string array");
        }
        const validTids: string[] = [];
        const seenTids: Set<string> = new Set();
        for (const t of templateIds as unknown[]) {
            if (typeof t !== "string") {
                throw new Error("Invalid question set: templateIds must be a string array");
            }
            if (!seenTids.has(t)) {
                seenTids.add(t);
                validTids.push(t);
            }
        }
        const tags: unknown = obj["tags"];
        const validTags: string[] = [];
        const seenTags: Set<string> = new Set();
        if (tags !== undefined) {
            if (!Array.isArray(tags)) {
                throw new Error("Invalid question set: tags must be a string array");
            }
            for (const t of tags as unknown[]) {
                if (typeof t !== "string") {
                    throw new Error("Invalid question set: tags must be a string array");
                }
                if (!seenTags.has(t)) {
                    seenTags.add(t);
                    validTags.push(t);
                }
            }
        }
        const createdAt: unknown = obj["createdAt"];
        if (typeof createdAt !== "number") {
            throw new Error("Invalid question set: missing createdAt");
        }
        const updatedAt: unknown = obj["updatedAt"];
        if (typeof updatedAt !== "number") {
            throw new Error("Invalid question set: missing updatedAt");
        }
        const description: unknown = obj["description"];
        const result: QuestionSet = {
            id,
            name,
            templateIds: validTids,
            tags: validTags,
            createdAt,
            updatedAt,
        };
        if (typeof description === "string") {
            result.description = description;
        }
        return result;
    }
    /** Return a deep copy of a question set. */
    private clone(s: QuestionSet): QuestionSet {
        return {id: s.id, name: s.name, description: s.description, templateIds: [...s.templateIds], tags: [...s.tags], createdAt: s.createdAt, updatedAt: s.updatedAt};
    }
}
