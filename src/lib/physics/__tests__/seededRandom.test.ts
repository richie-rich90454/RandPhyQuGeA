import {describe, it, expect} from "vitest";
import {SeededRandom} from "../random/SeededRandom";
import type {RandomGenerator} from "../contracts";
describe("SeededRandom", () => {
	describe("determinism", () => {
		it("produces identical next() sequences for the same seed", () => {
			const a = new SeededRandom(42);
			const b = new SeededRandom(42);
			const seqA = [a.next(), a.next(), a.next(), a.next(), a.next()];
			const seqB = [b.next(), b.next(), b.next(), b.next(), b.next()];
			expect(seqA).toEqual(seqB);
		});
		it("produces identical nextInt sequences for the same seed", () => {
			const a = new SeededRandom(123);
			const b = new SeededRandom(123);
			const seqA: number[] = [];
			const seqB: number[] = [];
			for (let i = 0; i < 20; i++) {
				seqA.push(a.nextInt(1, 100));
				seqB.push(b.nextInt(1, 100));
			}
			expect(seqA).toEqual(seqB);
		});
		it("produces identical shuffle results for the same seed", () => {
			const a = new SeededRandom(7);
			const b = new SeededRandom(7);
			const itemsA = [1, 2, 3, 4, 5, 6, 7, 8];
			const itemsB = [1, 2, 3, 4, 5, 6, 7, 8];
			expect(a.shuffle(itemsA)).toEqual(b.shuffle(itemsB));
		});
	});
	describe("seed divergence", () => {
		it("produces different sequences for two different seeds", () => {
			const a = new SeededRandom(1);
			const b = new SeededRandom(2);
			const seqA = [a.next(), a.next(), a.next(), a.next(), a.next()];
			const seqB = [b.next(), b.next(), b.next(), b.next(), b.next()];
			expect(seqA).not.toEqual(seqB);
		});
		it("produces divergent nextInt streams across many seeds", () => {
			const seen = new Set<string>();
			for (let seed = 1; seed <= 10; seed++) {
				const rng = new SeededRandom(seed);
				const key = [rng.nextInt(0, 99), rng.nextInt(0, 99), rng.nextInt(0, 99)].join(",");
				expect(seen.has(key)).toBe(false);
				seen.add(key);
			}
		});
	});
	describe("range invariants", () => {
		it("generates ints within [1,10] over 100 iterations", () => {
			const rng = new SeededRandom(99);
			for (let i = 0; i < 100; i++) {
				const v = rng.nextInt(1, 10);
				expect(v).toBeGreaterThanOrEqual(1);
				expect(v).toBeLessThanOrEqual(10);
			}
		});
		it("generates doubles within [0,10) over 100 iterations", () => {
			const rng = new SeededRandom(99);
			for (let i = 0; i < 100; i++) {
				const v = rng.nextDouble(0, 10);
				expect(v).toBeGreaterThanOrEqual(0);
				expect(v).toBeLessThan(10);
			}
		});
		it("returns min when min>=max for nextInt/nextDouble", () => {
			const rng = new SeededRandom(5);
			expect(rng.nextInt(5, 5)).toBe(5);
			expect(rng.nextInt(10, 5)).toBe(10);
			expect(rng.nextDouble(5, 5)).toBe(5);
			expect(rng.nextDouble(10, 5)).toBe(10);
		});
		it("picks an element from a non-empty array and throws on empty", () => {
			const rng = new SeededRandom(5);
			const items = ["a", "b", "c"];
			expect(items).toContain(rng.pick(items));
			expect(() => rng.pick([])).toThrow("Cannot pick from an empty array");
		});
		it("shuffle preserves the element set", () => {
			const rng = new SeededRandom(5);
			const items = [1, 2, 3, 4, 5];
			const shuffled = rng.shuffle([...items]);
			expect(shuffled.sort()).toEqual(items);
		});
	});
	describe("RandomGenerator contract", () => {
		it("satisfies the RandomGenerator interface", () => {
			const rng: RandomGenerator = new SeededRandom(1);
			expect(typeof rng.next).toBe("function");
			expect(typeof rng.nextInt).toBe("function");
			expect(typeof rng.nextDouble).toBe("function");
			expect(typeof rng.pick).toBe("function");
			expect(typeof rng.shuffle).toBe("function");
		});
	});
});
