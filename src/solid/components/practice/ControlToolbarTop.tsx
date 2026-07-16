import type {JSX, JSXElement} from "solid-js";
import {Show} from "solid-js";
import {ToolbarRow} from "../ui/Toolbar";
import styles from "./ControlToolbarTop.module.css";
export interface ControlToolbarTopProps {
	/** Controls rendered on the leading edge (e.g. ModeSelector). Stays fixed-width. */
	leading?: JSXElement;
	/** Controls rendered in the center region (e.g. TopicsSection pills). Grows to fill and scrolls horizontally when overflowing. */
	center?: JSXElement;
	/** Controls rendered on the trailing edge (e.g. UtilityButtons + McqToggle). Pushed to the right edge. */
	trailing?: JSXElement;
	/** Inline slot rendered when no named slots are supplied (backwards-compatible). */
	children?: JSXElement;
	/** Extra class for the row. */
	class?: string;
}
/**
 * Top row of the control toolbar.
 *
 * Solid port of {@link ../../../components/practice/ControlToolbarTop}. Renders a
 * `ToolbarRow position="top"` and composes the practice controls. The premium
 * 3-region layout (leading / center / trailing) mirrors RandMatQuGeA's
 * `.toolbar-row-top` + `.toolbar-section` + `.utility-buttons` pattern: the
 * center region grows with `flex: 1` and scrolls horizontally so long topic
 * pill rows stay reachable; the trailing region is pushed right with
 * `margin-left: auto`. When no named slots are supplied the `children` slot
 * renders inline, preserving the original decoupled shell contract. The
 * glassmorphism surface is applied via the `.glass` utility (task 4.3a) and
 * the layout tokens live in the module CSS (task 4.4).
 */
export function ControlToolbarTop(props: ControlToolbarTopProps): JSX.Element {
	let hasNamedSlots = () => props.leading !== undefined || props.center !== undefined || props.trailing !== undefined;
	return (
		<ToolbarRow position="top" class={`glass ${styles.row} ${props.class ?? ""}`}>
			<Show when={props.leading}>
				<div class={styles.leading}>{props.leading}</div>
			</Show>
			<Show when={props.center}>
				<div class={styles.center}>{props.center}</div>
			</Show>
			<Show when={props.trailing}>
				<div class={styles.trailing}>{props.trailing}</div>
			</Show>
			<Show when={!hasNamedSlots()}>{props.children}</Show>
		</ToolbarRow>
	);
}
