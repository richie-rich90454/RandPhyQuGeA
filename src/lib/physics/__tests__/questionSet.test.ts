import {describe, it, expect} from "vitest";
import {QuestionSetStore} from "../questionset/QuestionSet";
describe("QuestionSetStore.create", () => {
    it("creates a set with an auto-assigned id and timestamps", () => {
        const s = new QuestionSetStore();
        const qs = s.create("Kinematics Drill", "basic practice", 1000);
        expect(qs.id).toBe("qs-1");
        expect(qs.name).toBe("Kinematics Drill");
        expect(qs.description).toBe("basic practice");
        expect(qs.templateIds).toEqual([]);
        expect(qs.tags).toEqual([]);
        expect(qs.createdAt).toBe(1000);
        expect(qs.updatedAt).toBe(1000);
    });
    it("assigns unique incrementing ids", () => {
        const s = new QuestionSetStore();
        s.create("A");
        s.create("B");
        const all = s.getAll();
        expect(all.map(e => e.id)).toEqual(["qs-1", "qs-2"]);
    });
    it("creates a set without a description", () => {
        const s = new QuestionSetStore();
        const qs = s.create("No Desc");
        expect(qs.description).toBeUndefined();
    });
});
describe("QuestionSetStore.get / getAll", () => {
    it("returns a set by id", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        expect(s.get(qs.id)).toBe(qs);
    });
    it("returns undefined for an unknown id", () => {
        const s = new QuestionSetStore();
        expect(s.get("nope")).toBeUndefined();
    });
    it("returns all sets in insertion order", () => {
        const s = new QuestionSetStore();
        s.create("A");
        s.create("B");
        expect(s.getAll().map(e => e.name)).toEqual(["A", "B"]);
    });
});
describe("QuestionSetStore.findByName", () => {
    it("finds a set case-insensitively", () => {
        const s = new QuestionSetStore();
        s.create("Kinematics");
        expect(s.findByName("kinematics")?.name).toBe("Kinematics");
        expect(s.findByName("KINEMATICS")?.name).toBe("Kinematics");
    });
    it("returns undefined when no set matches", () => {
        const s = new QuestionSetStore();
        expect(s.findByName("missing")).toBeUndefined();
    });
});
describe("QuestionSetStore.rename / setDescription", () => {
    it("renames a set and updates updatedAt", () => {
        const s = new QuestionSetStore();
        const qs = s.create("Old", undefined, 1000);
        expect(s.rename(qs.id, "New", 2000)).toBe(true);
        expect(s.get(qs.id)?.name).toBe("New");
        expect(s.get(qs.id)?.updatedAt).toBe(2000);
    });
    it("returns false when renaming an unknown set", () => {
        const s = new QuestionSetStore();
        expect(s.rename("nope", "x")).toBe(false);
    });
    it("sets and clears the description", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        s.setDescription(qs.id, "desc", 1);
        expect(s.get(qs.id)?.description).toBe("desc");
        s.setDescription(qs.id, undefined, 2);
        expect(s.get(qs.id)?.description).toBeUndefined();
    });
});
describe("QuestionSetStore.addTemplate / removeTemplate / hasTemplate", () => {
    it("adds template ids and returns the new size", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        expect(s.addTemplate(qs.id, "T1", 1)).toBe(1);
        expect(s.addTemplate(qs.id, "T2", 2)).toBe(2);
        expect(s.hasTemplate(qs.id, "T1")).toBe(true);
        expect(s.hasTemplate(qs.id, "T3")).toBe(false);
    });
    it("does not duplicate a template id", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        s.addTemplate(qs.id, "T1");
        expect(s.addTemplate(qs.id, "T1")).toBe(1);
        expect(s.size(qs.id)).toBe(1);
    });
    it("returns -1 when adding to an unknown set", () => {
        const s = new QuestionSetStore();
        expect(s.addTemplate("nope", "T1")).toBe(-1);
    });
    it("removes a template id and returns true", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        s.addTemplate(qs.id, "T1");
        s.addTemplate(qs.id, "T2");
        expect(s.removeTemplate(qs.id, "T1")).toBe(true);
        expect(s.hasTemplate(qs.id, "T1")).toBe(false);
        expect(s.size(qs.id)).toBe(1);
    });
    it("returns false when removing an absent template id", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        expect(s.removeTemplate(qs.id, "T9")).toBe(false);
    });
    it("returns false when removing from an unknown set", () => {
        const s = new QuestionSetStore();
        expect(s.removeTemplate("nope", "T1")).toBe(false);
    });
    it("preserves insertion order of template ids", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        s.addTemplate(qs.id, "T3");
        s.addTemplate(qs.id, "T1");
        s.addTemplate(qs.id, "T2");
        expect(s.templates(qs.id)).toEqual(["T3", "T1", "T2"]);
    });
});
describe("QuestionSetStore.templates / size", () => {
    it("returns an empty array for an unknown set", () => {
        const s = new QuestionSetStore();
        expect(s.templates("nope")).toEqual([]);
        expect(s.size("nope")).toBe(0);
    });
    it("returns a copy that does not mutate the store", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        s.addTemplate(qs.id, "T1");
        const copy = s.templates(qs.id);
        copy.push("T9");
        expect(s.templates(qs.id)).toEqual(["T1"]);
    });
});
describe("QuestionSetStore.setTemplates", () => {
    it("replaces the template list with a deduped copy", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        s.setTemplates(qs.id, ["T1", "T2", "T1", "T3", "T2"]);
        expect(s.templates(qs.id)).toEqual(["T1", "T2", "T3"]);
    });
    it("returns false for an unknown set", () => {
        const s = new QuestionSetStore();
        expect(s.setTemplates("nope", ["T1"])).toBe(false);
    });
    it("updates updatedAt", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A", undefined, 1000);
        s.setTemplates(qs.id, ["T1"], 2000);
        expect(s.get(qs.id)?.updatedAt).toBe(2000);
    });
});
describe("QuestionSetStore.addTag / removeTag / tags", () => {
    it("adds tags without duplicates", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        expect(s.addTag(qs.id, "easy")).toBe(true);
        expect(s.addTag(qs.id, "exam")).toBe(true);
        expect(s.addTag(qs.id, "easy")).toBe(false);
        expect(s.tags(qs.id)).toEqual(["easy", "exam"]);
    });
    it("removes a tag", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        s.addTag(qs.id, "easy");
        s.addTag(qs.id, "exam");
        expect(s.removeTag(qs.id, "easy")).toBe(true);
        expect(s.tags(qs.id)).toEqual(["exam"]);
    });
    it("returns false when removing an absent tag", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        expect(s.removeTag(qs.id, "nope")).toBe(false);
    });
    it("returns false for an unknown set", () => {
        const s = new QuestionSetStore();
        expect(s.addTag("nope", "t")).toBe(false);
        expect(s.removeTag("nope", "t")).toBe(false);
        expect(s.tags("nope")).toEqual([]);
    });
    it("returns a copy that does not mutate the store", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        s.addTag(qs.id, "t1");
        const copy = s.tags(qs.id);
        copy.push("t9");
        expect(s.tags(qs.id)).toEqual(["t1"]);
    });
});
describe("QuestionSetStore.remove / count / clear", () => {
    it("removes a set and returns true", () => {
        const s = new QuestionSetStore();
        const qs = s.create("A");
        expect(s.remove(qs.id)).toBe(true);
        expect(s.get(qs.id)).toBeUndefined();
        expect(s.count()).toBe(0);
    });
    it("returns false when removing an unknown set", () => {
        const s = new QuestionSetStore();
        expect(s.remove("nope")).toBe(false);
    });
    it("count reflects the number of sets", () => {
        const s = new QuestionSetStore();
        s.create("A");
        s.create("B");
        expect(s.count()).toBe(2);
    });
    it("clear removes all sets", () => {
        const s = new QuestionSetStore();
        s.create("A");
        s.create("B");
        s.clear();
        expect(s.count()).toBe(0);
        expect(s.getAll()).toEqual([]);
    });
    it("clear allows creating sets again with continued ids", () => {
        const s = new QuestionSetStore();
        s.create("A");
        s.clear();
        const qs = s.create("B");
        expect(qs.id).toBe("qs-2");
    });
});
