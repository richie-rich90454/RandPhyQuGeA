import {useEffect} from 'react';
import {useSettingsStore} from '../stores/settingsStore';
/**
 * Apply the user's theme preference to the document root.
 *
 * Reads `themeMode` from the settings store and toggles the `dark` class on
 * `document.documentElement`. When the mode is `system`, the hook follows the
 * OS `prefers-color-scheme` media query and updates live when it changes.
 * The `<meta name="theme-color">` tag is updated to match the active theme so
 * browser chrome (mobile address bar, PWA title bar) stays in sync.
 *
 * Should be called once at the application root.
 */
export function useTheme(): void {
	const themeMode = useSettingsStore(state => state.themeMode);
	useEffect(() => {
		const root = document.documentElement;
		const updateMetaThemeColor = (isDark: boolean) => {
			const meta = document.querySelector('meta[name="theme-color"]');
			if (meta) {
				meta.setAttribute('content', isDark ? '#1a1f2e' : '#F8FAFC');
			}
		};
		const applyTheme = (isDark: boolean) => {
			if (isDark) {
				root.classList.add('dark');
			} else {
				root.classList.remove('dark');
			}
			updateMetaThemeColor(isDark);
		};
		if (themeMode === 'dark') {
			applyTheme(true);
			return;
		}
		if (themeMode === 'light') {
			applyTheme(false);
			return;
		}
		// system: follow the OS preference and listen for changes.
		const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
		applyTheme(mediaQueryList.matches);
		const handleChange = (event: MediaQueryListEvent) => {
			applyTheme(event.matches);
		};
		mediaQueryList.addEventListener('change', handleChange);
		return () => {
			mediaQueryList.removeEventListener('change', handleChange);
		};
	}, [themeMode]);
}
