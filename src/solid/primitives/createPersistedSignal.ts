import {createEffect, createSignal} from "solid-js";
import type {Accessor, Setter} from "solid-js";
export interface CreatePersistedSignalOptions {
	/** Storage key. */
	key: string;
	/** Value used when nothing is stored or parsing fails. */
	defaultValue: unknown;
}
function readStored(key: string, defaultValue: unknown): unknown {
	if (typeof window === "undefined") return defaultValue;
	try {
		let raw=window.localStorage.getItem(key);
		if (raw === null) return defaultValue;
		return JSON.parse(raw);
	} catch {
		return defaultValue;
	}
}
function writeStored(key: string, value: unknown): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// ignore quota or serialization errors
	}
}
/**
 * `createSignal` wrapper that persists every value to `localStorage`.
 *
 * On init the value is hydrated from `localStorage` (JSON-decoded), falling
 * back to `defaultValue` when nothing is stored, the entry is malformed, or the
 * code runs outside a browser (SSR). A `createEffect` tracks the signal and
 * writes the current value back to `localStorage` on every change, so updater
 * functions `(prev) => next` and direct sets are both persisted. The returned
 * setter is Solid's unmodified {@link Setter}. Must be called within a reactive
 * owner (a component or `createRoot`) so the effect is disposed correctly.
 */
export function createPersistedSignal<T>(options: CreatePersistedSignalOptions): [Accessor<T>, Setter<T>] {
	let {key, defaultValue}=options;
	let initial=readStored(key, defaultValue) as T;
	let [value, setValue]=createSignal<T>(initial);
	createEffect(() => {
		writeStored(key, value());
	});
	return [value, setValue];
}
