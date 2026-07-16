import {describe, it, expect} from "vitest";
import {Bookmarks} from "../history/Bookmarks";
describe("Bookmarks.add", () => {
	it("adds a bookmark with a note and timestamp", () => {
		const b = new Bookmarks();
		const entry = b.add("Q1", "tricky", 1000);
		expect(entry.questionId).toBe("Q1");
		expect(entry.note).toBe("tricky");
		expect(entry.createdAt).toBe(1000);
		expect(b.has("Q1")).toBe(true);
	});
	it("preserves insertion order", () => {
		const b = new Bookmarks();
		b.add("Q1", undefined, 1);
		b.add("Q2", undefined, 2);
		b.add("Q3", undefined, 3);
		const all = b.getAll();
		expect(all.map(e => e.questionId)).toEqual(["Q1", "Q2", "Q3"]);
	});
	it("does not duplicate a bookmark for the same question", () => {
		const b = new Bookmarks();
		b.add("Q1", "first", 1);
		b.add("Q1", "second", 2);
		expect(b.count()).toBe(1);
		expect(b.get("Q1")?.note).toBe("second");
		expect(b.get("Q1")?.createdAt).toBe(1);
	});
	it("does not overwrite the note when note is undefined", () => {
		const b = new Bookmarks();
		b.add("Q1", "keep", 1);
		b.add("Q1", undefined, 2);
		expect(b.get("Q1")?.note).toBe("keep");
	});
});
describe("Bookmarks.remove", () => {
	it("removes a bookmark and returns true", () => {
		const b = new Bookmarks();
		b.add("Q1");
		expect(b.remove("Q1")).toBe(true);
		expect(b.has("Q1")).toBe(false);
	});
	it("returns false for an unknown question", () => {
		const b = new Bookmarks();
		expect(b.remove("nope")).toBe(false);
	});
	it("preserves the order of remaining bookmarks", () => {
		const b = new Bookmarks();
		b.add("Q1", undefined, 1);
		b.add("Q2", undefined, 2);
		b.add("Q3", undefined, 3);
		b.remove("Q2");
		expect(b.getAll().map(e => e.questionId)).toEqual(["Q1", "Q3"]);
	});
});
describe("Bookmarks.updateNote", () => {
	it("updates the note on an existing bookmark", () => {
		const b = new Bookmarks();
		b.add("Q1", "old");
		expect(b.updateNote("Q1", "new")).toBe(true);
		expect(b.get("Q1")?.note).toBe("new");
	});
	it("clears the note when undefined is passed", () => {
		const b = new Bookmarks();
		b.add("Q1", "old");
		b.updateNote("Q1", undefined);
		expect(b.get("Q1")?.note).toBeUndefined();
	});
	it("returns false for an unknown bookmark", () => {
		const b = new Bookmarks();
		expect(b.updateNote("nope", "x")).toBe(false);
	});
});
describe("Bookmarks.toggle", () => {
	it("adds a bookmark when absent and returns true", () => {
		const b = new Bookmarks();
		expect(b.toggle("Q1", "note", 1)).toBe(true);
		expect(b.has("Q1")).toBe(true);
	});
	it("removes a bookmark when present and returns false", () => {
		const b = new Bookmarks();
		b.add("Q1", "note", 1);
		expect(b.toggle("Q1")).toBe(false);
		expect(b.has("Q1")).toBe(false);
	});
});
describe("Bookmarks.count / clear", () => {
	it("count reflects the number of bookmarks", () => {
		const b = new Bookmarks();
		b.add("Q1");
		b.add("Q2");
		expect(b.count()).toBe(2);
	});
	it("clear removes all bookmarks", () => {
		const b = new Bookmarks();
		b.add("Q1");
		b.add("Q2");
		b.clear();
		expect(b.count()).toBe(0);
		expect(b.getAll()).toEqual([]);
	});
});
