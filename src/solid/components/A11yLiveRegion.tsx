import type {Accessor, JSX} from "solid-js";
import {createEffect} from "solid-js";
import styles from "./A11yLiveRegion.module.css";
export type LiveRegionPoliteness = "polite" | "assertive";
export type LiveRegionRelevant = "all" | "additions" | "additions text" | "additions removals" | "removals" | "removals additions" | "removals text" | "text" | "text additions" | "text removals";
export interface A11yLiveRegionProps {
	/** Reactive message text to announce. Empty string clears the announcement. */
	message: Accessor<string> | string;
	/** Politeness level; defaults to polite. */
	politeness?: LiveRegionPoliteness;
	/** Whether the region is marked atomic (whole region announced on change). */
	atomic?: boolean;
	/** Whether the region is relevant to the current state; defaults to additions text. */
	relevant?: LiveRegionRelevant;
	/** Optional id for the live region element. */
	id?: string;
}
/**
 * Visually hidden `aria-live` region for screen-reader announcements.
 *
 * Solid port of the React live-region pattern: a 1px clipped element that
 * screen readers monitor. A `createEffect` rewrites the text content whenever
 * the `message` accessor changes, which is the reliable cross-browser trigger
 * for an announcement. Use `polite` for non-critical updates (question
 * changed, score updated) and `assertive` for errors or timer expiry. The
 * element is hidden visually via the co-located CSS module using the standard
 * visually-hidden clip technique so it remains in the accessibility tree.
 */
export function A11yLiveRegion(props: A11yLiveRegionProps): JSX.Element {
	let politeness = () => props.politeness ?? "polite";
	let resolveMessage = () => {
		let value = props.message;
		if (typeof value === "function") {
			return value();
		}
		return value;
	};
	let node: HTMLSpanElement | null = null;
	createEffect(() => {
		let text = resolveMessage();
		if (node) {
			node.textContent = text;
		}
	});
	return (
		<span
			ref={el => {
				node = el;
			}}
			id={props.id}
			class={styles.srOnly}
			role="status"
			aria-live={politeness()}
			aria-atomic={props.atomic ? "true" : "false"}
			aria-relevant={props.relevant ?? "additions text"}
			data-testid="a11y-live-region"
		/>
	);
}
