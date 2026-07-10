import {createEffect, onCleanup} from "solid-js";
import {useSettingsStore} from "../stores/settingsStore";
import type {SettingsState} from "../stores/settingsStore";
import type {SolidStore} from "../stores/createSolidStore";
export interface CreateThemeOptions {
	settingsStore?: SolidStore<SettingsState>;
}
/**
 * Apply the user's theme preference to the document root.
 *
 * Solid port of {@link ../../hooks/useTheme}: reads `themeMode` and
 * `reducedMotion` from the settings store and writes the `data-theme` attribute
 * on `document.documentElement` (the token scheme used by the Solid
 * `globals.css`). When the mode is `system`, the OS `prefers-color-scheme`
 * media query is followed live. The `<meta name="theme-color">` tag is kept in
 * sync and a `data-reduce-motion` attribute reflects the reduced-motion setting
 * or OS preference. Listeners are disposed via `onCleanup`.
 */
export function createTheme(options: CreateThemeOptions = {}): void {
	let store=options.settingsStore ?? useSettingsStore;
	let themeMode=store(s => s.themeMode);
	let reducedMotion=store(s => s.reducedMotion);
	let root=document.documentElement;
	let colorSchemeMql=window.matchMedia("(prefers-color-scheme: dark)");
	let reducedMotionMql=window.matchMedia("(prefers-reduced-motion: reduce)");
	let updateMetaThemeColor=(isDark: boolean) => {
		let meta=document.querySelector('meta[name="theme-color"]');
		if (meta) {
			meta.setAttribute("content", isDark ? "#1a1f2e" : "#F8FAFC");
		}
	};
	let applyTheme=(isDark: boolean) => {
		root.setAttribute("data-theme", isDark ? "dark" : "light");
		updateMetaThemeColor(isDark);
	};
	let applyReducedMotion=(isReduced: boolean) => {
		if (isReduced) {
			root.setAttribute("data-reduce-motion", "");
		} else {
			root.removeAttribute("data-reduce-motion");
		}
	};
	createEffect(() => {
		let mode=themeMode();
		if (mode === "dark") {
			applyTheme(true);
		} else if (mode === "light") {
			applyTheme(false);
		} else {
			applyTheme(colorSchemeMql.matches);
		}
	});
	createEffect(() => {
		applyReducedMotion(reducedMotion() || reducedMotionMql.matches);
	});
	let onColorSchemeChange=(event: MediaQueryListEvent) => {
		if (themeMode() === "system") {
			applyTheme(event.matches);
		}
	};
	let onReducedMotionChange=() => {
		applyReducedMotion(reducedMotion() || reducedMotionMql.matches);
	};
	colorSchemeMql.addEventListener("change", onColorSchemeChange);
	reducedMotionMql.addEventListener("change", onReducedMotionChange);
	onCleanup(() => {
		colorSchemeMql.removeEventListener("change", onColorSchemeChange);
		reducedMotionMql.removeEventListener("change", onReducedMotionChange);
	});
}
