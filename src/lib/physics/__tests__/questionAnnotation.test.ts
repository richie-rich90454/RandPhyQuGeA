import {describe, it, expect} from "vitest";
import {QuestionAnnotationStore} from "../annotation/QuestionAnnotation";
describe("QuestionAnnotationStore.add", () => {
	it("creates an annotation with an auto-assigned id and timestamps", () => {
		const s = new QuestionAnnotationStore();
		const a = s.add("Q1", "note", "tricky one", undefined, 1000);
		expect(a.id).toBe("ann-1");
		expect(a.questionId).toBe("Q1");
		expect(a.kind).toBe("note");
		expect(a.value).toBe("tricky one");
		expect(a.author).toBeUndefined();
		expect(a.createdAt).toBe(1000);
		expect(a.updatedAt).toBe(1000);
	});
	it("assigns unique incrementing ids", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "a");
		s.add("Q1", "tag", "b");
		s.add("Q2", "note", "c");
		expect(s.count()).toBe(3);
		const all = s.getAll();
		expect(all.map(e => e.id)).toEqual(["ann-1", "ann-2", "ann-3"]);
	});
	it("stores an optional author", () => {
		const s = new QuestionAnnotationStore();
		const a = s.add("Q1", "note", "hi", "teacher1", 5);
		expect(a.author).toBe("teacher1");
	});
});
describe("QuestionAnnotationStore.get / has", () => {
	it("returns the annotation by id", () => {
		const s = new QuestionAnnotationStore();
		const a = s.add("Q1", "note", "x");
		expect(s.get(a.id)).toBe(a);
		expect(s.has(a.id)).toBe(true);
	});
	it("returns undefined for an unknown id", () => {
		const s = new QuestionAnnotationStore();
		expect(s.get("nope")).toBeUndefined();
		expect(s.has("nope")).toBe(false);
	});
});
describe("QuestionAnnotationStore.getForQuestion", () => {
	it("returns annotations for a question in insertion order", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "a");
		s.add("Q2", "note", "b");
		s.add("Q1", "tag", "t1");
		const q1 = s.getForQuestion("Q1");
		expect(q1.length).toBe(2);
		expect(q1.map(e => e.value)).toEqual(["a", "t1"]);
	});
	it("returns an empty array for a question with no annotations", () => {
		const s = new QuestionAnnotationStore();
		expect(s.getForQuestion("Q9")).toEqual([]);
	});
});
describe("QuestionAnnotationStore.getByKind", () => {
	it("returns annotations of a given kind across all questions", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "tag", "t1");
		s.add("Q1", "note", "n1");
		s.add("Q2", "tag", "t2");
		const tags = s.getByKind("tag");
		expect(tags.map(e => e.value)).toEqual(["t1", "t2"]);
	});
});
describe("QuestionAnnotationStore.update", () => {
	it("updates the value and updatedAt timestamp", () => {
		const s = new QuestionAnnotationStore();
		const a = s.add("Q1", "note", "old", undefined, 1000);
		expect(s.update(a.id, "new", 2000)).toBe(true);
		const updated = s.get(a.id);
		expect(updated?.value).toBe("new");
		expect(updated?.updatedAt).toBe(2000);
		expect(updated?.createdAt).toBe(1000);
	});
	it("returns false for an unknown id", () => {
		const s = new QuestionAnnotationStore();
		expect(s.update("nope", "x")).toBe(false);
	});
});
describe("QuestionAnnotationStore.remove", () => {
	it("removes an annotation and returns true", () => {
		const s = new QuestionAnnotationStore();
		const a = s.add("Q1", "note", "x");
		expect(s.remove(a.id)).toBe(true);
		expect(s.has(a.id)).toBe(false);
	});
	it("returns false for an unknown id", () => {
		const s = new QuestionAnnotationStore();
		expect(s.remove("nope")).toBe(false);
	});
	it("preserves the order of remaining annotations", () => {
		const s = new QuestionAnnotationStore();
		const a = s.add("Q1", "note", "a");
		s.add("Q1", "note", "b");
		s.add("Q1", "note", "c");
		s.remove(a.id);
		expect(s.getAll().map(e => e.id)).toEqual(["ann-2", "ann-3"]);
	});
});
describe("QuestionAnnotationStore.removeForQuestion", () => {
	it("removes all annotations for a question and returns the count", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "a");
		s.add("Q1", "tag", "t");
		s.add("Q2", "note", "b");
		expect(s.removeForQuestion("Q1")).toBe(2);
		expect(s.getForQuestion("Q1")).toEqual([]);
		expect(s.count()).toBe(1);
	});
	it("returns 0 for a question with no annotations", () => {
		const s = new QuestionAnnotationStore();
		expect(s.removeForQuestion("Q9")).toBe(0);
	});
});
describe("QuestionAnnotationStore.getAll / count", () => {
	it("returns all annotations in insertion order", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "a");
		s.add("Q2", "note", "b");
		expect(s.getAll().map(e => e.value)).toEqual(["a", "b"]);
		expect(s.count()).toBe(2);
	});
});
describe("QuestionAnnotationStore.tags", () => {
	it("returns tag values for a question in insertion order", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "n");
		s.add("Q1", "tag", "kinematics");
		s.add("Q1", "tag", "vectors");
		expect(s.tags("Q1")).toEqual(["kinematics", "vectors"]);
	});
	it("returns an empty array when there are no tags", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "n");
		expect(s.tags("Q1")).toEqual([]);
	});
});
describe("QuestionAnnotationStore.rating", () => {
	it("returns the average of numeric ratings", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "rating", "4");
		s.add("Q1", "rating", "5");
		s.add("Q1", "rating", "3");
		expect(s.rating("Q1")).toBe(4);
	});
	it("returns undefined when there are no ratings", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "n");
		expect(s.rating("Q1")).toBeUndefined();
	});
	it("ignores non-finite numeric values", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "rating", "4");
		s.add("Q1", "rating", "not-a-number");
		s.add("Q1", "rating", "6");
		expect(s.rating("Q1")).toBe(5);
	});
});
describe("QuestionAnnotationStore.isFlagged", () => {
	it("returns true when a flag annotation has value true", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "flag", "true");
		expect(s.isFlagged("Q1")).toBe(true);
	});
	it("returns false when a flag annotation has value false", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "flag", "false");
		expect(s.isFlagged("Q1")).toBe(false);
	});
	it("returns false when there are no flag annotations", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "n");
		expect(s.isFlagged("Q1")).toBe(false);
	});
});
describe("QuestionAnnotationStore.clear", () => {
	it("removes all annotations", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "a");
		s.add("Q2", "note", "b");
		s.clear();
		expect(s.count()).toBe(0);
		expect(s.getAll()).toEqual([]);
	});
	it("allows adding annotations again with continued ids", () => {
		const s = new QuestionAnnotationStore();
		s.add("Q1", "note", "a");
		s.clear();
		const a = s.add("Q1", "note", "b");
		expect(a.id).toBe("ann-2");
	});
});
