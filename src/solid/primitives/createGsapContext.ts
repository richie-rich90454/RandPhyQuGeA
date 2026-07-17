import {createSignal, onMount, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
import gsap from "gsap";
export type GsapSetup = (ctx: gsap.Context) => void;
export interface CreateGsapContextOptions {
    /** Function receiving the GSAP context; GSAP calls recorded here are reverted on cleanup. */
    setup: GsapSetup;
    /** Element or selector scope for the context's selector lookups. */
    scope?: Element | string;
}
/**
 * Wrap a GSAP animation setup in the Solid component lifecycle.
 *
 * Solid port of {@link ../../hooks/useGsapContext}: `gsap.context(setup, scope)`
 * collects every GSAP animation/tween created inside `setup` so they can be
 * torn down atomically. The context is created in `onMount` (after the DOM is
 * rendered so refs are populated) and `revert()` is called in `onCleanup`,
 * preventing leaks when the owning component unmounts. SSR is guarded by
 * skipping creation when `window` is undefined. Returns an accessor that
 * resolves to the `gsap.Context` once mounted (or `null` before/SSR).
 */
export function createGsapContext(options: CreateGsapContextOptions): Accessor<gsap.Context | null> {
    let [ctx, setCtx] = createSignal<gsap.Context | null>(null);
    onMount(() => {
        if (typeof window === "undefined") return;
        let context = gsap.context(self => options.setup(self), options.scope);
        setCtx(context);
    });
    onCleanup(() => {
        let current = ctx();
        if (current) {
            current.revert();
        }
    });
    return ctx;
}
