import type {ComponentProps, JSX} from "solid-js";
import {createSignal, createEffect, onCleanup, splitProps} from "solid-js";
import styles from "./Motion.module.css";
/** Entrance animation variant. */
export type MotionVariant="fade-in" | "slide-up" | "scale-in";
export interface MotionProps extends ComponentProps<"div"> {
	/** Entrance animation; defaults to fade-in. */
	variant?: MotionVariant;
	/** Delay before the transition starts, in milliseconds. */
	delay?: number;
	/** Transition duration, in milliseconds; defaults to 320. */
	duration?: number;
}
let hiddenClass: Record<MotionVariant, string | undefined>={
	"fade-in": styles.fadeHidden,
	"slide-up": styles.slideHidden,
	"scale-in": styles.scaleHidden,
};
/**
 * Entrance-animation wrapper using CSS transitions.
 *
 * Renders a `div` whose children start in a hidden state (opacity 0, optional
 * transform) and transition to visible on mount. A `createEffect` schedules a
 * single `requestAnimationFrame` to flip the `visible` signal so the browser
 * paints the initial hidden frame first; the CSS module's transition then
 * animates to the final state. The co-located CSS module includes a
 * `prefers-reduced-motion: reduce` media query that disables transitions and
 * forces the visible state, so motion-sensitive users see content immediately.
 */
export function Motion(props: MotionProps): JSX.Element {
	let [local, others]=splitProps(props, ["variant", "delay", "duration", "class", "children"]);
	let variant=() => local.variant ?? "fade-in";
	let duration=() => local.duration ?? 320;
	let delay=() => local.delay ?? 0;
	let [visible, setVisible]=createSignal(false);
	createEffect(() => {
		let id=requestAnimationFrame(() => {
			setVisible(true);
		});
		onCleanup(() => {
			cancelAnimationFrame(id);
		});
	});
	return (
		<div
			class={`${styles.root} ${hiddenClass[variant()] ?? ""} ${visible() ? (styles.visible ?? "") : ""} ${local.class ?? ""}`}
			style={`--motion-duration: ${duration()}ms; --motion-delay: ${delay()}ms;`}
			data-testid="motion"
			{...others}
		>
			{local.children}
		</div>
	);
}
