import {onMount, onCleanup} from "solid-js";
import {useSettingsStore} from "../stores/settingsStore";
import type {SettingsState} from "../stores/settingsStore";
import {useUiStore} from "../stores/uiStore";
import type {UiState} from "../stores/uiStore";
import type {SolidStore} from "../stores/createSolidStore";
export interface CreateGlobalShortcutsOptions {
	settingsStore?: SolidStore<SettingsState>;
	uiStore?: SolidStore<UiState>;
}
/**
 * Wire global keyboard shortcuts for app-level actions.
 *
 * Solid port of {@link ../../hooks/useGlobalShortcuts}: registers a `keydown`
 * listener on `document` via `onMount` and removes it via `onCleanup`. The
 * handler reads the latest store state through `getState()` so it never closes
 * over stale values. Shortcuts: `Ctrl+1` Single mode, `Ctrl+2` Mental mode,
 * `Ctrl+,` Settings modal, `Ctrl+Shift+T` toggle light/dark theme.
 *
 * Scoping: all shortcuts are suppressed when a modal is open (the modal owns
 * the focus trap). Mode-switch shortcuts (`Ctrl+1`/`Ctrl+2`) are additionally
 * suppressed when the user is typing in a text field to avoid hijacking text
 * input. `Ctrl+G` (generate) is NOT handled here — it is delegated to the
 * practice page so it only fires on the relevant route.
 */
export function createGlobalShortcuts(options: CreateGlobalShortcutsOptions = {}): void {
	let settings = options.settingsStore ?? useSettingsStore;
	let ui = options.uiStore ?? useUiStore;
	let isTyping = (event: KeyboardEvent): boolean => {
		let target = event.target;
		if (!(target instanceof HTMLElement)) return false;
		return target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable;
	};
	let handleKeyDown = (event: KeyboardEvent) => {
		if (!event.ctrlKey && !event.metaKey) {
			return;
		}
		if (ui.getState().activeModal !== null) {
			return;
		}
		let key = event.key.toLowerCase();
		if (key === "1" && !event.shiftKey) {
			if (isTyping(event)) return;
			event.preventDefault();
			settings.getState().setDefaultMode("Single");
			return;
		}
		if (key === "2" && !event.shiftKey) {
			if (isTyping(event)) return;
			event.preventDefault();
			settings.getState().setDefaultMode("Mental");
			return;
		}
		if (key === "," && !event.shiftKey) {
			event.preventDefault();
			ui.getState().openModal("settings");
			return;
		}
		if (key === "t" && event.shiftKey) {
			event.preventDefault();
			let current = settings.getState().themeMode;
			settings.getState().setThemeMode(current === "dark" ? "light" : "dark");
			return;
		}
	};
	onMount(() => {
		document.addEventListener("keydown", handleKeyDown);
	});
	onCleanup(() => {
		document.removeEventListener("keydown", handleKeyDown);
	});
}
