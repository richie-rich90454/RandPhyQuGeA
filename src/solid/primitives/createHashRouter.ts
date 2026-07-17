import {createSignal, onMount, onCleanup} from "solid-js";
/**
 * Minimal hash-based router for DX routes.
 *
 * `@solidjs/router` is intentionally not a dependency. This primitive tracks
 * `window.location.hash` (without the leading `#`) and exposes a `route`
 * accessor plus a `navigate(path)` helper. The hash is normalized so that an
 * empty hash maps to `"/"`. Listen for `hashchange` on mount; remove on
 * cleanup. Safe to call multiple times (each call wires its own listener).
 */
export interface HashRouter {
    /** Current path derived from `window.location.hash` (without the `#`). */
    route: () => string;
    /** Set `window.location.hash` to `path`, triggering a `hashchange`. */
    navigate: (path: string) => void;
}
function currentHash(): string {
    let hash = window.location.hash.replace(/^#/, "");
    return hash === "" ? "/" : hash;
}
export function createHashRouter(): HashRouter {
    let [route, setRoute] = createSignal<string>(currentHash());
    let handleHashChange = () => {
        setRoute(currentHash());
    };
    onMount(() => {
        window.addEventListener("hashchange", handleHashChange);
    });
    onCleanup(() => {
        window.removeEventListener("hashchange", handleHashChange);
    });
    let navigate = (path: string) => {
        window.location.hash = path;
    };
    return {route, navigate};
}
