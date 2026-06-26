import {useCallback, useEffect} from 'react';
import {usePracticeStore} from '../stores/practiceStore';
import {useProgressStore} from '../stores/progressStore';
import type {PracticeMode} from '../types/models';
export interface UsePracticeActionsOptions {
	/** Restrict checking to a specific mode. Omit to accept any active mode. */
	mode?: PracticeMode;
	/** Whether the Shift+Enter submit shortcut is active. Defaults to true. */
	shortcutEnabled?: boolean;
}
export interface UsePracticeActionsReturn {
	/** Evaluate the current answer, persist the result, and reveal feedback. */
	check: () => void;
}
/**
 * Shared practice submission logic for Single and Mental modes.
 *
 * `check` delegates to `practiceStore.submitAnswer`, then persists the latest
 * `PracticeResult` to the progress store so it survives reloads. The optional
 * `mode` filter mirrors the per-mode guard each hook previously inlined
 * (Mental rejects submissions outside a Mental session). The Shift+Enter
 * shortcut is extracted here so both modes share one keydown listener instead
 * of duplicating it; gate it via `shortcutEnabled` (e.g. Mental only listens
 * while a session is active).
 */
export function usePracticeActions(options: UsePracticeActionsOptions = {}): UsePracticeActionsReturn {
	const {mode, shortcutEnabled = true} = options;
	const check = useCallback(() => {
		const store = usePracticeStore.getState();
		if (!store.isActive || store.showFeedback) return;
		if (mode !== undefined && store.mode !== mode) return;
		store.submitAnswer();
		const updated = usePracticeStore.getState();
		const latest = updated.results[updated.results.length - 1];
		if (latest) {
			useProgressStore.getState().addResults([latest]);
		}
	}, [mode]);
	useEffect(() => {
		if (!shortcutEnabled) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.shiftKey && event.key === 'Enter') {
				const target = event.target as HTMLElement | null;
				if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
					event.preventDefault();
					check();
				}
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [check, shortcutEnabled]);
	return {check};
}
