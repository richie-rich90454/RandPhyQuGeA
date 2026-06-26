import {useCallback} from 'react';
import {usePracticeStore} from '../stores/practiceStore';
/**
 * Return value of {@link useSingleMode}.
 */
export interface UseSingleModeReturn {
	/** Whether auto-generate (3s) is enabled. */
	autoEnabled: boolean;
	/** Update the auto-generate flag. */
	setAutoEnabled: (enabled: boolean) => void;
	/** Current scope (unit id or `'all'`). */
	scope: string;
	/** Update the single-mode scope. */
	setScope: (scope: string) => void;
	/** Whether random-topic shuffle is enabled. */
	shuffle: boolean;
	/** Update the shuffle flag. */
	setShuffle: (enabled: boolean) => void;
	/** True when a question is loaded and an answer can be checked. */
	canCheck: boolean;
	/** Generate a new question. Stubbed in Task 14; wired in Task 17. */
	generate: () => void;
	/** Check the current answer. Stubbed in Task 14; wired in Task 17. */
	check: () => void;
}
/**
 * Single-mode practice hook.
 *
 * Binds the single-mode toolbar controls (Auto, Scope, Shuffle) to the
 * practice store and exposes `generate`/`check` actions. In Task 14 the
 * actions are stubs; Task 17 wires them to the physics core and answer
 * evaluation.
 */
export function useSingleMode(): UseSingleModeReturn {
	const autoEnabled = usePracticeStore(state => state.autoEnabled);
	const setAutoEnabled = usePracticeStore(state => state.setAutoEnabled);
	const scope = usePracticeStore(state => state.scope);
	const setScope = usePracticeStore(state => state.setScope);
	const shuffle = usePracticeStore(state => state.shuffle);
	const setShuffle = usePracticeStore(state => state.setShuffle);
	const isActive = usePracticeStore(state => state.isActive);
	const showFeedback = usePracticeStore(state => state.showFeedback);
	const userAnswer = usePracticeStore(state => state.userAnswer);
	const selectedChoiceIndex = usePracticeStore(state => state.selectedChoiceIndex);
	const canCheck = isActive && !showFeedback && (userAnswer.trim() !== '' || selectedChoiceIndex >= 0);
	const generate = useCallback(() => {
		// Wired in Task 17: calls PhysicsCore.generateQuestion with current filters.
	}, []);
	const check = useCallback(() => {
		// Wired in Task 17: delegates to practiceStore.submitAnswer.
	}, []);
	return {autoEnabled, setAutoEnabled, scope, setScope, shuffle, setShuffle, canCheck, generate, check};
}
