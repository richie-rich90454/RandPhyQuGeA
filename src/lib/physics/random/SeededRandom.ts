import type {RandomGenerator} from "../contracts";
/** Seeded random generator using xorshift32 for reproducible distractor ordering. Distinct from {@link SeededRandomGenerator} (mulberry32); both satisfy {@link RandomGenerator}. The seed is passed through a 32-bit splitmix finalizer (a bijection on uint32) before seeding the xorshift state, so distinct seeds — including 0 — produce distinct streams rather than colliding on the magic fallback constant. */
export class SeededRandom implements RandomGenerator {
	private state: number;
	public constructor(seed: number) {
		let s = seed >>> 0;
		s ^= s >>> 16;
		s = Math.imul(s, 0x21f0aaad) >>> 0;
		s ^= s >>> 15;
		s = Math.imul(s, 0x735a2d97) >>> 0;
		s ^= s >>> 15;
		this.state = s || 0x9e3779b9;
	}
	/** Advances the xorshift32 state and returns a float in [0, 1). */
	public next(): number {
		let x = this.state;
		x ^= x << 13;
		x ^= x >>> 17;
		x ^= x << 5;
		this.state = x >>> 0;
		return this.state / 4294967296;
	}
	/** Returns an int in [min, max] inclusive. Returns min when min >= max. */
	public nextInt(min: number, max: number): number {
		if (min >= max) {
			return min;
		}
		return Math.floor(this.next() * (max - min + 1)) + min;
	}
	/** Returns a float in [min, max). Returns min when min >= max. */
	public nextDouble(min: number, max: number): number {
		if (min >= max) {
			return min;
		}
		return this.next() * (max - min) + min;
	}
	/** Picks a random element from a non-empty array. Throws on empty. */
	public pick<T>(items: T[]): T {
		if (items.length === 0) {
			throw new Error("Cannot pick from an empty array");
		}
		const idx = this.nextInt(0, items.length - 1);
		return items[idx] as T;
	}
	/** Shuffles an array in place (Fisher-Yates) and returns it. */
	public shuffle<T>(items: T[]): T[] {
		for (let i = items.length - 1; i > 0; i--) {
			const j = this.nextInt(0, i);
			const tmp = items[i] as T;
			items[i] = items[j] as T;
			items[j] = tmp;
		}
		return items;
	}
}
