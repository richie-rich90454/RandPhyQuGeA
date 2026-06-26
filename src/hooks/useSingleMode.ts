import {useCallback, useEffect, useRef, useState} from 'react';
import {usePracticeStore} from '../stores/practiceStore';
import {useSpecStore} from '../stores/specStore';
import {generateQuestion} from '../services/physicsCore';
import {useToast} from '../components/ui';
import {usePracticeActions} from './usePracticeActions';
import {resolveTopicId} from '../lib/utils';
import {QUESTION_TYPES} from '../types/models';
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
	/** True while a question is being generated. */
	isGenerating: boolean;
	/** Generate a new question via the physics core and load it into the store. */
	generate: () => Promise<void>;
	/** Check the current answer, evaluate, and persist the result. */
	check: () => void;
}
/**
 * Single-mode practice hook.
 *
 * Wires the Generate/Check buttons to the physics core and practice store.
 * Generate resolves a topic (from the selected pill, the scope unit, or
 * random shuffle), calls `generateQuestion`, and loads the result into the
 * store via `loadQuestion` (which preserves accumulated results). Check
 * delegates to `submitAnswer` and persists the latest result to the
 * progress store so it survives reloads. Auto-generate fires 3s after
 * feedback is shown. Ctrl+G triggers generate globally; Shift+Enter
 * triggers check from within a textarea/input.
 */
export function useSingleMode(): UseSingleModeReturn {
	const autoEnabled = usePracticeStore(state => state.autoEnabled);
	const setAutoEnabled = usePracticeStore(state => state.setAutoEnabled);
	const scope = usePracticeStore(state => state.scope);
	const setScope = usePracticeStore(state => state.setScope);
	const shuffle = usePracticeStore(state => state.shuffle);
	const setShuffle = usePracticeStore(state => state.setShuffle);
	const selectedTopicId = usePracticeStore(state => state.selectedTopicId);
	const mcqEnabled = usePracticeStore(state => state.mcqEnabled);
	const isActive = usePracticeStore(state => state.isActive);
	const showFeedback = usePracticeStore(state => state.showFeedback);
	const userAnswer = usePracticeStore(state => state.userAnswer);
	const selectedChoiceIndex = usePracticeStore(state => state.selectedChoiceIndex);
	const specification = useSpecStore(state => state.specification);
	const {toast} = useToast();
	const canCheck = isActive && !showFeedback && (userAnswer.trim() !== '' || selectedChoiceIndex >= 0);
	const [isGenerating, setIsGenerating] = useState(false);
	const isGeneratingRef = useRef(false);
	const generate = useCallback(async () => {
		if (isGeneratingRef.current) return;
		if (!specification) return;
		isGeneratingRef.current = true;
		setIsGenerating(true);
		const topicId = resolveTopicId(specification, scope, shuffle, selectedTopicId);
		const questionType = mcqEnabled ? QUESTION_TYPES.MC : undefined;
		try {
			const question = await generateQuestion(specification, {topicId, questionType});
			usePracticeStore.getState().loadQuestion(question);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			toast({variant: 'error', message: 'Failed to generate question: ' + message});
		} finally {
			isGeneratingRef.current = false;
			setIsGenerating(false);
		}
	}, [specification, selectedTopicId, scope, shuffle, mcqEnabled, toast]);
	const {check} = usePracticeActions();
	useEffect(() => {
		if (showFeedback && autoEnabled) {
			const timer = window.setTimeout(() => {
				void generate();
			}, 3000);
			return () => window.clearTimeout(timer);
		}
	}, [showFeedback, autoEnabled, generate]);
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && (event.key === 'g' || event.key === 'G')) {
				event.preventDefault();
				void generate();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [generate]);
	return {autoEnabled, setAutoEnabled, scope, setScope, shuffle, setShuffle, canCheck, isGenerating, generate, check};
}
