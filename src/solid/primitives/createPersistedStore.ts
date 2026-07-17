import {createEffect} from "solid-js";
import {createStore} from "solid-js/store";
import type {SetStoreFunction} from "solid-js/store";
export interface CreatePersistedStoreOptions {
    /** Storage key. */
    key: string;
    /** Store shape used when nothing is stored or parsing fails. */
    defaultValue: object;
}
function readStored<T extends object>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;
    try {
        let raw = window.localStorage.getItem(key);
        if (raw === null) return defaultValue;
        return JSON.parse(raw) as T;
    } catch {
        return defaultValue;
    }
}
function writeStored(key: string, value: object): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore quota or serialization errors
    }
}
/**
 * `createStore` wrapper that persists the whole store to `localStorage`.
 *
 * The store is hydrated from `localStorage` (JSON-decoded) on init, falling
 * back to `defaultValue` when nothing is stored, the entry is malformed, or the
 * code runs outside a browser (SSR). A `createEffect` tracks every accessed
 * property of the store proxy (via `JSON.stringify`) and writes the full
 * snapshot back to `localStorage` on any change, so nested updates are
 * persisted automatically. The returned setter is Solid's
 * {@link SetStoreFunction}, allowing path-based updates.
 */
export function createPersistedStore<T extends object>(options: CreatePersistedStoreOptions): [T, SetStoreFunction<T>] {
    let {key, defaultValue} = options;
    let initial = readStored(key, defaultValue) as T;
    let [store, setStore] = createStore<T>(initial);
    createEffect(() => {
        writeStored(key, store);
    });
    return [store, setStore];
}
