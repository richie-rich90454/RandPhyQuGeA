import {useLayoutEffect, useRef, createElement, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref, type JSX} from "react";
import {cn} from "../../lib/utils";
import {useReducedMotion} from "../../hooks/useReducedMotion";
import {registerGsapPlugins} from "../../lib/gsap";
import gsap from "gsap";
/** Direction from which the element enters the viewport. */
export type ScrollRevealDirection = "up" | "down" | "left" | "right";
/** Props owned by ScrollReveal. */
export interface ScrollRevealOwnProps {
	/** Wrapped content. */
	children?: ReactNode;
	/** Extra classes appended to the wrapper. */
	className?: string;
	/** Entrance direction; defaults to up. */
	direction?: ScrollRevealDirection;
	/** Translate distance in pixels; defaults to 24. */
	distance?: number;
	/** Animation duration in seconds; defaults to 0.6. */
	duration?: number;
	/** Delay before the animation starts in seconds; defaults to 0. */
	delay?: number;
	/** Whether the animation should only play once; defaults to true. */
	once?: boolean;
	/** Ease accepted by GSAP; defaults to power2.out. */
	ease?: string;
	/** Optional scroller element (for scrollable containers such as modals). */
	scrollerRef?: Ref<HTMLElement | null>;
	/** Element type rendered by the wrapper; defaults to div. */
	as?: keyof JSX.IntrinsicElements;
}
/** ScrollReveal props. */
export type ScrollRevealProps = ScrollRevealOwnProps & Omit<HTMLAttributes<HTMLElement>, keyof ScrollRevealOwnProps>;
const axisByDirection: Record<ScrollRevealDirection, "x" | "y"> = {
	up: "y",
	down: "y",
	left: "x",
	right: "x",
};
const signByDirection: Record<ScrollRevealDirection, 1 | -1> = {
	up: 1,
	down: -1,
	left: 1,
	right: -1,
};
/**
 * GSAP ScrollTrigger reveal wrapper.
 *
 * Animates its child element from a slight translate + fade when it enters the
 * viewport. Respects `prefers-reduced-motion` by rendering the content fully
 * visible and skipping the GSAP setup. Supports custom scrollers for use
 * inside overflow containers such as modals.
 */
export function ScrollReveal({
	children,
	className,
	direction = "up",
	distance = 24,
	duration = 0.6,
	delay = 0,
	once = true,
	ease = "power2.out",
	scrollerRef,
	as = "div",
	...props
}: ScrollRevealProps) {
	const localRef = useRef<HTMLElement | null>(null);
	const {reducedMotion} = useReducedMotion();
	useLayoutEffect(() => {
		const element = !reducedMotion && typeof window !== "undefined" ? localRef.current : null;
		if (!element) {
			return () => {};
		}
		registerGsapPlugins();
		const scroller = (scrollerRef && "current" in scrollerRef ? scrollerRef.current : null) ?? undefined;
		const axis = axisByDirection[direction];
		const sign = signByDirection[direction];
		const ctx = gsap.context(() => {
			gsap.fromTo(
				element,
				{opacity: 0, [axis]: distance * sign},
				{
					opacity: 1,
					[axis]: 0,
					duration,
					delay,
					ease,
					scrollTrigger: {
						trigger: element,
						scroller,
						start: "top 85%",
						once,
						toggleActions: once ? "play none none none" : "play reverse play reverse",
					},
				},
			);
		}, element);
		return () => {
			ctx.revert();
		};
	}, [reducedMotion, direction, distance, duration, delay, once, ease, scrollerRef]);
	const style: CSSProperties = reducedMotion ? {} : {opacity: 0};
	return createElement(as, {ref: localRef, className: cn(className), style, ...props}, children);
}
