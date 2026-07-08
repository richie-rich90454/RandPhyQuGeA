/**
 * Custom question-set model.
 *
 * A question set is a named, ordered collection of template ids that a learner
 * or teacher curates for focused practice. The {@link QuestionSetStore} manages
 * creation, membership edits, tagging, and deletion. Pure-TS, no storage
 * dependencies.
 */
/** A curated, named collection of question template ids. */
export interface QuestionSet {
	/** Unique set id (auto-assigned as `qs-{counter}`). */
	id: string;
	/** Display name of the set. */
	name: string;
	/** Optional description. */
	description?: string;
	/** Ordered list of template ids in the set (no duplicates). */
	templateIds: string[];
	/** Tags for categorization (no duplicates). */
	tags: string[];
	/** Epoch milliseconds when the set was created. */
	createdAt: number;
	/** Epoch milliseconds when the set was last updated. */
	updatedAt: number;
}
/** Store managing question sets with insertion-order iteration. */
export class QuestionSetStore {
	private readonly entries: Map<string, QuestionSet>;
	private readonly order: string[];
	private counter: number;
	/** Construct an empty question-set store. */
	public constructor() {
		this.entries = new Map();
		this.order = [];
		this.counter = 0;
	}
	/** Create a new question set and return it. */
	public create(name: string, description?: string, now: number = Date.now()): QuestionSet {
		this.counter += 1;
		const id = `qs-${this.counter}`;
		const entry: QuestionSet = {id, name, description, templateIds: [], tags: [], createdAt: now, updatedAt: now};
		this.entries.set(id, entry);
		this.order.push(id);
		return entry;
	}
	/** Return the question set with `id`, or undefined. */
	public get(id: string): QuestionSet | undefined {
		return this.entries.get(id);
	}
	/** Return all question sets in insertion order. */
	public getAll(): QuestionSet[] {
		return this.order.map(id => this.entries.get(id)).filter((e): e is QuestionSet => e !== undefined);
	}
	/** Return the first set whose name matches `name` case-insensitively, or undefined. */
	public findByName(name: string): QuestionSet | undefined {
		const lower = name.toLowerCase();
		return this.getAll().find(e => e.name.toLowerCase() === lower);
	}
	/** Rename a set. Returns true when the set existed. */
	public rename(id: string, name: string, now: number = Date.now()): boolean {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return false;
		}
		entry.name = name;
		entry.updatedAt = now;
		return true;
	}
	/** Set or clear the description on a set. Returns true when the set existed. */
	public setDescription(id: string, description?: string, now: number = Date.now()): boolean {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return false;
		}
		entry.description = description;
		entry.updatedAt = now;
		return true;
	}
	/** Add a template id to a set (no duplicates). Returns the new size, or -1 when the set does not exist. */
	public addTemplate(id: string, templateId: string, now: number = Date.now()): number {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return -1;
		}
		if (!entry.templateIds.includes(templateId)) {
			entry.templateIds.push(templateId);
			entry.updatedAt = now;
		}
		return entry.templateIds.length;
	}
	/** Remove a template id from a set. Returns true when a template was removed. */
	public removeTemplate(id: string, templateId: string, now: number = Date.now()): boolean {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return false;
		}
		const idx = entry.templateIds.indexOf(templateId);
		if (idx < 0) {
			return false;
		}
		entry.templateIds.splice(idx, 1);
		entry.updatedAt = now;
		return true;
	}
	/** Return true when `templateId` is a member of the set. */
	public hasTemplate(id: string, templateId: string): boolean {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return false;
		}
		return entry.templateIds.includes(templateId);
	}
	/** Return a copy of the set's template ids (empty array when the set does not exist). */
	public templates(id: string): string[] {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return [];
		}
		return [...entry.templateIds];
	}
	/** Return the number of templates in a set (0 when the set does not exist). */
	public size(id: string): number {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return 0;
		}
		return entry.templateIds.length;
	}
	/** Replace the set's template ids with a deduped copy of `templateIds` (preserving first-occurrence order). Returns true when the set existed. */
	public setTemplates(id: string, templateIds: string[], now: number = Date.now()): boolean {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return false;
		}
		const seen = new Set<string>();
		const deduped: string[] = [];
		for (const tid of templateIds) {
			if (!seen.has(tid)) {
				seen.add(tid);
				deduped.push(tid);
			}
		}
		entry.templateIds = deduped;
		entry.updatedAt = now;
		return true;
	}
	/** Add a tag to a set (no duplicates). Returns true when the tag was added (false when the set is missing or the tag already exists). */
	public addTag(id: string, tag: string, now: number = Date.now()): boolean {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return false;
		}
		if (entry.tags.includes(tag)) {
			return false;
		}
		entry.tags.push(tag);
		entry.updatedAt = now;
		return true;
	}
	/** Remove a tag from a set. Returns true when a tag was removed. */
	public removeTag(id: string, tag: string, now: number = Date.now()): boolean {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return false;
		}
		const idx = entry.tags.indexOf(tag);
		if (idx < 0) {
			return false;
		}
		entry.tags.splice(idx, 1);
		entry.updatedAt = now;
		return true;
	}
	/** Return a copy of the set's tags (empty array when the set does not exist). */
	public tags(id: string): string[] {
		const entry = this.entries.get(id);
		if (entry === undefined) {
			return [];
		}
		return [...entry.tags];
	}
	/** Remove a question set. Returns true when a set was removed. */
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
	/** Return the number of question sets. */
	public count(): number {
		return this.entries.size;
	}
	/** Remove all question sets. */
	public clear(): void {
		this.entries.clear();
		this.order.length = 0;
	}
}
