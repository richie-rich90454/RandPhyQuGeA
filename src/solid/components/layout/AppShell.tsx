import type {JSX, JSXElement} from "solid-js";
import {Show} from "solid-js";
import pkg from "../../../../package.json";
import {AppTopBar} from "./AppTopBar";
import styles from "./AppShell.module.css";
export interface AppShellProps {
	/** Control toolbar rendered above the main landmark. */
	toolbar?: JSXElement;
	/** Main content rendered inside the <main> landmark. */
	children?: JSXElement;
	/** Optional global actions passed to AppTopBar. */
	actions?: JSXElement;
}
/**
 * Application shell layout for the SolidJS app.
 *
 * Renders a skip-link, a subtle fixed mesh/gradient background, a clean
 * top navigation bar with the app wordmark and global actions, the control
 * toolbar, a <main id="main-content"> landmark, and a compact footer.
 */
export function AppShell(props: AppShellProps): JSX.Element {
	return (
		<>
			<a href="#main-content" class={styles.skipLink}>
				Skip to main content
			</a>
			<div class={styles.background} aria-hidden="true">
				<div class={styles.backgroundGradient} />
				<div class={styles.backgroundMesh} />
			</div>
			<div class={styles.container}>
				<AppTopBar actions={props.actions} />
				<div class={styles.content}>
					<Show when={props.toolbar}>
						{props.toolbar}
					</Show>
					<main id="main-content" class={styles.main} tabindex={-1} aria-label="Main content">
						{props.children}
					</main>
				</div>
				<footer class={styles.footer}>
					<span class={styles.footerText}>RandPhyQuGeA v{pkg.version}</span>
					<span class={styles.footerDot} aria-hidden="true">·</span>
					<span class={styles.footerText}>© 2026 Richard's Blogs</span>
				</footer>
			</div>
		</>
	);
}
