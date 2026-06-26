import {useCallback, useEffect} from 'react';
import {usePracticeStore} from '../stores/practiceStore';
import {useSpecStore} from '../stores/specStore';
import {useProgressStore} from '../stores/progressStore';
import {generateQuestion} from '../services/physicsCore';
import type {Specification} from '../types/models';
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
	/** Generate a new question via the physics core and load it into the store. */
	generate: () => Promise<void>;
	/** Check the current answer, evaluate, and persist the result. */
	check: () => void;
}
/**
 * Resolve the topic id to scope question generation to.
 *
 * Priority: explicitly selected topic > random topic from the scope unit
 * (when shuffle or a non-`all` scope is active) > undefined (all topics).
 */
function resolveTopicId(specification: Specification, selectedTopicId: string | null, scope: string, shuffle: boolean): string | undefined {
	if (selectedTopicId) return selectedTopicId;
	const candidateTopics = scope === 'all' ? specification.topics : specification.topics.filter(t => t.unit_id === scope);
	if (candidateTopics.length === 0) return undefined;
	if (shuffle || scope !== 'all') {
		const index = Math.floor(Math.random() * candidateTopics.length);
		const picked = candidateTopics[index];
		return picked?.id;
	}
	return undefined;
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
	const canCheck = isActive && !showFeedback && (userAnswer.trim() !== '' || selectedChoiceIndex >= 0);
	const generate = useCallback(async () => {
		if (!specification) return;
		const topicId = resolveTopicId(specification, selectedTopicId, scope, shuffle);
		const questionType = mcqEnabled ? 'MultipleChoice' : undefined;
		try {
			const question = await generateQuestion(specification, {topicId, questionType});
			usePracticeStore.getState().loadQuestion(question);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error('Failed to generate question:', message);
		}
	}, [specification, selectedTopicId, scope, shuffle, mcqEnabled]);
	const check = useCallback(() => {
		const store = usePracticeStore.getState();
		if (!store.isActive || store.showFeedback) return;
		store.submitAnswer();
		const updated = usePracticeStore.getState();
		const latest = updated.results[updated.results.length - 1];
		if (latest) {
			useProgressStore.getState().addResults([latest]);
		}
	}, []);
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
	}, [generate, check]);
	return {autoEnabled, setAutoEnabled, scope, setScope, shuffle, setShuffle, canCheck, generate, check};
}
