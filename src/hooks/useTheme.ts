import {useEffect} from "react";
import {useSettingsStore} from "../stores/settingsStore";
/**
 * Apply the user's theme preference to the document root.
 *
 * Reads `themeMode` from the settings store and toggles the `dark` class on
 * `document.documentElement`. When the mode is `system`, the hook follows the
 * OS `prefers-color-scheme` media query and updates live when it changes.
 * The `<meta name="theme-color">` tag is updated to match the active theme so
 * browser chrome (mobile address bar, PWA title bar) stays in sync.
 * Motion is reduced when the user enables `reducedMotion` or the OS prefers
 * reduced motion, by toggling the `reduce-motion` class on the root element.
 *
 * Should be called once at the application root.
 */
export function useTheme(): void {
	const themeMode=useSettingsStore(state => state.themeMode);
	const reducedMotion=useSettingsStore(state => state.reducedMotion);
	useEffect(() => {
		const root=document.documentElement;
		const updateMetaThemeColor=(isDark: boolean) => {
			const meta=document.querySelector('meta[name="theme-color"]');
			if (meta) {
				meta.setAttribute("content", isDark ? "#1a1f2e" : "#F8FAFC");
			}
		};
		const applyTheme=(isDark: boolean) => {
			if (isDark) {
				root.classList.add("dark");
			}
			else {
				root.classList.remove("dark");
			}
			updateMetaThemeColor(isDark);
		};
		const applyReducedMotion=(isReduced: boolean) => {
			if (isReduced) {
				root.classList.add("reduce-motion");
			}
			else {
				root.classList.remove("reduce-motion");
			}
		};
		let colorSchemeQuery: MediaQueryList | undefined;
		let handleColorSchemeChange: ((event: MediaQueryListEvent) => void) | undefined;
		if (themeMode === "dark") {
			applyTheme(true);
		}
		else if (themeMode === "light") {
			applyTheme(false);
		}
		else {
			colorSchemeQuery=window.matchMedia("(prefers-color-scheme: dark)");
			applyTheme(colorSchemeQuery.matches);
			handleColorSchemeChange=(event: MediaQueryListEvent) => {
				applyTheme(event.matches);
			};
			colorSchemeQuery.addEventListener("change", handleColorSchemeChange);
		}
		const reducedMotionQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
		const updateReducedMotion=() => {
			applyReducedMotion(reducedMotion || reducedMotionQuery.matches);
		};
		updateReducedMotion();
		const handleReducedMotionChange=() => {
			updateReducedMotion();
		};
		reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
		return () => {
			if (colorSchemeQuery && handleColorSchemeChange) {
				colorSchemeQuery.removeEventListener("change", handleColorSchemeChange);
			}
			reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
		};
	}, [themeMode, reducedMotion]);
}
