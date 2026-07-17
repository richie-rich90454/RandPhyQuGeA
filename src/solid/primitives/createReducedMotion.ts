import {createSignal, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
export interface CreateReducedMotionOptions {
    /** CSS media query used to detect the OS reduced-motion preference. */
    query?: string;
}
/**
 * Subscribe to the OS `prefers-reduced-motion` preference and expose it as a
 * Solid signal.
 *
 * Solid port of {@link ../../hooks/useReducedMotion}: initializes the signal
 * synchronously from `window.matchMedia` so the first render reflects the
 * current OS preference, then updates it live when the user changes the
 * setting at the OS level. The `change` listener is removed via `onCleanup`.
 * Returns an {@link Accessor} that tracks the preference reactively.
 */
export function createReducedMotion(options: CreateReducedMotionOptions = {}): Accessor<boolean> {
    let query = options.query ?? "(prefers-reduced-motion: reduce)";
    let mql = window.matchMedia(query);
    let [reducedMotion, setReducedMotion] = createSignal<boolean>(mql.matches);
    let handleChange = (event: MediaQueryListEvent) => {
        setReducedMotion(event.matches);
    };
    mql.addEventListener("change", handleChange);
    onCleanup(() => {
        mql.removeEventListener("change", handleChange);
    });
    return reducedMotion;
}
