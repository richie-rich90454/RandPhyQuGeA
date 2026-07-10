import type {JSX, JSXElement} from "solid-js";
import {ToolbarRow} from "../ui/Toolbar";
import styles from "./ControlToolbarTop.module.css";
export interface ControlToolbarTopProps {
	/** Practice controls composed into the top toolbar row (mode selector, topics, response-mode toggle). */
	children?: JSXElement;
	/** Extra class for the row. */
	class?: string;
}
/**
 * Top row of the control toolbar.
 *
 * Solid port of {@link ../../../components/practice/ControlToolbarTop}. Renders a
 * `ToolbarRow position="top"` and composes the practice controls passed in via
 * the `children` slot. The mode selector, topics section, and response-mode
 * toggle are supplied by the caller so this shell stays decoupled from the
 * concrete sub-components (mirrors the AppShell slot pattern). Vertical
 * separators between groups are also composed by the caller.
 */
export function ControlToolbarTop(props: ControlToolbarTopProps): JSX.Element {
	return (
		<ToolbarRow position="top" class={`${styles.row} ${props.class ?? ""}`}>
			{props.children}
		</ToolbarRow>
	);
}
