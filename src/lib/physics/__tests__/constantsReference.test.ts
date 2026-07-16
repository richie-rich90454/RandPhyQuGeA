import {describe, it, expect} from "vitest";
import {ConstantsReference} from "../reference/ConstantsReference";
describe("ConstantsReference", () => {
	const ref = new ConstantsReference();
	it("getAll returns at least 20 constants", () => {
		expect(ref.getAll().length).toBeGreaterThanOrEqual(20);
	});
	it("get('c') returns the speed of light", () => {
		const c = ref.get("c");
		expect(c?.name).toContain("Speed of light");
		expect(c?.value).toBe(299792458);
		expect(c?.units).toBe("m/s");
	});
	it("get('G') returns the gravitational constant", () => {
		const g = ref.get("G");
		expect(g?.value).toBeCloseTo(6.6743e-11, 30);
		expect(g?.category).toBe("universal");
	});
	it("get('h') returns the Planck constant with LaTeX", () => {
		const h = ref.get("h");
		expect(h?.value).toBeCloseTo(6.62607015e-34, 40);
		expect(h?.latex).toBe("h");
	});
	it("getByCategory('electromagnetic') is non-empty and only electromagnetic", () => {
		const em = ref.getByCategory("electromagnetic");
		expect(em.length).toBeGreaterThanOrEqual(3);
		for (const c of em) {
			expect(c.category).toBe("electromagnetic");
		}
	});
	it("search('mass') returns electron/proton/neutron masses", () => {
		const result = ref.search("mass");
		const symbols = result.map(c => c.symbol);
		expect(symbols).toContain("m_e");
		expect(symbols).toContain("m_p");
		expect(symbols).toContain("m_n");
	});
	it("search is case-insensitive on the symbol", () => {
		const result = ref.search("K_B");
		expect(result.map(c => c.symbol)).toContain("k_B");
	});
	it("get returns undefined for an unknown symbol", () => {
		expect(ref.get("nope")).toBeUndefined();
	});
	it("accepts custom constants", () => {
		const custom = new ConstantsReference([{symbol: "x", name: "custom", value: 1, units: "u", category: "test"}]);
		expect(custom.get("x")?.value).toBe(1);
		expect(custom.getAll().length).toBe(1);
	});
	it("every constant has a non-empty symbol, name, units (or empty for dimensionless), and category", () => {
		for (const c of ref.getAll()) {
			expect(c.symbol.length).toBeGreaterThan(0);
			expect(c.name.length).toBeGreaterThan(0);
			expect(c.category.length).toBeGreaterThan(0);
		}
	});
	it("register replaces an existing constant by symbol", () => {
		const custom = new ConstantsReference([{symbol: "x", name: "first", value: 1, units: "u", category: "t"}]);
		custom.register({symbol: "x", name: "second", value: 2, units: "u", category: "t"});
		expect(custom.get("x")?.value).toBe(2);
		expect(custom.getAll().length).toBe(1);
	});
});
