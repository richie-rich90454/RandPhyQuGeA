import type {JSX, JSXElement} from "solid-js";
import {Show, splitProps} from "solid-js";
import styles from "./EmptyState.module.css";
export interface EmptyStateProps {
	/** Decorative illustration (primary slot). */
	illustration?: JSXElement;
	/** @deprecated Use `illustration` instead. */
	icon?: JSXElement;
	/** Primary message text. */
	title: string;
	/** Secondary explanatory text. */
	description?: string;
	/** Optional call-to-action node. */
	action?: JSXElement;
	/** Extra class for the container. */
	class?: string;
}
/** Empty-state placeholder with illustration, title, description, and action. */
export function EmptyState(props: EmptyStateProps): JSX.Element {
	let [local]=splitProps(props, ["illustration", "icon", "title", "description", "action", "class"]);
	let media=() => local.illustration ?? local.icon;
	return (
		<div class={`${styles.root} ${local.class ?? ""}`}>
			<Show when={media()}>
				<span aria-hidden="true" class={styles.media}>{media()}</span>
			</Show>
			<h3 class={styles.title}>{local.title}</h3>
			<Show when={local.description}>
				<p class={styles.description}>{local.description}</p>
			</Show>
			<Show when={local.action}>
				<div class={styles.action}>{local.action}</div>
			</Show>
		</div>
	);
}
