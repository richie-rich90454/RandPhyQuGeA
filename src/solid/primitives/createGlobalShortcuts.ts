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
 * `Ctrl+,` Settings modal, `Ctrl+Shift+T` toggle light/dark theme, `Ctrl+G`
 * preventDefault (generation is delegated to the mode primitives).
 */
export function createGlobalShortcuts(options: CreateGlobalShortcutsOptions = {}): void {
	let settings=options.settingsStore ?? useSettingsStore;
	let ui=options.uiStore ?? useUiStore;
	let handleKeyDown=(event: KeyboardEvent) => {
		if (!event.ctrlKey && !event.metaKey) {
			return;
		}
		let key=event.key.toLowerCase();
		if (key === "1" && !event.shiftKey) {
			event.preventDefault();
			settings.getState().setDefaultMode("Single");
			return;
		}
		if (key === "2" && !event.shiftKey) {
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
			let current=settings.getState().themeMode;
			settings.getState().setThemeMode(current === "dark" ? "light" : "dark");
			return;
		}
		if (key === "g" && !event.shiftKey) {
			event.preventDefault();
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
