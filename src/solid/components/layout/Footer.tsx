import type {JSX} from "solid-js";
import {Show} from "solid-js";
import pkg from "../../../../package.json";
import styles from "./Footer.module.css";
export interface FooterProps {
	/** GitHub repository URL; defaults to the project repo. */
	githubUrl?: string;
	/** Callback to open the settings modal. */
	onOpenSettings?: () => void;
	/** Callback to open the keyboard shortcuts modal. */
	onOpenShortcuts?: () => void;
	/** Callback to cycle the active theme. */
	onToggleTheme?: () => void;
	/** Accessible label for the theme toggle button. */
	themeLabel?: string;
}
/**
 * Compact footer for the application shell.
 *
 * Renders the app name/version, copyright, GitHub link, and quick-action
 * buttons (shortcuts, settings, theme) when their callbacks are provided.
 * Uses a glassmorphism surface with a subtle top border and muted text.
 */
export function Footer(props: FooterProps): JSX.Element {
	let githubUrl = props.githubUrl ?? "https://github.com/RichardBlogs/RandPhyQuGeA";
	return (
		<footer class={`glass ${styles.footer}`}>
			<div class={styles.group}>
				<span class={styles.text}>RandPhyQuGeA v{pkg.version}</span>
				<span class={styles.dot} aria-hidden="true">
					·
				</span>
				<span class={styles.text}>© 2026 Richard's Blogs</span>
			</div>
			<nav class={styles.group} aria-label="Footer quick links">
				<a class={styles.link} href={githubUrl} target="_blank" rel="noopener noreferrer">
					GitHub
				</a>
				<Show when={props.onOpenShortcuts}>
					<button type="button" class={styles.linkButton} onClick={() => props.onOpenShortcuts?.()}>
						Shortcuts
					</button>
				</Show>
				<Show when={props.onOpenSettings}>
					<button type="button" class={styles.linkButton} onClick={() => props.onOpenSettings?.()}>
						Settings
					</button>
				</Show>
				<Show when={props.onToggleTheme}>
					<button type="button" class={styles.linkButton} aria-label={props.themeLabel ?? "Toggle theme"} onClick={() => props.onToggleTheme?.()}>
						{props.themeLabel ?? "Theme"}
					</button>
				</Show>
			</nav>
		</footer>
	);
}
