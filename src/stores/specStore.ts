/**
 * Parsed specification store.
 *
 * Loads the bundled default specification once on app startup, parses it via
 * the {@link PhysicsCore} facade, and exposes the resulting {@link Specification}
 * for topic/skill/template rendering. Non-persisted — the spec is re-parsed
 * on each app launch.
 */
import {create} from 'zustand';
import {loadDefaultSpec, parseSpecification} from '../services/physicsCore';
import type {Specification} from '../types/models';
export interface SpecState {
	/** Parsed specification, or null while loading/errored. */
	specification: Specification | null;
	/** True while the default spec is being loaded and parsed. */
	loading: boolean;
	/** Parse error message, or null when parsing succeeded. */
	error: string | null;
	/** Load and parse the bundled default specification. */
	load: () => Promise<void>;
}
export const useSpecStore = create<SpecState>()(set => ({
	specification: null,
	loading: false,
	error: null,
	load: async () => {
		set({loading: true, error: null});
		try {
			const text = await loadDefaultSpec();
			const specification = await parseSpecification(text);
			set({specification, loading: false});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			set({loading: false, error: message});
		}
	}
}));
