import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import type {JSX} from "solid-js";
import {createBookmarks} from "../createBookmarks";
import type {BookmarksState} from "../createBookmarks";
import type {BookmarkEntry} from "../../../lib/physics/history/Bookmarks";
function makeEntry(overrides: Partial<BookmarkEntry> = {}): BookmarkEntry {
	return {
		questionId: "Q1",
		note: "tricky",
		createdAt: 1000,
		...overrides,
	};
}
let state: BookmarksState | null = null;
function makeRoot(options?: Parameters<typeof createBookmarks>[0]): () => JSX.Element {
	return () => {
		state = createBookmarks(options);
		return <div>bookmarks</div>;
	};
}
beforeEach(() => {
	state = null;
});
describe("createBookmarks default state (task 5.73)", () => {
	it("starts empty with count 0", () => {
		render(makeRoot());
		expect(state!.entries()).toEqual([]);
		expect(state!.count()).toBe(0);
	});
	it("has returns false for any id before any add", () => {
		render(makeRoot());
		expect(state!.has("Q1")).toBe(false);
	});
	it("get returns undefined for an unknown id", () => {
		render(makeRoot());
		expect(state!.get("nope")).toBeUndefined();
	});
});
describe("createBookmarks CRUD reactivity (task 5.73)", () => {
	it("add appends a bookmark and updates entries/count accessors", () => {
		render(makeRoot());
		let entry = state!.add("Q1", "note");
		expect(entry.questionId).toBe("Q1");
		expect(state!.count()).toBe(1);
		expect(state!.entries()).toEqual([entry]);
		expect(state!.has("Q1")).toBe(true);
	});
	it("add fires onAdd callback with the new entry", () => {
		let onAdd = vi.fn<(entry: BookmarkEntry) => void>();
		render(makeRoot({onAdd}));
		state!.add("Q1", "note");
		expect(onAdd).toHaveBeenCalledTimes(1);
		expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({questionId: "Q1", note: "note"}));
	});
	it("remove deletes a bookmark and updates accessors", () => {
		render(makeRoot());
		state!.add("Q1");
		expect(state!.remove("Q1")).toBe(true);
		expect(state!.count()).toBe(0);
		expect(state!.entries()).toEqual([]);
		expect(state!.has("Q1")).toBe(false);
	});
	it("remove fires onRemove callback only when a bookmark was actually removed", () => {
		let onRemove = vi.fn<(questionId: string) => void>();
		render(makeRoot({onRemove}));
		state!.add("Q1");
		state!.remove("nope");
		expect(onRemove).not.toHaveBeenCalled();
		state!.remove("Q1");
		expect(onRemove).toHaveBeenCalledTimes(1);
		expect(onRemove).toHaveBeenCalledWith("Q1");
	});
	it("updateNote mutates and re-renders subscribers", () => {
		render(makeRoot());
		state!.add("Q1", "old");
		expect(state!.updateNote("Q1", "new")).toBe(true);
		expect(state!.get("Q1")?.note).toBe("new");
		expect(state!.entries()[0]?.note).toBe("new");
	});
	it("updateNote returns false for an unknown bookmark and does not mutate", () => {
		render(makeRoot());
		expect(state!.updateNote("nope", "x")).toBe(false);
		expect(state!.count()).toBe(0);
	});
	it("toggle adds when absent and removes when present, firing onAdd/onRemove", () => {
		let onAdd = vi.fn<(entry: BookmarkEntry) => void>();
		let onRemove = vi.fn<(questionId: string) => void>();
		render(makeRoot({onAdd, onRemove}));
		expect(state!.toggle("Q1", "note")).toBe(true);
		expect(state!.count()).toBe(1);
		expect(onAdd).toHaveBeenCalledTimes(1);
		expect(state!.toggle("Q1")).toBe(false);
		expect(state!.count()).toBe(0);
		expect(onRemove).toHaveBeenCalledTimes(1);
	});
	it("clear empties all bookmarks and updates accessors", () => {
		render(makeRoot());
		state!.add("Q1");
		state!.add("Q2");
		state!.clear();
		expect(state!.count()).toBe(0);
		expect(state!.entries()).toEqual([]);
	});
	it("preserves insertion order across operations", () => {
		render(makeRoot());
		state!.add("Q1", undefined);
		state!.add("Q2", undefined);
		state!.add("Q3", undefined);
		state!.remove("Q2");
		expect(state!.entries().map(e => e.questionId)).toEqual(["Q1", "Q3"]);
	});
});
describe("createBookmarks pre-seeding (task 5.73)", () => {
	it("pre-seeds entries from options", () => {
		render(makeRoot({entries: [makeEntry({questionId: "Q1"}), makeEntry({questionId: "Q2", note: undefined, createdAt: 2})]}));
		expect(state!.count()).toBe(2);
		expect(state!.entries().map(e => e.questionId)).toEqual(["Q1", "Q2"]);
	});
	it("pre-seeded entries are observable via has/get", () => {
		render(makeRoot({entries: [makeEntry({questionId: "Q1", note: "seed"})]}));
		expect(state!.has("Q1")).toBe(true);
		expect(state!.get("Q1")?.note).toBe("seed");
	});
});
describe("createBookmarks re-attempt (task 5.73)", () => {
	it("reattempt fires onReattempt and returns true when the bookmark exists", () => {
		let onReattempt = vi.fn<(questionId: string) => void>();
		render(makeRoot({onReattempt}));
		state!.add("Q1");
		expect(state!.reattempt("Q1")).toBe(true);
		expect(onReattempt).toHaveBeenCalledTimes(1);
		expect(onReattempt).toHaveBeenCalledWith("Q1");
	});
	it("reattempt returns false and does not fire onReattempt when the bookmark is absent", () => {
		let onReattempt = vi.fn<(questionId: string) => void>();
		render(makeRoot({onReattempt}));
		expect(state!.reattempt("nope")).toBe(false);
		expect(onReattempt).not.toHaveBeenCalled();
	});
	it("reattempt still works after remove (re-adding then reattempting)", () => {
		let onReattempt = vi.fn<(questionId: string) => void>();
		render(makeRoot({onReattempt}));
		state!.add("Q1");
		state!.remove("Q1");
		expect(state!.reattempt("Q1")).toBe(false);
		state!.add("Q1");
		expect(state!.reattempt("Q1")).toBe(true);
		expect(onReattempt).toHaveBeenCalledTimes(1);
	});
});
describe("createBookmarks inner + cleanup (task 5.73)", () => {
	it("exposes the underlying Bookmarks instance", () => {
		render(makeRoot());
		let inner = state!.inner();
		expect(inner.count()).toBe(state!.count());
	});
	it("resets the underlying instance on disposal", () => {
		let rendered = render(makeRoot());
		state!.add("Q1");
		expect(state!.inner().count()).toBe(1);
		rendered.unmount();
		expect(state!.inner().count()).toBe(0);
	});
});
