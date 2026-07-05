import {useEffect, useState} from "react";
export function useReducedMotion(): {reducedMotion: boolean} {
	const [reducedMotion, setReducedMotion] = useState<boolean>(() => (typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false));
	useEffect(() => {
		if (typeof window === "undefined") return () => {};
		const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
		const handleChange = (event: MediaQueryListEvent) => {
			setReducedMotion(event.matches);
		};
		mediaQueryList.addEventListener("change", handleChange);
		return () => {
			mediaQueryList.removeEventListener("change", handleChange);
		};
	}, []);
	return {reducedMotion};
}
