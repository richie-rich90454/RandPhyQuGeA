import {describe, it, expect} from "vitest";
import {Glossary} from "../reference/Glossary";
describe("Glossary", () => {
    const g = new Glossary();
    it("getAll returns at least 30 entries", () => {
        expect(g.getAll().length).toBeGreaterThanOrEqual(30);
    });
    it("get('Velocity') returns the velocity entry (case-insensitive)", () => {
        const v = g.get("velocity");
        expect(v?.term).toBe("Velocity");
        expect(v?.category).toBe("mechanics");
        expect(v?.latex).toBe("\\vec{v}");
    });
    it("get returns undefined for an unknown term", () => {
        expect(g.get("nope")).toBeUndefined();
    });
    it("getByCategory('waves') is non-empty and only waves", () => {
        const waves = g.getByCategory("waves");
        expect(waves.length).toBeGreaterThanOrEqual(3);
        for (const e of waves) {
            expect(e.category).toBe("waves");
        }
    });
    it("search('energy') returns entries whose term or definition contains energy", () => {
        const result = g.search("energy");
        expect(result.length).toBeGreaterThan(0);
        expect(result.map(e => e.term)).toContain("Energy");
    });
    it("entries may carry related terms", () => {
        const m = g.get("Momentum");
        expect(m?.related).toContain("Impulse");
    });
    it("accepts custom entries", () => {
        const custom = new Glossary([{term: "X", definition: "d", category: "c"}]);
        expect(custom.get("x")?.term).toBe("X");
        expect(custom.getAll().length).toBe(1);
    });
    it("every entry has a non-empty term, definition, and category", () => {
        for (const e of g.getAll()) {
            expect(e.term.length).toBeGreaterThan(0);
            expect(e.definition.length).toBeGreaterThan(0);
            expect(e.category.length).toBeGreaterThan(0);
        }
    });
});
