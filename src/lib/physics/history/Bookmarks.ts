/**
 * Bookmarks store.
 *
 * Tracks bookmarked question ids with an optional note and a timestamp.
 * Bookmarks are kept in insertion order and deduplicated by question id.
 * Pure-TS, no storage dependencies.
 */
export interface BookmarkEntry {
	/** The bookmarked question id. */
	questionId: string;
	/** Optional user note attached to the bookmark. */
	note?: string;
	/** Epoch milliseconds when the bookmark was created. */
	createdAt: number;
}
/** Insertion-ordered, deduplicated store of bookmarked question ids with optional notes. */
export class Bookmarks {
	private readonly entries: Map<string, BookmarkEntry>;
	private readonly order: string[];
	/** Construct an empty bookmarks store. */
	public constructor() {
		this.entries = new Map();
		this.order = [];
	}
	/** Add a bookmark for `questionId` with an optional note. Overwrites a prior bookmark's note but keeps the original createdAt. Returns the stored entry. */
	public add(questionId: string, note?: string, now: number = Date.now()): BookmarkEntry {
		const existing = this.entries.get(questionId);
		if (existing !== undefined) {
			if (note !== undefined) {
				existing.note = note;
			}
			return existing;
		}
		const entry: BookmarkEntry = {questionId, note, createdAt: now};
		this.entries.set(questionId, entry);
		this.order.push(questionId);
		return entry;
	}
	/** Remove a bookmark. Returns true when a bookmark was removed. */
	public remove(questionId: string): boolean {
		const had = this.entries.delete(questionId);
		if (had) {
			const idx = this.order.indexOf(questionId);
			if (idx >= 0) {
				this.order.splice(idx, 1);
			}
		}
		return had;
	}
	/** Return true when `questionId` is bookmarked. */
	public has(questionId: string): boolean {
		return this.entries.has(questionId);
	}
	/** Return the bookmark entry for `questionId`, or undefined. */
	public get(questionId: string): BookmarkEntry | undefined {
		return this.entries.get(questionId);
	}
	/** Return all bookmarks in insertion order. */
	public getAll(): BookmarkEntry[] {
		return this.order.map(id => this.entries.get(id)).filter((e): e is BookmarkEntry => e !== undefined);
	}
	/** Update or clear the note on an existing bookmark. Returns true when the bookmark existed. */
	public updateNote(questionId: string, note?: string): boolean {
		const entry = this.entries.get(questionId);
		if (entry === undefined) {
			return false;
		}
		entry.note = note;
		return true;
	}
	/** Toggle a bookmark on or off. Returns the new state (true = bookmarked). */
	public toggle(questionId: string, note?: string, now: number = Date.now()): boolean {
		if (this.has(questionId)) {
			this.remove(questionId);
			return false;
		}
		this.add(questionId, note, now);
		return true;
	}
	/** Return the number of bookmarks. */
	public count(): number {
		return this.entries.size;
	}
	/** Remove all bookmarks. */
	public clear(): void {
		this.entries.clear();
		this.order.length = 0;
	}
}
