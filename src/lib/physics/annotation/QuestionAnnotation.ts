/**
 * Question annotation model.
 *
 * Annotations are free-form metadata attached to a question: notes, tags,
 * difficulty ratings, flags, or labels. Multiple annotations may be attached
 * to a single question; each annotation has an auto-assigned id, a kind, a
 * string value, and creation/update timestamps. Pure-TS, no storage
 * dependencies.
 */
/** Kinds of annotations that can be attached to a question. */
export type AnnotationKind = "note" | "tag" | "rating" | "flag" | "label";
/** A single annotation attached to a question. */
export interface QuestionAnnotation {
    /** Unique annotation id (auto-assigned as `ann-{counter}`). */
    id: string;
    /** The question this annotation is attached to. */
    questionId: string;
    /** The annotation kind. */
    kind: AnnotationKind;
    /** The annotation value (note text, tag name, rating as a string, "true"/"false" for flags, label text). */
    value: string;
    /** Optional author/owner identifier. */
    author?: string;
    /** Epoch milliseconds when the annotation was created. */
    createdAt: number;
    /** Epoch milliseconds when the annotation was last updated. */
    updatedAt: number;
}
/** Store managing question annotations with insertion-order iteration. */
export class QuestionAnnotationStore {
    private readonly entries: Map<string, QuestionAnnotation>;
    private readonly order: string[];
    private counter: number;
    /** Construct an empty annotation store. */
    public constructor() {
        this.entries = new Map();
        this.order = [];
        this.counter = 0;
    }
    /** Add an annotation to `questionId`. Returns the stored annotation. */
    public add(questionId: string, kind: AnnotationKind, value: string, author?: string, now: number = Date.now()): QuestionAnnotation {
        this.counter += 1;
        const id = `ann-${this.counter}`;
        const entry: QuestionAnnotation = {id, questionId, kind, value, author, createdAt: now, updatedAt: now};
        this.entries.set(id, entry);
        this.order.push(id);
        return entry;
    }
    /** Return the annotation with `id`, or undefined. */
    public get(id: string): QuestionAnnotation | undefined {
        return this.entries.get(id);
    }
    /** Return true when an annotation with `id` exists. */
    public has(id: string): boolean {
        return this.entries.has(id);
    }
    /** Return all annotations for `questionId` in insertion order. */
    public getForQuestion(questionId: string): QuestionAnnotation[] {
        return this.order.map(id => this.entries.get(id)).filter((e): e is QuestionAnnotation => e !== undefined && e.questionId === questionId);
    }
    /** Return all annotations of `kind` in insertion order. */
    public getByKind(kind: AnnotationKind): QuestionAnnotation[] {
        return this.order.map(id => this.entries.get(id)).filter((e): e is QuestionAnnotation => e !== undefined && e.kind === kind);
    }
    /** Update the value of an annotation and refresh `updatedAt`. Returns true when the annotation existed. */
    public update(id: string, value: string, now: number = Date.now()): boolean {
        const entry = this.entries.get(id);
        if (entry === undefined) {
            return false;
        }
        entry.value = value;
        entry.updatedAt = now;
        return true;
    }
    /** Remove an annotation. Returns true when an annotation was removed. */
    public remove(id: string): boolean {
        const had = this.entries.delete(id);
        if (had) {
            const idx = this.order.indexOf(id);
            if (idx >= 0) {
                this.order.splice(idx, 1);
            }
        }
        return had;
    }
    /** Remove all annotations for `questionId`. Returns the number removed. */
    public removeForQuestion(questionId: string): number {
        const ids = this.getForQuestion(questionId).map(e => e.id);
        for (const id of ids) {
            this.remove(id);
        }
        return ids.length;
    }
    /** Return all annotations in insertion order. */
    public getAll(): QuestionAnnotation[] {
        return this.order.map(id => this.entries.get(id)).filter((e): e is QuestionAnnotation => e !== undefined);
    }
    /** Return the number of annotations. */
    public count(): number {
        return this.entries.size;
    }
    /** Return the tag values attached to `questionId` (annotations of kind "tag"), in insertion order. */
    public tags(questionId: string): string[] {
        return this.getForQuestion(questionId)
            .filter(e => e.kind === "tag")
            .map(e => e.value);
    }
    /** Return the average numeric rating for `questionId`, or undefined when there are no finite numeric ratings. */
    public rating(questionId: string): number | undefined {
        const ratings = this.getForQuestion(questionId).filter(e => e.kind === "rating");
        let sum = 0;
        let count = 0;
        for (const r of ratings) {
            const n = Number(r.value);
            if (Number.isFinite(n)) {
                sum += n;
                count += 1;
            }
        }
        return count === 0 ? undefined : sum / count;
    }
    /** Return true when `questionId` has at least one flag annotation whose value is "true". */
    public isFlagged(questionId: string): boolean {
        return this.getForQuestion(questionId).some(e => e.kind === "flag" && e.value === "true");
    }
    /** Remove all annotations. */
    public clear(): void {
        this.entries.clear();
        this.order.length = 0;
    }
}
