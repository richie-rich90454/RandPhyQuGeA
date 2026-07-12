import type {JSX, JSXElement} from "solid-js";
import {Show} from "solid-js";
import {AppTopBar} from "./AppTopBar";
import {Footer} from "./Footer";
import styles from "./AppShell.module.css";
export interface AppShellProps {
	/** Control toolbar rendered above the main landmark. */
	toolbar?: JSXElement;
	/** Main content rendered inside the <main> landmark. */
	children?: JSXElement;
	/** Optional global actions passed to AppTopBar. */
	actions?: JSXElement;
	/** Optional GitHub URL forwarded to the footer. */
	githubUrl?: string;
	/** Optional callback forwarded to the footer settings link. */
	onOpenSettings?: () => void;
	/** Optional callback forwarded to the footer shortcuts link. */
	onOpenShortcuts?: () => void;
	/** Optional callback forwarded to the footer theme toggle. */
	onToggleTheme?: () => void;
	/** Optional accessible label for the footer theme toggle. */
	themeLabel?: string;
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
					<main id="main-content" class={styles.main} tabindex={-1}>
						{props.children}
					</main>
				</div>
				<Footer
					githubUrl={props.githubUrl}
					onOpenSettings={props.onOpenSettings}
					onOpenShortcuts={props.onOpenShortcuts}
					onToggleTheme={props.onToggleTheme}
					themeLabel={props.themeLabel}
				/>
			</div>
		</>
	);
}
