import type {JSX} from "solid-js";
import {Show, For, Portal} from "solid-js/web";
import styles from "./A11yInspectorOverlay.module.css";
export interface A11yInspectorOverlayProps {
	/** Reactive true when the overlay is visible. */
	isOpen: () => boolean;
	/** Reactive list of accessibility issues. */
	issues: () => Array<{
		rule: string;
		severity: "error" | "warning" | "info";
		message: string;
		selector: string;
		element?: string;
	}>;
	/** Reactive count of error-severity issues. */
	errorCount: () => number;
	/** Reactive count of warning-severity issues. */
	warningCount: () => number;
	/** Toggle the overlay visibility. */
	onToggle: () => void;
	/** Re-run the scan. */
	onRefresh: () => void;
}
/**
 * Dev-only accessibility inspector overlay. Renders a fixed-position panel
 * (via Portal to document.body) listing every a11y issue found by the
 * checker, grouped by severity. Includes a refresh button and a close button.
 * Not rendered in production builds (guarded by the consumer).
 */
export function A11yInspectorOverlay(props: A11yInspectorOverlayProps): JSX.Element {
	return (
		<Show when={props.isOpen()}>
			<Portal>
				<div class={styles.overlay} role="dialog" aria-label="Accessibility inspector" aria-modal="false">
					<div class={styles.header}>
						<h2 class={styles.title}>A11y Inspector</h2>
						<div class={styles.summary}>
							<span class={styles.errorCount} aria-label={`${props.errorCount()} errors`}>
								{props.errorCount()} errors
							</span>
							<span class={styles.warningCount} aria-label={`${props.warningCount()} warnings`}>
								{props.warningCount()} warnings
							</span>
						</div>
						<div class={styles.actions}>
							<button type="button" class={styles.refresh} onClick={() => props.onRefresh()} aria-label="Re-run scan">
								Refresh
							</button>
							<button type="button" class={styles.close} onClick={() => props.onToggle()} aria-label="Close inspector">
								Close
							</button>
						</div>
					</div>
					<Show
						when={props.issues().length>0}
						fallback={<p class={styles.empty}>No accessibility issues found.</p>}
					>
						<ul class={styles.list}>
							<For each={props.issues()}>{(issue) => (
								<li class={styles.item} data-severity={issue.severity}>
									<span class={styles.badge}>{issue.severity}</span>
									<span class={styles.rule}>{issue.rule}</span>
									<span class={styles.message}>{issue.message}</span>
									<code class={styles.selector}>{issue.selector}</code>
								</li>
							)}</For>
						</ul>
					</Show>
				</div>
			</Portal>
		</Show>
	);
}
