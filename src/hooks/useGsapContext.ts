import {useLayoutEffect, useState} from "react";
import gsap from "gsap";
export function useGsapContext<T extends HTMLElement>(ref: React.RefObject<T | null>, setup: (ctx: gsap.Context) => void): gsap.Context | null {
	const [ctx, setCtx] = useState<gsap.Context | null>(null);
	useLayoutEffect(() => {
		if (typeof window === "undefined" || !ref.current) return () => {};
		const context = gsap.context(setup, ref.current);
		setCtx(context);
		return () => {
			context.revert();
		};
	}, [ref, setup]);
	return ctx;
}
