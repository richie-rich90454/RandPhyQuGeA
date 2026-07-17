import {createSignal, onMount, onCleanup} from "solid-js";
import type {Accessor} from "solid-js";
/**
 * Options for {@link createCountdownTimer}.
 */
export interface CreateCountdownTimerOptions {
    /** Whether the timer should pause automatically while feedback is shown. Callers toggle this via pause/resume. */
    pauseOnFeedback?: boolean;
}
/**
 * Return value of {@link createCountdownTimer}.
 */
export interface CreateCountdownTimerReturn {
    /** Seconds remaining in the countdown (0 when expired or not started). */
    timeRemaining: Accessor<number>;
    /** True while the countdown is actively ticking down. */
    isRunning: Accessor<boolean>;
    /** Start a new countdown with the given duration (seconds). */
    start: (durationSec: number) => void;
    /** Pause the countdown without resetting the remaining time. */
    pause: () => void;
    /** Resume a paused countdown from where it left off. */
    resume: () => void;
    /** Stop and reset the countdown to 0 remaining. */
    reset: () => void;
}
/**
 * Self-contained countdown timer primitive.
 *
 * Solid port of {@link ../../hooks/useCountdownTimer}: drives a drift-free
 * countdown using `requestAnimationFrame` and `Date.now()` deltas. Updates only
 * cross whole-second boundaries to avoid visual jitter. Pauses automatically
 * when the document becomes hidden and resumes when it becomes visible if the
 * timer was running. Mutable timer state lives in closure variables (the Solid
 * equivalent of the React refs, since the primitive runs once per component
 * instance), while `timeRemaining`/`isRunning` are exposed as reactive signals.
 * The rAF loop and the `visibilitychange` listener are cleaned up via
 * `onCleanup`. `pauseOnFeedback` is surfaced via pause/resume so callers can
 * react to feedback without store coupling.
 */
export function createCountdownTimer(options?: CreateCountdownTimerOptions): CreateCountdownTimerReturn {
    void options?.pauseOnFeedback;
    let [timeRemaining, setTimeRemaining] = createSignal(0);
    let [isRunning, setIsRunning] = createSignal(false);
    let rafId: number | null = null;
    let endTime = 0;
    let remainingRef = 0;
    let wasRunningBeforeHidden = false;
    let cancelFrame = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    };
    let stop = () => {
        cancelFrame();
        endTime = 0;
        remainingRef = 0;
        setTimeRemaining(0);
        setIsRunning(false);
    };
    let updateState = (remainingMs: number) => {
        let remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        if (remainingSec !== remainingRef) {
            remainingRef = remainingSec;
            setTimeRemaining(remainingSec);
        }
        if (remainingMs <= 0) {
            stop();
        }
    };
    let tick = () => {
        if (endTime === 0) {
            return;
        }
        let now = Date.now();
        let remainingMs = endTime - now;
        updateState(remainingMs);
        if (endTime !== 0) {
            rafId = requestAnimationFrame(tick);
        }
    };
    let start = (durationSec: number) => {
        let clamped = Math.max(0, Math.floor(durationSec));
        cancelFrame();
        if (clamped === 0) {
            stop();
            return;
        }
        endTime = Date.now() + clamped * 1000;
        remainingRef = clamped;
        setTimeRemaining(clamped);
        setIsRunning(true);
        rafId = requestAnimationFrame(tick);
    };
    let pause = () => {
        cancelFrame();
        if (endTime === 0) {
            return;
        }
        let remainingMs = Math.max(0, endTime - Date.now());
        remainingRef = Math.ceil(remainingMs / 1000);
        setTimeRemaining(remainingRef);
        setIsRunning(false);
        endTime = 0;
    };
    let resume = () => {
        if (remainingRef <= 0) {
            return;
        }
        cancelFrame();
        endTime = Date.now() + remainingRef * 1000;
        setIsRunning(true);
        rafId = requestAnimationFrame(tick);
    };
    let reset = () => {
        stop();
    };
    let handleVisibilityChange = () => {
        if (document.hidden) {
            if (isRunning()) {
                wasRunningBeforeHidden = true;
                pause();
            }
        } else if (wasRunningBeforeHidden && remainingRef > 0) {
            wasRunningBeforeHidden = false;
            resume();
        }
    };
    onMount(() => {
        document.addEventListener("visibilitychange", handleVisibilityChange);
    });
    onCleanup(() => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        cancelFrame();
    });
    return {timeRemaining, isRunning, start, pause, resume, reset};
}
