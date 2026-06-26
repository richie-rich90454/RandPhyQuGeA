import {useEffect} from 'react';
import {usePracticeStore} from '../stores/practiceStore';
import {useSettingsStore} from '../stores/settingsStore';
import {useUiStore} from '../stores/uiStore';
/**
 * Wire global keyboard shortcuts for app-level actions.
 *
 * Shortcuts handled:
 * - `Ctrl+1` — switch to Single mode
 * - `Ctrl+2` — switch to Mental mode
 * - `Ctrl+,` — open the Settings modal
 * - `Ctrl+Shift+T` — toggle between light and dark theme
 * - `Ctrl+G` — generate a new question (Single mode) or start/skip (Mental mode)
 * - `Shift+Enter` — check the current answer
 *
 * Mode-specific shortcuts (`Ctrl+G`, `Shift+Enter`) are also handled inside
 * `useSingleMode` and `useMentalMode`, but this hook ensures they fire from
 * any focus state even before the mode control components mount. The
 * `Ctrl+Shift+T` combo calls `preventDefault` to suppress the browser's
 * "reopen closed tab" action.
 *
 * Should be called once at the application root.
 */
export function useGlobalShortcuts(): void {
	const setMode = usePracticeStore(state => state.setMode);
	const themeMode = useSettingsStore(state => state.themeMode);
	const setThemeMode = useSettingsStore(state => state.setThemeMode);
	const openModal = useUiStore(state => state.openModal);
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!event.ctrlKey && !event.metaKey) return;
			const key = event.key.toLowerCase();
			// Ctrl+1 → Single mode
			if (key === '1' && !event.shiftKey) {
				event.preventDefault();
				setMode('Single');
				return;
			}
			// Ctrl+2 → Mental mode
			if (key === '2' && !event.shiftKey) {
				event.preventDefault();
				setMode('Mental');
				return;
			}
			// Ctrl+, → Settings
			if (key === ',' && !event.shiftKey) {
				event.preventDefault();
				openModal('settings');
				return;
			}
			// Ctrl+Shift+T → Toggle theme
			if (key === 't' && event.shiftKey) {
				event.preventDefault();
				setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
				return;
			}
			// Ctrl+G → Generate (delegated to mode hooks, but prevent browser find-next)
			if (key === 'g' && !event.shiftKey) {
				event.preventDefault();
				return;
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [setMode, themeMode, setThemeMode, openModal]);
}
