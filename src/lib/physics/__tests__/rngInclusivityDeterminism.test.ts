import {describe, it, expect} from "vitest";
import {UniformRandomGenerator, SeededRandomGenerator, SeededRandom} from "../random";
describe("RNG range inclusivity (task 5.21)", () => {
	describe("nextInt is inclusive of both endpoints", () => {
		let seededFactories: Array<[string, () => SeededRandomGenerator|SeededRandom]> = [
			["SeededRandomGenerator", () => new SeededRandomGenerator(42)],
			["SeededRandom", () => new SeededRandom(42)],
		];
		for (let [name, make] of seededFactories) {
			it(`${name}.nextInt(1, 10) stays within [1, 10] and reaches both 1 and 10`, () => {
				let rng = make();
				let seen = new Set<number>();
				for (let i = 0; i < 2000; i++) {
					let v = rng.nextInt(1, 10);
					expect(v).toBeGreaterThanOrEqual(1);
					expect(v).toBeLessThanOrEqual(10);
					seen.add(v);
				}
				expect(seen.has(1)).toBe(true);
				expect(seen.has(10)).toBe(true);
			});
			it(`${name}.nextInt(0, 1) reaches both 0 and 1 (binary reachability)`, () => {
				let rng = make();
				let seen = new Set<number>();
				for (let i = 0; i < 300; i++) {
					seen.add(rng.nextInt(0, 1));
				}
				expect(seen.has(0)).toBe(true);
				expect(seen.has(1)).toBe(true);
			});
		}
		it("UniformRandomGenerator.nextInt(1, 10) stays within [1, 10]", () => {
			let rng = new UniformRandomGenerator();
			for (let i = 0; i < 500; i++) {
				let v = rng.nextInt(1, 10);
				expect(v).toBeGreaterThanOrEqual(1);
				expect(v).toBeLessThanOrEqual(10);
			}
		});
	});
	describe("nextDouble is half-open [min, max)", () => {
		let seededFactories: Array<[string, () => SeededRandomGenerator|SeededRandom]> = [
			["SeededRandomGenerator", () => new SeededRandomGenerator(42)],
			["SeededRandom", () => new SeededRandom(42)],
		];
		for (let [name, make] of seededFactories) {
			it(`${name}.nextDouble(0, 10) stays within [0, 10) and never equals 10`, () => {
				let rng = make();
				let nearMax = false;
				for (let i = 0; i < 5000; i++) {
					let v = rng.nextDouble(0, 10);
					expect(v).toBeGreaterThanOrEqual(0);
					expect(v).toBeLessThan(10);
					if (v > 9.9) {
						nearMax = true;
					}
				}
				expect(nearMax).toBe(true);
			});
		}
		it("UniformRandomGenerator.nextDouble(0, 10) stays within [0, 10)", () => {
			let rng = new UniformRandomGenerator();
			for (let i = 0; i < 500; i++) {
				let v = rng.nextDouble(0, 10);
				expect(v).toBeGreaterThanOrEqual(0);
				expect(v).toBeLessThan(10);
			}
		});
	});
	describe("degenerate-range fallbacks return min", () => {
		let factories: Array<[string, () => SeededRandomGenerator|SeededRandom]> = [
			["SeededRandomGenerator", () => new SeededRandomGenerator(42)],
			["SeededRandom", () => new SeededRandom(42)],
		];
		for (let [name, make] of factories) {
			it(`${name}.nextInt(min, min) returns min`, () => {
				let rng = make();
				expect(rng.nextInt(7, 7)).toBe(7);
			});
			it(`${name}.nextDouble(min, min) returns min`, () => {
				let rng = make();
				expect(rng.nextDouble(7, 7)).toBe(7);
			});
		}
	});
});
describe("RNG seeding determinism (task 5.21)", () => {
	it("SeededRandom: same seed produces identical nextInt sequences", () => {
		let a = new SeededRandom(2024);
		let b = new SeededRandom(2024);
		let seqA: number[] = [];
		let seqB: number[] = [];
		for (let i = 0; i < 50; i++) {
			seqA.push(a.nextInt(0, 1000));
			seqB.push(b.nextInt(0, 1000));
		}
		expect(seqA).toEqual(seqB);
	});
	it("SeededRandom: seed 0 no longer collides with seed 0x9e3779b9", () => {
		let zero = new SeededRandom(0);
		let magic = new SeededRandom(0x9e3779b9);
		let seqZero: number[] = [];
		let seqMagic: number[] = [];
		for (let i = 0; i < 20; i++) {
			seqZero.push(zero.next());
			seqMagic.push(magic.next());
		}
		expect(seqZero).not.toEqual(seqMagic);
	});
	it("SeededRandom: seed 0 produces a non-degenerate, varied stream", () => {
		let rng = new SeededRandom(0);
		let seen = new Set<number>();
		for (let i = 0; i < 300; i++) {
			seen.add(rng.nextInt(0, 99));
		}
		expect(seen.size).toBeGreaterThan(10);
	});
	it("SeededRandom: 32 distinct seeds produce 32 distinct streams", () => {
		let keys = new Set<string>();
		for (let seed = 0; seed < 32; seed++) {
			let rng = new SeededRandom(seed);
			let key = [rng.next(), rng.next(), rng.next()].join(",");
			expect(keys.has(key)).toBe(false);
			keys.add(key);
		}
	});
	it("SeededRandomGenerator: same seed produces identical sequences", () => {
		let a = new SeededRandomGenerator(99);
		let b = new SeededRandomGenerator(99);
		let seqA = [a.next(), a.next(), a.next(), a.next(), a.next()];
		let seqB = [b.next(), b.next(), b.next(), b.next(), b.next()];
		expect(seqA).toEqual(seqB);
	});
	it("SeededRandomGenerator: seed 0 produces a non-degenerate, varied stream", () => {
		let rng = new SeededRandomGenerator(0);
		let seen = new Set<number>();
		for (let i = 0; i < 300; i++) {
			seen.add(rng.nextInt(0, 99));
		}
		expect(seen.size).toBeGreaterThan(10);
	});
});
