import {useCallback, useMemo} from 'react';
import {usePracticeStore} from '../stores/practiceStore';
import {useSettingsStore} from '../stores/settingsStore';
import {useCountdownTimer} from './useCountdownTimer';
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
	/** Start a new timed mental session. */
	startSession: () => void;
	/** Pause the running session. */
	pauseSession: () => void;
	/** Resume a paused session. */
	resumeSession: () => void;
	/** Skip the current question (stubbed in Task 14; wired in Task 18). */
	skipQuestion: () => void;
}
/**
 * Mental-mode practice hook.
 *
 * Manages the mental session lifecycle via {@link useCountdownTimer} and
 * derives score/accuracy from the practice store's results array. In Task 14
 * the session timer is functional (Start Session begins a countdown); actual
 * question generation and skip logic are wired in Task 18.
 */
export function useMentalMode(): UseMentalModeReturn {
	const difficulty = usePracticeStore(state => state.mentalDifficulty);
	const setDifficulty = usePracticeStore(state => state.setMentalDifficulty);
	const scope = usePracticeStore(state => state.mentalScope);
	const setScope = usePracticeStore(state => state.setMentalScope);
	const shuffle = usePracticeStore(state => state.mentalShuffle);
	const setShuffle = usePracticeStore(state => state.setMentalShuffle);
	const unlimited = usePracticeStore(state => state.mentalUnlimited);
	const setUnlimited = usePracticeStore(state => state.setMentalUnlimited);
	const isActive = usePracticeStore(state => state.isActive);
	const mode = usePracticeStore(state => state.mode);
	const results = usePracticeStore(state => state.results);
	const resetSession = usePracticeStore(state => state.resetSession);
	const mentalDurationSec = useSettingsStore(state => state.mentalDurationSec);
	const timer = useCountdownTimer();
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
	const startSession = useCallback(() => {
		resetSession();
		usePracticeStore.setState({mode: 'Mental', isActive: true, isFinished: false, sessionStartTime: Date.now()});
		timer.start(mentalDurationSec);
	}, [resetSession, timer, mentalDurationSec]);
	const pauseSession = useCallback(() => {
		timer.pause();
	}, [timer]);
	const resumeSession = useCallback(() => {
		timer.resume();
	}, [timer]);
	const skipQuestion = useCallback(() => {
		// Wired in Task 18: advances to the next generated question without recording a result.
	}, []);
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
		startSession,
		pauseSession,
		resumeSession,
		skipQuestion
	};
}
