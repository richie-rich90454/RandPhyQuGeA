import type {RandomGenerator} from '../contracts';
/** Seeded random generator using mulberry32 for reproducibility. */
export class SeededRandomGenerator implements RandomGenerator {
	private state: number;
	public constructor(seed: number) {
		this.state = seed >>> 0;
	}
	/** Advances the mulberry32 state and returns a float in [0, 1). */
	public next(): number {
		this.state |= 0;
		this.state = (this.state + 0x6d2b79f5) | 0;
		let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
			throw new Error('Cannot pick from an empty array');
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
