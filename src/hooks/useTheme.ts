import {useEffect} from 'react';
import {useSettingsStore} from '../stores/settingsStore';

/**
 * Apply the user's theme preference to the document root.
 *
 * Reads `themeMode` from the settings store and toggles the `dark` class on
 * `document.documentElement`. When the mode is `system`, the hook follows the
 * OS `prefers-color-scheme` media query and updates live when it changes.
 *
 * Should be called once at the application root.
 */
export function useTheme(): void {
	const themeMode = useSettingsStore(state => state.themeMode);

	useEffect(() => {
		const root = document.documentElement;

		const applyTheme = (isDark: boolean) => {
			if (isDark) {
				root.classList.add('dark');
			} else {
				root.classList.remove('dark');
			}
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
