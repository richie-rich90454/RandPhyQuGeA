import {createEffect, onCleanup} from "solid-js";
import {useSettingsStore} from "../stores/settingsStore";
import type {SettingsState, FontSize} from "../stores/settingsStore";
import type {SolidStore} from "../stores/createSolidStore";
/** BCP-47 primary language subtags whose default script is right-to-left. */
const RTL_LANGS=new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi", "ug"]);
/** Valid `FontSize` values; used to guard against persisted unknown values. */
const VALID_FONT_SIZES=new Set<FontSize>(["small", "medium", "large"]);
/**
 * Resolve whether a BCP-47 locale tag should render right-to-left.
 *
 * Accepts both bare language (`"ar"`) and region-tagged (`"ar-SA"`,
 * `"he-IL"`) forms by comparing only the primary subtag (case-insensitive).
 * Unknown / empty locales fall back to LTR.
 */
let isRtlLocale=(locale: string): boolean => {
	let lang=locale.split("-")[0]?.toLowerCase() ?? "";
	return RTL_LANGS.has(lang);
};
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
 * or OS preference. The `locale` setting is mirrored onto the document root's
 * `dir` attribute so RTL languages (ar, he, fa, ur, ...) flip the layout. The
 * `fontSize` setting is mirrored onto the document root's `data-font-size`
 * attribute so the `:root[data-font-size="..."]` rules in `globals.css` scale
 * the base `html { font-size }` token across every component that consumes rem
 * units. Listeners are disposed via `onCleanup`.
 */
export function createTheme(options: CreateThemeOptions = {}): void {
	let store=options.settingsStore ?? useSettingsStore;
	let themeMode=store(s => s.themeMode);
	let reducedMotion=store(s => s.reducedMotion);
	let locale=store(s => s.locale);
	let fontSize=store(s => s.fontSize);
	let root=document.documentElement;
	let colorSchemeMql=window.matchMedia("(prefers-color-scheme: dark)");
	let reducedMotionMql=window.matchMedia("(prefers-reduced-motion: reduce)");
	let updateMetaThemeColor=(content: string) => {
		let meta=document.querySelector('meta[name="theme-color"]');
		if (meta) {
			meta.setAttribute("content", content);
		}
	};
	let applyTheme=(isDark: boolean) => {
		root.setAttribute("data-theme", isDark ? "dark" : "light");
		updateMetaThemeColor(isDark ? "#1a1f2e" : "#F8FAFC");
	};
	let applyReducedMotion=(isReduced: boolean) => {
		if (isReduced) {
			root.setAttribute("data-reduce-motion", "");
		} else {
			root.removeAttribute("data-reduce-motion");
		}
	};
	let applyFontSize=(size: FontSize) => {
		if (VALID_FONT_SIZES.has(size)) {
			root.setAttribute("data-font-size", size);
		} else {
			root.setAttribute("data-font-size", "medium");
		}
	};
	createEffect(() => {
		let mode=themeMode();
		if (mode === "dark") {
			applyTheme(true);
		} else if (mode === "light") {
			applyTheme(false);
		} else if (mode === "dim") {
			root.setAttribute("data-theme", "dim");
			updateMetaThemeColor("#1a2744");
		} else {
			root.setAttribute("data-theme", "system");
			updateMetaThemeColor(colorSchemeMql.matches ? "#1a1f2e" : "#F8FAFC");
		}
	});
	createEffect(() => {
		applyReducedMotion(reducedMotion() || reducedMotionMql.matches);
	});
	createEffect(() => {
		root.dir=isRtlLocale(locale()) ? "rtl" : "ltr";
	});
	createEffect(() => {
		applyFontSize(fontSize());
	});
	let onColorSchemeChange=(event: MediaQueryListEvent) => {
		if (themeMode() === "system") {
			updateMetaThemeColor(event.matches ? "#1a1f2e" : "#F8FAFC");
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
