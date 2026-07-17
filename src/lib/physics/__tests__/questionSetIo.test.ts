import {describe, it, expect} from "vitest";
import {QuestionSetIo, QUESTION_SET_IO_VERSION} from "../questionset/QuestionSetIo";
import {type QuestionSet, QuestionSetStore} from "../questionset/QuestionSet";
function sampleSets(): QuestionSet[] {
    return [
        {id: "orig-1", name: "Kinematics", description: "basic", templateIds: ["T1", "T2"], tags: ["easy", "exam"], createdAt: 1000, updatedAt: 2000},
        {id: "orig-2", name: "Dynamics", templateIds: [], tags: [], createdAt: 3000, updatedAt: 3000},
    ];
}
describe("QuestionSetIo.exportSets", () => {
    it("produces valid JSON with version, exportedAt, and sets", () => {
        const io = new QuestionSetIo();
        const json = io.exportSets(sampleSets(), 5000);
        const parsed = JSON.parse(json);
        expect(parsed.version).toBe(QUESTION_SET_IO_VERSION);
        expect(parsed.exportedAt).toBe(5000);
        expect(parsed.sets.length).toBe(2);
    });
    it("deep-copies sets so later mutation does not affect the serialized output", () => {
        const io = new QuestionSetIo();
        const sets = sampleSets();
        const json = io.exportSets(sets, 1);
        sets[0]!.name = "MUTATED";
        const reparsed = JSON.parse(json);
        expect(reparsed.sets[0].name).toBe("Kinematics");
    });
    it("exports an empty array", () => {
        const io = new QuestionSetIo();
        const json = io.exportSets([], 1);
        const parsed = JSON.parse(json);
        expect(parsed.sets).toEqual([]);
    });
});
describe("QuestionSetIo.exportStore", () => {
    it("exports all sets from a store", () => {
        const io = new QuestionSetIo();
        const store = new QuestionSetStore();
        const qs = store.create("A", "desc", 1000);
        store.addTemplate(qs.id, "T1", 1000);
        store.addTag(qs.id, "easy", 1000);
        const json = io.exportStore(store, 2000);
        const parsed = JSON.parse(json);
        expect(parsed.sets.length).toBe(1);
        expect(parsed.sets[0].name).toBe("A");
        expect(parsed.sets[0].templateIds).toEqual(["T1"]);
        expect(parsed.sets[0].tags).toEqual(["easy"]);
    });
});
describe("QuestionSetIo round-trip", () => {
    it("round-trips sets preserving all fields including ids", () => {
        const io = new QuestionSetIo();
        const original = sampleSets();
        const json = io.exportSets(original, 9000);
        const imported = io.importSets(json);
        expect(imported).toEqual(original);
        expect(imported[0]?.id).toBe("orig-1");
        expect(imported[1]?.id).toBe("orig-2");
    });
    it("imported sets are independent copies", () => {
        const io = new QuestionSetIo();
        const json = io.exportSets(sampleSets(), 1);
        const imported = io.importSets(json);
        imported[0]!.name = "CHANGED";
        const reimported = io.importSets(json);
        expect(reimported[0]?.name).toBe("Kinematics");
    });
    it("round-trips a set without a description", () => {
        const io = new QuestionSetIo();
        const original: QuestionSet[] = [{id: "x", name: "N", templateIds: ["T1"], tags: [], createdAt: 1, updatedAt: 2}];
        const json = io.exportSets(original, 1);
        const imported = io.importSets(json);
        expect(imported[0]?.description).toBeUndefined();
    });
});
describe("QuestionSetIo.importInto", () => {
    it("creates new sets in the store with fresh ids", () => {
        const io = new QuestionSetIo();
        const store = new QuestionSetStore();
        const json = io.exportSets(sampleSets(), 1);
        const created = io.importInto(store, json, 5000);
        expect(store.count()).toBe(2);
        expect(created.length).toBe(2);
        expect(created[0]?.id).toBe("qs-1");
        expect(created[1]?.id).toBe("qs-2");
        expect(created[0]?.id).not.toBe("orig-1");
    });
    it("preserves name, description, templateIds, and tags", () => {
        const io = new QuestionSetIo();
        const store = new QuestionSetStore();
        const json = io.exportSets(sampleSets(), 1);
        const created = io.importInto(store, json, 5000);
        expect(created[0]?.name).toBe("Kinematics");
        expect(created[0]?.description).toBe("basic");
        expect(created[0]?.templateIds).toEqual(["T1", "T2"]);
        expect(created[0]?.tags).toEqual(["easy", "exam"]);
    });
    it("imports into a non-empty store without id collisions", () => {
        const io = new QuestionSetIo();
        const store = new QuestionSetStore();
        store.create("Existing", undefined, 100);
        const json = io.exportSets(sampleSets(), 1);
        const created = io.importInto(store, json, 2000);
        expect(store.count()).toBe(3);
        expect(created[0]?.id).toBe("qs-2");
        expect(created[1]?.id).toBe("qs-3");
    });
});
describe("QuestionSetIo.importSets errors", () => {
    it("throws on invalid JSON", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets("{not json")).toThrow(/JSON/);
    });
    it("throws when the payload is not an object", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets('"a string"')).toThrow("not an object");
    });
    it("throws when version is missing", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({exportedAt: 1, sets: []}))).toThrow("missing version");
    });
    it("throws when exportedAt is missing", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, sets: []}))).toThrow("missing exportedAt");
    });
    it("throws when sets is not an array", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: {}}))).toThrow("sets is not an array");
    });
    it("throws when a set is not an object", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: ["x"]}))).toThrow("not an object");
    });
    it("throws when a set is missing id", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: [{name: "A", templateIds: [], tags: [], createdAt: 1, updatedAt: 1}]}))).toThrow("missing id");
    });
    it("throws when a set is missing name", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", templateIds: [], tags: [], createdAt: 1, updatedAt: 1}]}))).toThrow("missing name");
    });
    it("throws when templateIds is not an array", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: "nope", tags: [], createdAt: 1, updatedAt: 1}]}))).toThrow(
            "templateIds must be a string array",
        );
    });
    it("throws when templateIds contains a non-string", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: ["T1", 5], tags: [], createdAt: 1, updatedAt: 1}]}))).toThrow(
            "templateIds must be a string array",
        );
    });
    it("throws when tags is not an array", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: [], tags: "nope", createdAt: 1, updatedAt: 1}]}))).toThrow(
            "tags must be a string array",
        );
    });
    it("throws when createdAt is missing", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: [], tags: [], updatedAt: 1}]}))).toThrow("missing createdAt");
    });
    it("throws when updatedAt is missing", () => {
        const io = new QuestionSetIo();
        expect(() => io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: [], tags: [], createdAt: 1}]}))).toThrow("missing updatedAt");
    });
    it("accepts a set without tags (defaults to empty)", () => {
        const io = new QuestionSetIo();
        const imported = io.importSets(JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: [], createdAt: 1, updatedAt: 1}]}));
        expect(imported[0]?.tags).toEqual([]);
    });
});
describe("QuestionSetIo no-duplicates invariant (task 5.58)", () => {
    it("deduplicates templateIds preserving first-occurrence order", () => {
        const io = new QuestionSetIo();
        const json = JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: ["T1", "T1", "T2", "T1", "T3", "T2"], tags: [], createdAt: 1, updatedAt: 1}]});
        const imported = io.importSets(json);
        expect(imported[0]?.templateIds).toEqual(["T1", "T2", "T3"]);
    });
    it("deduplicates tags preserving first-occurrence order", () => {
        const io = new QuestionSetIo();
        const json = JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: [], tags: ["easy", "easy", "exam", "easy", "hard", "exam"], createdAt: 1, updatedAt: 1}]});
        const imported = io.importSets(json);
        expect(imported[0]?.tags).toEqual(["easy", "exam", "hard"]);
    });
    it("deduplicates both templateIds and tags in the same set", () => {
        const io = new QuestionSetIo();
        const json = JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: ["T1", "T2", "T1"], tags: ["a", "b", "a"], createdAt: 1, updatedAt: 1}]});
        const imported = io.importSets(json);
        expect(imported[0]?.templateIds).toEqual(["T1", "T2"]);
        expect(imported[0]?.tags).toEqual(["a", "b"]);
    });
    it("preserves order when there are no duplicates", () => {
        const io = new QuestionSetIo();
        const json = JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: ["T3", "T1", "T2"], tags: ["z", "m", "a"], createdAt: 1, updatedAt: 1}]});
        const imported = io.importSets(json);
        expect(imported[0]?.templateIds).toEqual(["T3", "T1", "T2"]);
        expect(imported[0]?.tags).toEqual(["z", "m", "a"]);
    });
    it("leaves empty arrays empty (no duplicates possible)", () => {
        const io = new QuestionSetIo();
        const json = JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: [], tags: [], createdAt: 1, updatedAt: 1}]});
        const imported = io.importSets(json);
        expect(imported[0]?.templateIds).toEqual([]);
        expect(imported[0]?.tags).toEqual([]);
    });
    it("handles a single duplicated element collapsing to one entry", () => {
        const io = new QuestionSetIo();
        const json = JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: ["T1", "T1", "T1"], tags: ["only", "only", "only"], createdAt: 1, updatedAt: 1}]});
        const imported = io.importSets(json);
        expect(imported[0]?.templateIds).toEqual(["T1"]);
        expect(imported[0]?.tags).toEqual(["only"]);
    });
    it("importInto produces store sets that match the deduped import (no double-dedup needed)", () => {
        const io = new QuestionSetIo();
        const store = new QuestionSetStore();
        const json = JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: ["T1", "T1", "T2"], tags: ["easy", "easy", "exam"], createdAt: 1, updatedAt: 1}]});
        const created = io.importInto(store, json, 5000);
        expect(created[0]?.templateIds).toEqual(["T1", "T2"]);
        expect(created[0]?.tags).toEqual(["easy", "exam"]);
    });
    it("export -> import round-trip is idempotent for sets with duplicates in the raw input", () => {
        const io = new QuestionSetIo();
        const json = JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: ["T1", "T1", "T2"], tags: ["a", "a", "b"], createdAt: 1, updatedAt: 1}]});
        const first = io.importSets(json);
        const exported = io.exportSets(first, 1);
        const second = io.importSets(exported);
        expect(second).toEqual(first);
        expect(second[0]?.templateIds).toEqual(["T1", "T2"]);
        expect(second[0]?.tags).toEqual(["a", "b"]);
    });
});
describe("QuestionSetIo tags non-string element", () => {
    it("throws when tags is an array containing a non-string element", () => {
        const io = new QuestionSetIo();
        const json = JSON.stringify({version: 1, exportedAt: 1, sets: [{id: "x", name: "A", templateIds: [], tags: ["ok", 5], createdAt: 1, updatedAt: 1}]});
        expect(() => io.importSets(json)).toThrow("tags must be a string array");
    });
});
