import type {JSX} from "solid-js";
import {Show} from "solid-js";
import {useSettingsStore} from "../stores/settingsStore";
import styles from "./LiquidBackground.module.css";
export interface LiquidBackgroundProps {
	/** Extra class appended to the root element. */
	class?: string;
}
/**
 * Pure-CSS liquid animated background.
 *
 * Renders a fixed, full-viewport, non-interactive layer behind all content
 * (`position: fixed; inset: 0; z-index: -1; pointer-events: none;`). Several
 * gradient blobs float and morph via `@keyframes` using the `--liquid-*`
 * design tokens defined in `globals.css`. A `prefers-reduced-motion: reduce`
 * media query in the co-located CSS module freezes the blobs so motion-sensitive
 * users see a static gradient instead. When the `reducedDataMode` setting is
 * on, the heavy blob/veil layer is omitted entirely and only a flat
 * `background: var(--bg)` div is rendered so users on metered connections or
 * low-power hardware are not charged for animated decoration they did not ask
 * for. The container is marked `aria-hidden` because it is purely decorative.
 */
export function LiquidBackground(props: LiquidBackgroundProps): JSX.Element {
	let reducedDataMode=useSettingsStore(s => s.reducedDataMode);
	return (
		<Show when={!reducedDataMode()} fallback={
			<div class={`${styles.root} ${styles.reducedData} ${props.class ?? ""}`} aria-hidden="true" />
		}>
			<div class={`${styles.root} ${props.class ?? ""}`} aria-hidden="true">
				<div class={`${styles.blob} ${styles.blob1}`} />
				<div class={`${styles.blob} ${styles.blob2}`} />
				<div class={`${styles.blob} ${styles.blob3}`} />
				<div class={`${styles.blob} ${styles.blob4}`} />
				<div class={styles.veil} />
			</div>
		</Show>
	);
}
