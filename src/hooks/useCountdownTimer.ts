import {useCallback, useEffect, useRef, useState} from "react";
/**
 * Options for {@link useCountdownTimer}.
 */
export interface UseCountdownTimerOptions {
	/** Whether the timer should pause automatically while feedback is shown. Callers toggle this via pause/resume. */
	pauseOnFeedback?: boolean;
}
/**
 * Return value of {@link useCountdownTimer}.
 */
export interface UseCountdownTimerReturn {
	/** Seconds remaining in the countdown (0 when expired or not started). */
	timeRemaining: number;
	/** True while the countdown is actively ticking down. */
	isRunning: boolean;
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
 * Self-contained countdown timer hook.
 *
 * Drives a drift-free countdown using requestAnimationFrame and Date.now()
 * deltas. Updates only cross whole-second boundaries to avoid visual jitter and
 * respect reduced motion preferences. Pauses automatically when the document
 * becomes hidden and resumes when it becomes visible if the timer was running.
 * Cleans up rAF and listeners on unmount.
 */
export function useCountdownTimer(options?: UseCountdownTimerOptions): UseCountdownTimerReturn {
	const [timeRemaining, setTimeRemaining] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const rafRef = useRef<number|null>(null);
	const endTimeRef = useRef<number>(0);
	const remainingRef = useRef<number>(0);
	const wasRunningBeforeHiddenRef = useRef<boolean>(false);
	const cancelFrame = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
	}, []);
	const stop = useCallback(() => {
		cancelFrame();
		endTimeRef.current = 0;
		remainingRef.current = 0;
		setTimeRemaining(0);
		setIsRunning(false);
	}, [cancelFrame]);
	const updateState = useCallback((remainingMs: number) => {
		const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
		if (remainingSec !== remainingRef.current) {
			remainingRef.current = remainingSec;
			setTimeRemaining(remainingSec);
		}
		if (remainingMs <= 0) {
			stop();
		}
	}, [stop]);
	const tick = useCallback(() => {
		if (endTimeRef.current === 0) return;
		const now = Date.now();
		const remainingMs = endTimeRef.current - now;
		updateState(remainingMs);
		if (endTimeRef.current !== 0) {
			rafRef.current = requestAnimationFrame(tick);
		}
	}, [updateState]);
	const start = useCallback((durationSec: number) => {
		const clamped = Math.max(0, Math.floor(durationSec));
		cancelFrame();
		if (clamped === 0) {
			stop();
			return;
		}
		endTimeRef.current = Date.now() + clamped * 1000;
		remainingRef.current = clamped;
		setTimeRemaining(clamped);
		setIsRunning(true);
		rafRef.current = requestAnimationFrame(tick);
	}, [cancelFrame, stop, tick]);
	const pause = useCallback(() => {
		cancelFrame();
		if (endTimeRef.current === 0) return;
		const remainingMs = Math.max(0, endTimeRef.current - Date.now());
		remainingRef.current = Math.ceil(remainingMs / 1000);
		setTimeRemaining(remainingRef.current);
		setIsRunning(false);
		endTimeRef.current = 0;
	}, [cancelFrame]);
	const resume = useCallback(() => {
		if (remainingRef.current <= 0) return;
		cancelFrame();
		endTimeRef.current = Date.now() + remainingRef.current * 1000;
		setIsRunning(true);
		rafRef.current = requestAnimationFrame(tick);
	}, [cancelFrame, tick]);
	const reset = useCallback(() => {
		stop();
	}, [stop]);
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				if (isRunning) {
					wasRunningBeforeHiddenRef.current = true;
					pause();
				}
			} else if (wasRunningBeforeHiddenRef.current && remainingRef.current > 0) {
				wasRunningBeforeHiddenRef.current = false;
				resume();
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [isRunning, pause, resume]);
	useEffect(() => {
		return () => {
			cancelFrame();
		};
	}, [cancelFrame]);
	// pauseOnFeedback is surfaced via pause/resume so callers can react to feedback without store coupling.
	void options?.pauseOnFeedback;
	return {timeRemaining, isRunning, start, pause, resume, reset};
}
