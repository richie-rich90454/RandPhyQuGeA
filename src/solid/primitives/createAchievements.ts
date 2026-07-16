import {createSignal, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
import {Achievements} from "../../lib/physics/gamification/Achievements";
import type {AchievementStats, AchievementDefinition} from "../../lib/physics/gamification/Achievements";
/** Options accepted by {@link createAchievements}. */
export interface CreateAchievementsOptions {
	/** Custom achievement catalog; defaults to {@link Achievements.defaultDefinitions}. */
	definitions?: AchievementDefinition[];
	/** Pre-seed the unlocked set with these ids (e.g. when restoring from persistence). */
	unlockedIds?: string[];
	/** Optional callback invoked once per `check` call with the newly-unlocked definitions. */
	onUnlock?: (newly: AchievementDefinition[]) => void;
}
/** Reactive state returned by {@link createAchievements}. */
export interface AchievementsState {
	/** Ids of all achievements unlocked so far (catalog order, fresh array on each unlock). */
	unlockedIds: Accessor<string[]>;
	/** Number of achievements unlocked so far. */
	count: Accessor<number>;
	/** Total number of achievements in the catalog. */
	total: Accessor<number>;
	/** Evaluate `stats` against all locked achievements; returns the newly-unlocked definitions (in catalog order) and fires the `onUnlock` callback. Idempotent: achievements already unlocked are never re-reported. */
	check: (stats: AchievementStats) => AchievementDefinition[];
	/** Return true when `id` has been unlocked. */
	isUnlocked: (id: string) => boolean;
	/** Manually mark `id` as unlocked (e.g. when restoring from persistence); returns true when `id` is a known definition. Updates the reactive `unlockedIds` accessor when the id is newly added. */
	markUnlocked: (id: string) => boolean;
	/** Forget all unlocked achievements and update the reactive accessor. */
	reset: () => void;
	/** Return the underlying {@link Achievements} instance (use sparingly; prefer the reactive accessors). */
	inner: () => Achievements;
}
/**
 * Solid primitive wrapping the pure-TS {@link Achievements} class.
 *
 * Exposes reactive `unlockedIds`/`count`/`total` accessors that update
 * whenever {@link AchievementsState.check} or `markUnlocked`/`reset` mutate the
 * underlying unlocked set, so any UI that subscribes to those accessors
 * re-renders automatically. The `check` method returns the newly-unlocked
 * definitions (in catalog order, idempotent across re-checks with the same
 * stats) and also invokes the optional `onUnlock` callback once per call so a
 * notification toast/portal can surface them without re-deriving the diff.
 */
export function createAchievements(options: CreateAchievementsOptions = {}): AchievementsState {
	let instance = new Achievements(options.definitions);
	for (let id of options.unlockedIds ?? []) {
		instance.markUnlocked(id);
	}
	let onUnlock = options.onUnlock;
	let [unlockedIds, setUnlockedIds] = createSignal<string[]>(instance.unlockedIds());
	let sync = () => {
		setUnlockedIds(instance.unlockedIds());
	};
	let check = (stats: AchievementStats): AchievementDefinition[] => {
		let newly = instance.check(stats);
		if (newly.length > 0) {
			sync();
			onUnlock?.(newly);
		}
		return newly;
	};
	let markUnlocked = (id: string): boolean => {
		let wasUnlocked = instance.isUnlocked(id);
		let ok = instance.markUnlocked(id);
		if (ok && !wasUnlocked) {
			sync();
		}
		return ok;
	};
	let reset = () => {
		instance.reset();
		sync();
	};
	onCleanup(() => {
		instance.reset();
	});
	return {
		unlockedIds,
		count: () => instance.count(),
		total: () => instance.total(),
		check,
		isUnlocked: id => instance.isUnlocked(id),
		markUnlocked,
		reset,
		inner: () => instance,
	};
}
