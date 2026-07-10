import type {JSX, JSXElement} from "solid-js";
import {Show, splitProps} from "solid-js";
import styles from "./AppTopBar.module.css";
export interface AppTopBarProps {
	/** Global actions rendered on the right (e.g. UtilityButtons). */
	actions?: JSXElement;
	/** Optional wordmark label override; defaults to "RandPhyQuGeA". */
	wordmark?: string;
	/** Optional home link href; defaults to "/". */
	href?: string;
	/** Extra class for the header element. */
	class?: string;
}
/**
 * Clean top navigation bar for the application shell.
 *
 * Renders the app wordmark on the left and an optional actions slot on the
 * right. Stays within the 64px height range to keep the interface focused.
 * Uses an inline atom SVG so no icon-library dependency is required.
 */
export function AppTopBar(props: AppTopBarProps): JSX.Element {
	let [local]=splitProps(props, ["actions", "wordmark", "href", "class"]);
	let label=local.wordmark ?? "RandPhyQuGeA";
	let href=local.href ?? "/";
	return (
		<header class={`${styles.bar} ${local.class ?? ""}`}>
			<div class={styles.inner}>
				<a href={href} class={styles.wordmark} aria-label={`${label} home`}>
					<svg class={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle cx="12" cy="12" r="2.2" fill="currentColor" />
						<ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="currentColor" stroke-width="1.4" />
						<ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="currentColor" stroke-width="1.4" transform="rotate(60 12 12)" />
						<ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="currentColor" stroke-width="1.4" transform="rotate(120 12 12)" />
					</svg>
					<span class={styles.text}>{label}</span>
				</a>
				<Show when={local.actions}>
					<nav class={styles.actions} aria-label="Primary actions">{local.actions}</nav>
				</Show>
			</div>
		</header>
	);
}
