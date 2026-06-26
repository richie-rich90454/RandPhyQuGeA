import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {usePracticeStore} from '../stores/practiceStore';
import {useSettingsStore} from '../stores/settingsStore';
import {useSpecStore} from '../stores/specStore';
import {useProgressStore} from '../stores/progressStore';
import {useCountdownTimer} from './useCountdownTimer';
import {generateBatch, generateQuestion} from '../services/physicsCore';
import {useToast} from '../components/ui';
import type {Specification} from '../types/models';
/**
 * Return value of {@link useMentalMode}.
 */
export interface UseMentalModeReturn {
	/** Current difficulty selection. */
	difficulty: 'easy' | 'medium' | 'hard';
	/** Update the difficulty selection. */
	setDifficulty: (d: 'easy' | 'medium' | 'hard') => void;
	/** Current mental scope (unit id or `'all'`). */
	scope: string;
	/** Update the mental scope. */
	setScope: (scope: string) => void;
	/** Whether mental shuffle is enabled. */
	shuffle: boolean;
	/** Update the mental shuffle flag. */
	setShuffle: (enabled: boolean) => void;
	/** Whether unlimited practice is enabled. */
	unlimited: boolean;
	/** Update the unlimited flag. */
	setUnlimited: (enabled: boolean) => void;
	/** Seconds remaining in the current session. */
	timeRemaining: number;
	/** True while the session is paused. */
	isPaused: boolean;
	/** True while a mental session is in progress. */
	isSessionActive: boolean;
	/** Number of correct answers this session. */
	score: number;
	/** Total questions answered this session. */
	total: number;
	/** Accuracy percentage (0–100). */
	accuracy: number;
	/** Average time per question in milliseconds. */
	avgTimeMs: number;
	/** True when the session has finished (timer expired or questions exhausted). */
	isFinished: boolean;
	/** True while a mental session is being started (batch generation). */
	isStarting: boolean;
	/** Start a new timed mental session. */
	startSession: () => Promise<void>;
	/** Pause the running session. */
	pauseSession: () => void;
	/** Resume a paused session. */
	resumeSession: () => void;
	/** Skip the current question without recording a result. */
	skipQuestion: () => void;
	/** Check the current answer and persist the result. */
	check: () => void;
}
/** Map difficulty labels to min/max difficulty ranges. */
const DIFFICULTY_RANGES: Record<'easy' | 'medium' | 'hard', {minDifficulty: number; maxDifficulty: number}> = {
	easy: {minDifficulty: 1, maxDifficulty: 2},
	medium: {minDifficulty: 3, maxDifficulty: 5},
	hard: {minDifficulty: 6, maxDifficulty: 7}
};
/** Auto-advance delay after showing feedback in mental mode (ms). */
const AUTO_ADVANCE_DELAY_MS = 1500;
/**
 * Resolve the topic id for mental-mode question generation.
 *
 * When shuffle is enabled a random topic from the scope is picked; otherwise
 * the scope is used as a unit filter without a specific topic.
 */
function resolveMentalTopicId(specification: Specification, scope: string, shuffle: boolean): string | undefined {
	const candidateTopics = scope === 'all' ? specification.topics : specification.topics.filter(t => t.unit_id === scope);
	if (candidateTopics.length === 0) return undefined;
	if (shuffle) {
		const index = Math.floor(Math.random() * candidateTopics.length);
		return candidateTopics[index]?.id;
	}
	return undefined;
}
/**
 * Mental-mode practice hook.
 *
 * Manages the full mental session lifecycle: batch generation (or one-at-a-time
 * for unlimited mode), countdown timer, score tracking, auto-advance after
 * feedback, skip, pause/resume, and session finish on timer expiry or question
 * exhaustion. Results are persisted to the progress store as they are checked.
 */
export function useMentalMode(): UseMentalModeReturn {
	const difficulty = useSettingsStore(state => state.mentalDifficulty);
	const setDifficulty = useSettingsStore(state => state.setMentalDifficulty);
	const scope = useSettingsStore(state => state.mentalScope);
	const setScope = useSettingsStore(state => state.setMentalScope);
	const shuffle = useSettingsStore(state => state.mentalShuffle);
	const setShuffle = useSettingsStore(state => state.setMentalShuffle);
	const unlimited = useSettingsStore(state => state.mentalUnlimited);
	const setUnlimited = useSettingsStore(state => state.setMentalUnlimited);
	const isActive = usePracticeStore(state => state.isActive);
	const isFinished = usePracticeStore(state => state.isFinished);
	const mode = usePracticeStore(state => state.mode);
	const results = usePracticeStore(state => state.results);
	const showFeedback = usePracticeStore(state => state.showFeedback);
	const specification = useSpecStore(state => state.specification);
	const mentalDurationSec = useSettingsStore(state => state.mentalDurationSec);
	const defaultQuestionCount = useSettingsStore(state => state.defaultQuestionCount);
	const {toast} = useToast();
	const timer = useCountdownTimer();
	const [isStarting, setIsStarting] = useState(false);
	const isStartingRef = useRef(false);
	const isSessionActive = isActive && mode === 'Mental';
	const isPaused = isSessionActive && !timer.isRunning && timer.timeRemaining > 0;
	const {score, total, accuracy, avgTimeMs} = useMemo(() => {
		const total = results.length;
		const correct = results.filter(r => r.is_correct).length;
		const accuracy = total === 0 ? 0 : (correct / total) * 100;
		const totalTimeMs = results.reduce((sum, r) => sum + r.time_taken_ms, 0);
		const avgTimeMs = total === 0 ? 0 : totalTimeMs / total;
		return {score: correct, total, accuracy, avgTimeMs};
	}, [results]);
	const startSession = useCallback(async () => {
		if (isStartingRef.current) return;
		if (!specification) return;
		isStartingRef.current = true;
		setIsStarting(true);
		const range = DIFFICULTY_RANGES[difficulty];
		const topicId = resolveMentalTopicId(specification, scope, shuffle);
		const options = {topicId, ...range};
		try {
			if (unlimited) {
				const question = await generateQuestion(specification, options);
				usePracticeStore.getState().startSession(specification, [question], 'Mental');
			} else {
				const batch = await generateBatch(specification, defaultQuestionCount, options);
				usePracticeStore.getState().startSession(specification, batch, 'Mental');
			}
			timer.start(mentalDurationSec);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			toast({variant: 'error', message: 'Failed to start mental session: ' + message});
		} finally {
			isStartingRef.current = false;
			setIsStarting(false);
		}
	}, [specification, difficulty, scope, shuffle, unlimited, defaultQuestionCount, mentalDurationSec, timer, toast]);
	const pauseSession = useCallback(() => {
		timer.pause();
	}, [timer]);
	const resumeSession = useCallback(() => {
		timer.resume();
	}, [timer]);
	const check = useCallback(() => {
		const store = usePracticeStore.getState();
		if (!store.isActive || store.showFeedback || store.mode !== 'Mental') return;
		store.submitAnswer();
		const updated = usePracticeStore.getState();
		const latest = updated.results[updated.results.length - 1];
		if (latest) {
			useProgressStore.getState().addResults([latest]);
		}
	}, []);
	const skipQuestion = useCallback(() => {
		const store = usePracticeStore.getState();
		if (!store.isActive || store.mode !== 'Mental') return;
		if (unlimited) {
			void (async () => {
				if (!specification) return;
				const range = DIFFICULTY_RANGES[difficulty];
				const topicId = resolveMentalTopicId(specification, scope, shuffle);
				try {
					const question = await generateQuestion(specification, {topicId, ...range});
					store.loadQuestion(question);
					usePracticeStore.setState({mode: 'Mental', isActive: true});
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					toast({variant: 'error', message: 'Failed to generate next question: ' + message});
				}
			})();
		} else {
			store.advanceQuestion();
		}
	}, [unlimited, specification, difficulty, scope, shuffle, toast]);
	useEffect(() => {
		if (!isSessionActive || isFinished) return;
		if (timer.timeRemaining === 0 && !timer.isRunning && mentalDurationSec > 0) {
			usePracticeStore.getState().finishSession();
			timer.reset();
		}
	}, [timer.timeRemaining, timer.isRunning, isSessionActive, isFinished, mentalDurationSec, timer]);
	useEffect(() => {
		if (!showFeedback || !isSessionActive) return;
		const handleAdvance = async () => {
			const store = usePracticeStore.getState();
			if (unlimited) {
				if (!specification) return;
				const range = DIFFICULTY_RANGES[difficulty];
				const topicId = resolveMentalTopicId(specification, scope, shuffle);
				try {
					const question = await generateQuestion(specification, {topicId, ...range});
					store.loadQuestion(question);
					usePracticeStore.setState({mode: 'Mental', isActive: true});
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					toast({variant: 'error', message: 'Failed to auto-advance: ' + message});
				}
			} else {
				store.advanceQuestion();
			}
		};
		const timerId = window.setTimeout(() => {
			void handleAdvance();
		}, AUTO_ADVANCE_DELAY_MS);
		return () => window.clearTimeout(timerId);
	}, [showFeedback, isSessionActive, unlimited, specification, difficulty, scope, shuffle, toast]);
	useEffect(() => {
		if (!isSessionActive) return;
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
	}, [isSessionActive, check]);
	return {
		difficulty,
		setDifficulty,
		scope,
		setScope,
		shuffle,
		setShuffle,
		unlimited,
		setUnlimited,
		timeRemaining: timer.timeRemaining,
		isPaused,
		isSessionActive,
		score,
		total,
		accuracy,
		avgTimeMs,
		isFinished,
		isStarting,
		startSession,
		pauseSession,
		resumeSession,
		skipQuestion,
		check
	};
}
