import type {JSX} from "solid-js";
import {Show, splitProps} from "solid-js";
import styles from "./Spinner.module.css";
export type SpinnerSize="sm" | "md" | "lg";
export interface SpinnerProps {
	/** Spinner diameter. */
	size?: SpinnerSize;
	/** Extra class for the spinner. */
	class?: string;
	/** Whether the spinner is a standalone loading indicator. */
	standalone?: boolean;
}
let sizePx: Record<SpinnerSize, number>={
	sm: 16,
	md: 24,
	lg: 32,
};
/** CSS-only animated spinner with optional accessible standalone mode. */
export function Spinner(props: SpinnerProps): JSX.Element {
	let [local]=splitProps(props, ["size", "class", "standalone"]);
	let size=local.size ?? "md";
	let px=sizePx[size] ?? 24;
	return (
		<Show
			when={local.standalone}
			fallback={<div class={`${styles.spinner} ${local.class ?? ""}`} style={`width: ${px}px; height: ${px}px;`} aria-hidden="true" />}
		>
			<div class={`${styles.spinner} ${local.class ?? ""}`} style={`width: ${px}px; height: ${px}px;`} role="status">
				<span class={styles.visuallyHidden}>Loading</span>
			</div>
		</Show>
	);
}
