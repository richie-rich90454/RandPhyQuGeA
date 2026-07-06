import {useEffect, useState} from "react";
import {useReducedMotion} from "./useReducedMotion";
/**
 * Animate a numeric value from zero up to a target.
 *
 * The animation uses `requestAnimationFrame` and runs for the given duration
 * in milliseconds. When the user prefers reduced motion the target value is
 * returned immediately to avoid unnecessary visual motion.
 */
export function useCountUp(target: number, duration: number = 800): number {
	const {reducedMotion} = useReducedMotion();
	const [value, setValue] = useState(reducedMotion ? target : 0);
	useEffect(() => {
		if (reducedMotion) {
			setValue(target);
			return;
		}
		setValue(0);
		let startTime: number | null = null;
		let rafId: number;
		const step = (timestamp: number) => {
			if (startTime === null) {
				startTime = timestamp;
			}
			const elapsed = timestamp - startTime;
			const progress = Math.min(elapsed / duration, 1);
			setValue(Math.round(progress * target));
			if (progress < 1) {
				rafId = requestAnimationFrame(step);
			}
		};
		rafId = requestAnimationFrame(step);
		return () => {
			cancelAnimationFrame(rafId);
		};
	}, [target, duration, reducedMotion]);
	return value;
}
