/**
 * Bridge a Zustand-vanilla store to a SolidJS reactive primitive.
 *
 * Zustand's `createStore` (from `zustand/vanilla`) is framework-agnostic and
 * exposes `getState`/`setState`/`subscribe`/`getInitialState`. This helper
 * wraps such a store in a Solid hook that subscribes via `createSignal` and
 * cleans up the subscription with `onCleanup`. The returned hook mirrors the
 * Zustand-React binding's public API: call it with a selector to read a slice
 * (returning a Solid accessor) or call it without arguments to read the whole
 * state. `getState`/`setState`/`subscribe`/`getInitialState` (and `persist`
 * when the `persist` middleware is applied) are attached to the hook function
 * so non-reactive callers (action hooks, tests) can reach the store directly.
 */
import type {StoreApi} from "zustand/vanilla";
import {createSignal, getOwner, onCleanup, runWithOwner} from "solid-js";
import type {Accessor} from "solid-js";
/** Minimal shape of the `persist` API attached by Zustand's persist middleware. */
export interface StorePersistApi<T> {
    rehydrate: () => Promise<void> | void;
    hasHydrated: () => boolean;
    clearStorage: () => void;
    setOptions: (options: unknown) => void;
    onHydrate: (listener: (state: T) => void) => () => void;
    onFinishHydration: (listener: (state: T) => void) => () => void;
}
/** A Solid hook bound to a Zustand-vanilla store. */
export interface SolidStore<T> {
    /** Read the entire store state as a Solid accessor. */
    (): Accessor<T>;
    /** Read a selected slice of the store state as a Solid accessor. */
    <S>(selector: (state: T) => S): Accessor<S>;
    /** Imperative access to the current state (non-reactive). */
    getState: () => T;
    /** Imperative state update (non-reactive). */
    setState: StoreApi<T>["setState"];
    /** Subscribe to store changes; returns an unsubscribe function. */
    subscribe: StoreApi<T>["subscribe"];
    /** Return the initial state the store was created with. */
    getInitialState: () => T;
    /** Present only when the store was created with the `persist` middleware. */
    persist?: StorePersistApi<T>;
}
/**
 * Wrap a Zustand-vanilla store as a Solid reactive primitive.
 *
 * The selector form uses `createSignal` with referential equality, matching
 * Zustand-React's default `Object.is` semantics: a subscriber only re-runs when
 * the selected slice's reference changes. The subscription is disposed via
 * `onCleanup` bound to the reactive owner active when the hook is called
 * (typically a component rendered by `@solidjs/testing-library` or the app
 * root), so listeners never leak past unmount.
 */
export function createSolidStore<T>(store: StoreApi<T>): SolidStore<T> {
    function useStore(): Accessor<T>;
    function useStore<S>(selector: (state: T) => S): Accessor<S>;
    function useStore<S>(selector?: (state: T) => S): Accessor<S | T> {
        const compute = (): S | T => (selector ? selector(store.getState()) : store.getState());
        const [slice, setSlice] = createSignal<S | T>(compute());
        const unsubscribe = store.subscribe(() => {
            setSlice(() => compute());
        });
        const owner = getOwner();
        if (owner) {
            runWithOwner(owner, () => onCleanup(unsubscribe));
        }
        return slice;
    }
    const bound = useStore as SolidStore<T>;
    bound.getState = store.getState;
    bound.setState = store.setState;
    bound.subscribe = store.subscribe;
    bound.getInitialState = store.getInitialState;
    const persisted = store as StoreApi<T> & {persist?: StorePersistApi<T>};
    if (persisted.persist) {
        bound.persist = persisted.persist;
    }
    return bound;
}
