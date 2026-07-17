import {createSignal, createEffect, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
import {createReducedMotion} from "./createReducedMotion";
export interface CreateCountUpOptions {
    /** Target value to animate toward. May be reactive. */
    target: number | Accessor<number>;
    /** Animation duration in milliseconds. Defaults to 800. May be reactive. */
    duration?: number | Accessor<number>;
    /** Override for the reduced-motion preference; defaults to {@link createReducedMotion}. */
    reducedMotion?: Accessor<boolean>;
}
/**
 * Animate a numeric value from zero up to a target.
 *
 * Solid port of {@link ../../hooks/useCountUp}: uses `requestAnimationFrame`
 * and runs for the given duration in milliseconds. When the user prefers
 * reduced motion the target value is returned immediately to avoid unnecessary
 * visual motion. The animation is driven by a `createEffect` that re-runs
 * whenever `target`, `duration`, or the reduced-motion preference changes; the
 * previous animation frame is cancelled via `onCleanup` registered inside the
 * effect (so it also runs on re-subscription and owner disposal). Returns an
 * {@link Accessor} that tracks the animated value reactively.
 */
export function createCountUp(options: CreateCountUpOptions): Accessor<number> {
    let targetAcc: Accessor<number>;
    if (typeof options.target === "function") {
        targetAcc = options.target;
    } else {
        let t = options.target;
        targetAcc = () => t;
    }
    let durationAcc: Accessor<number>;
    if (typeof options.duration === "function") {
        durationAcc = options.duration;
    } else {
        let d = options.duration;
        durationAcc = () => d ?? 800;
    }
    let reducedMotion = options.reducedMotion ?? createReducedMotion();
    let [value, setValue] = createSignal<number>(reducedMotion() ? targetAcc() : 0);
    createEffect(() => {
        let target = targetAcc();
        let duration = durationAcc();
        let reduced = reducedMotion();
        if (reduced) {
            setValue(target);
            return;
        }
        setValue(0);
        let rafId: number | null = null;
        let startTime: number | null = null;
        let step = (timestamp: number) => {
            if (startTime === null) {
                startTime = timestamp;
            }
            let elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / duration, 1);
            setValue(Math.round(progress * target));
            if (progress < 1) {
                rafId = requestAnimationFrame(step);
            }
        };
        rafId = requestAnimationFrame(step);
        onCleanup(() => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        });
    });
    return value;
}
