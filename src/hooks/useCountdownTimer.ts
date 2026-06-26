import {useCallback, useEffect, useRef, useState} from 'react';
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
 * Drives a 1-second interval internally and exposes start/pause/resume/reset
 * controls. When the remaining seconds reach 0 the interval is cleared
 * automatically. The hook cleans up its interval on unmount.
 */
export function useCountdownTimer(): UseCountdownTimerReturn {
	const [timeRemaining, setTimeRemaining] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const intervalRef = useRef<number | null>(null);
	const clearTimer = useCallback(() => {
		if (intervalRef.current !== null) {
			window.clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);
	const start = useCallback(
		(durationSec: number) => {
			clearTimer();
			setTimeRemaining(Math.max(0, Math.floor(durationSec)));
			setIsRunning(true);
		},
		[clearTimer]
	);
	const pause = useCallback(() => {
		setIsRunning(false);
	}, []);
	const resume = useCallback(() => {
		setTimeRemaining(remaining => {
			if (remaining > 0) setIsRunning(true);
			return remaining;
		});
	}, []);
	const reset = useCallback(() => {
		clearTimer();
		setIsRunning(false);
		setTimeRemaining(0);
	}, [clearTimer]);
	useEffect(() => {
		if (!isRunning) return;
		intervalRef.current = window.setInterval(() => {
			setTimeRemaining(prev => {
				if (prev <= 1) {
					if (intervalRef.current !== null) {
						window.clearInterval(intervalRef.current);
						intervalRef.current = null;
					}
					setIsRunning(false);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => {
			if (intervalRef.current !== null) {
				window.clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isRunning]);
	return {timeRemaining, isRunning, start, pause, resume, reset};
}
