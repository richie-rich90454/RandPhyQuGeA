import {createSignal, createEffect, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
/**
 * Subscribe to a CSS media query and expose whether it currently matches as a
 * Solid signal.
 *
 * Solid port of {@link ../../hooks/useMediaQuery}: accepts either a static
 * query string or a reactive {@link Accessor} of query strings. When the query
 * is reactive, a `createEffect` re-subscribes whenever it changes, and the
 * previous `change` listener is removed via `onCleanup` registered inside the
 * effect (so it also runs on the next re-subscription and on owner disposal).
 * The signal is initialized synchronously from `window.matchMedia` so the
 * first render reflects the current match before the deferred effect runs.
 */
export function createMediaQuery(query: string | Accessor<string>): Accessor<boolean> {
    let queryAccessor: Accessor<string> = typeof query === "function" ? query : () => query;
    let [matches, setMatches] = createSignal<boolean>(window.matchMedia(queryAccessor()).matches);
    createEffect(() => {
        let q = queryAccessor();
        let mql = window.matchMedia(q);
        setMatches(mql.matches);
        let handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };
        mql.addEventListener("change", handler);
        onCleanup(() => {
            mql.removeEventListener("change", handler);
        });
    });
    return matches;
}
