import type {JSX} from "solid-js";
import {For, createMemo} from "solid-js";
import {useUiStore} from "../../stores/uiStore";
import type {ModalId} from "../../stores/uiStore";
import {useSettingsStore} from "../../stores/settingsStore";
import type {ThemeMode} from "../../stores/settingsStore";
import {useToast} from "../ui/Toast";
import styles from "./UtilityButtons.module.css";
/** Inline SVG icon path for each utility button. */
const ICON_PATHS = {
	theme: "M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z",
	help: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z",
	shortcuts:
		"M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2zm0 3h2v2h-2zM8 8h2v2H8zm0 3h2v2H8zm-1 2H5v-2h2zm0-3H5V8h2zm9 7H8v-2h8zm0-4h-2v-2h2zm0-3h-2V8h2zm3 3h-2v-2h2zm0-3h-2V8h2z",
	settings:
		"M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
	print: "M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z",
	recommend: "M12 2L15 9H22L16 14L19 21L12 16.5L5 21L8 14L2 9H9L12 2Z",
	manageData: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z",
} as const;
type IconName = keyof typeof ICON_PATHS;
interface UtilityButtonConfig {
	id: ModalId | "theme";
	label: string;
	title: string;
	icon: IconName;
}
/** Ordered utility buttons rendered in the toolbar's top row. */
const BUTTONS: readonly UtilityButtonConfig[] = [
	{id: "theme", label: "Toggle theme", title: "Toggle light/dark theme", icon: "theme"},
	{id: "onboarding", label: "Help", title: "Show onboarding help", icon: "help"},
	{id: "shortcuts", label: "Keyboard shortcuts", title: "Show keyboard shortcuts", icon: "shortcuts"},
	{id: "settings", label: "Settings", title: "Open settings", icon: "settings"},
	{id: "print", label: "Print worksheet", title: "Generate printable worksheet", icon: "print"},
	{id: "recommend", label: "Recommend topics", title: "Recommend topics to practice", icon: "recommend"},
	{id: "manage-data", label: "Manage data", title: "Manage performance data", icon: "manageData"},
];
function SunIcon(): JSX.Element {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</svg>
	);
}
function MoonIcon(): JSX.Element {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	);
}
function EclipseIcon(): JSX.Element {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<circle cx="15" cy="14" r="6" fill="currentColor" stroke="none" />
		</svg>
	);
}
function ContrastIcon(): JSX.Element {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
		</svg>
	);
}
function ThemeIcon(props: {mode: ThemeMode}): JSX.Element {
	if (props.mode === "light") {
		return <SunIcon />;
	} else if (props.mode === "dark") {
		return <MoonIcon />;
	} else if (props.mode === "dim") {
		return <EclipseIcon />;
	} else {
		return <ContrastIcon />;
	}
}
/**
 * Utility icon buttons for theme, help, shortcuts, settings, print, recommend, and data management.
 *
 * Solid port of {@link ../../../components/practice/UtilityButtons}. The theme
 * button cycles the persisted theme mode (light → dark → dim → system → light);
 * every other button opens its corresponding modal via the UI store. Icons are
 * inline SVGs (no `@phosphor-icons/react` dependency). Theme state is surfaced
 * via `aria-pressed` (`true` for dark, `"mixed"` for system/dim, `false` for
 * light) and a dynamic tooltip shows the current mode.
 */
export function UtilityButtons(): JSX.Element {
	let themeMode = useSettingsStore(s => s.themeMode);
	let {toast} = useToast();
	let themeAriaPressed = createMemo<boolean | "mixed">(() => {
		let mode = themeMode();
		if (mode === "dark") return true;
		if (mode === "system" || mode === "dim") return "mixed";
		return false;
	});
	let themeTitle = createMemo(() => {
		let mode = themeMode();
		let label = mode === "light" ? "Light" : mode === "dark" ? "Dark" : mode === "dim" ? "Dim" : "System";
		return `Theme: ${label} (click to cycle)`;
	});
	let handleThemeToggle = () => {
		let current = useSettingsStore.getState().themeMode;
		let next: ThemeMode = current === "light" ? "dark" : current === "dark" ? "dim" : current === "dim" ? "system" : "light";
		useSettingsStore.getState().setThemeMode(next);
		toast({variant: "info", message: "Theme: " + next});
	};
	let handleClick = (id: UtilityButtonConfig["id"]) => {
		if (id === "theme") {
			handleThemeToggle();
			return;
		}
		useUiStore.getState().openModal(id);
	};
	return (
		<div class={styles.buttons}>
			<For each={BUTTONS}>
				{button => {
					let isTheme = button.id === "theme";
					let pressed = () => (isTheme ? themeAriaPressed() : undefined);
					let title = () => (isTheme ? themeTitle() : button.title);
					return (
						<button type="button" class={styles.iconButton} aria-label={button.label} aria-pressed={pressed()} title={title()} onClick={() => handleClick(button.id)}>
							{isTheme ? (
								<ThemeIcon mode={themeMode()} />
							) : (
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d={ICON_PATHS[button.icon]} />
								</svg>
							)}
						</button>
					);
				}}
			</For>
		</div>
	);
}
