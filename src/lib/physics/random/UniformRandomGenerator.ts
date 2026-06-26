import type {RandomGenerator} from '../contracts';
/** Entropy-based random generator backed by Math.random(). */
export class UniformRandomGenerator implements RandomGenerator {
	/** Returns a float in [0, 1). */
	public next(): number {
		return Math.random();
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
