import type {JSX} from "solid-js";
import {Show, createMemo, splitProps} from "solid-js";
import styles from "./ProgressBar.module.css";
export interface ProgressBarProps {
	/** Completion percentage clamped to 0–100. */
	value?: number;
	/** Render an animated indeterminate bar. */
	indeterminate?: boolean;
	/** Extra class for the track. */
	class?: string;
	/** Accessible name for the progress bar. Defaults to "Progress". */
	ariaLabel?: string;
}
/** Progress bar with determinate and indeterminate modes. */
export function ProgressBar(props: ProgressBarProps): JSX.Element {
	let [local]=splitProps(props, ["value", "indeterminate", "class", "ariaLabel"]);
	let clamped=createMemo(() => Math.min(100, Math.max(0, local.value ?? 0)));
	let rounded=createMemo(() => Math.round(clamped()));
	return (
		<div
			class={`${styles.track} ${local.class ?? ""}`}
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={local.indeterminate ? undefined : rounded()}
			aria-valuetext={local.indeterminate ? undefined : `${rounded()}%`}
			aria-label={local.ariaLabel ?? "Progress"}
		>
			<Show
				when={local.indeterminate}
				fallback={<div class={styles.fill} style={`width: ${clamped()}%;`} />}
			>
				<div class={`${styles.fill} ${styles.indeterminate}`} />
			</Show>
		</div>
	);
}
