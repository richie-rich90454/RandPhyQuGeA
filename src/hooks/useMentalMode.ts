import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {usePracticeStore, selectIsActive, selectIsFinished, selectMode, selectResults} from "../stores/practiceStore";
import {useSettingsStore} from "../stores/settingsStore";
import {useSpecStore} from "../stores/specStore";
import {useCountdownTimer} from "./useCountdownTimer";
import {useServices} from "./useServices";
import {useToast} from "../components/ui";
import {usePracticeActions} from "./usePracticeActions";
import {resolveTopicId} from "../lib/utils";
import type {Session} from "../services/contracts";

/**
 * Return value of {@link useMentalMode}.
 */
export interface UseMentalModeReturn {
    /** Current difficulty selection. */
    difficulty: "easy" | "medium" | "hard";
    /** Update the difficulty selection. */
    setDifficulty: (d: "easy" | "medium" | "hard") => void;
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
    check: () => Promise<void>;
}

/** Map difficulty labels to min/max difficulty ranges. */
const DIFFICULTY_RANGES: Record<"easy" | "medium" | "hard", {minDifficulty: number; maxDifficulty: number}> = {
    easy: {minDifficulty: 1, maxDifficulty: 2},
    medium: {minDifficulty: 3, maxDifficulty: 5},
    hard: {minDifficulty: 6, maxDifficulty: 7},
};

/** Auto-advance delay after showing feedback in mental mode (ms). */
const AUTO_ADVANCE_DELAY_MS = 1500;

/**
 * Mental-mode practice hook.
 *
 * Manages the full mental session lifecycle through the OOP service layer:
 * batch generation (or one-at-a-time for unlimited mode), countdown timer,
 * score tracking, auto-advance after feedback, skip, pause/resume, and session
 * finish on timer expiry or question exhaustion. Results are persisted to the
 * progress store as they are checked.
 */
export function useMentalMode(): UseMentalModeReturn {
    const {physics: physicsService, session: sessionService} = useServices();
    const difficulty = useSettingsStore(state => state.mentalDifficulty);
    const setDifficulty = useSettingsStore(state => state.setMentalDifficulty);
    const scope = useSettingsStore(state => state.mentalScope);
    const setScope = useSettingsStore(state => state.setMentalScope);
    const shuffle = useSettingsStore(state => state.mentalShuffle);
    const setShuffle = useSettingsStore(state => state.setMentalShuffle);
    const unlimited = useSettingsStore(state => state.mentalUnlimited);
    const setUnlimited = useSettingsStore(state => state.setMentalUnlimited);
    const isActive = usePracticeStore(selectIsActive);
    const isFinished = usePracticeStore(selectIsFinished);
    const mode = usePracticeStore(selectMode);
    const results = usePracticeStore(selectResults);
    const showFeedback = usePracticeStore(state => state.showFeedback);
    const specification = useSpecStore(state => state.specification);
    const mentalDurationSec = useSettingsStore(state => state.mentalDurationSec);
    const defaultQuestionCount = useSettingsStore(state => state.defaultQuestionCount);
    const {toast} = useToast();
    const timer = useCountdownTimer();
    const [isStarting, setIsStarting] = useState(false);
    const isStartingRef = useRef(false);
    const isSessionActive = isActive && mode === "Mental";
    const isPaused = isSessionActive && !timer.isRunning && timer.timeRemaining > 0;
    const {score, total, accuracy, avgTimeMs} = useMemo(() => {
        const total = results.length;
        const correct = results.filter(r => r.is_correct).length;
        const accuracy = total === 0 ? 0 : (correct / total) * 100;
        const totalTimeMs = results.reduce((sum, r) => sum + r.time_taken_ms, 0);
        const avgTimeMs = total === 0 ? 0 : totalTimeMs / total;
        return {score: correct, total, accuracy, avgTimeMs};
    }, [results]);
    const buildOptions = useCallback(() => {
        const range = DIFFICULTY_RANGES[difficulty];
        const topicId = resolveTopicId(specification!, scope, shuffle, undefined, false);
        return {topicId, ...range};
    }, [difficulty, specification, scope, shuffle]);
    const startSession = useCallback(async () => {
        if (isStartingRef.current) return;
        if (!specification) return;
        isStartingRef.current = true;
        setIsStarting(true);
        try {
            if (unlimited) {
                const question = await physicsService.generateQuestion(specification, buildOptions());
                const now = Date.now();
                const session: Session = {
                    id: crypto.randomUUID(),
                    specification,
                    questions: [question],
                    mode: "Mental",
                    currentIndex: 0,
                    results: [],
                    isActive: true,
                    isFinished: false,
                    questionStartTime: now,
                    sessionStartTime: now,
                };
                await sessionService.resumeSession({session, createdAt: new Date().toISOString()});
                const store = usePracticeStore.getState();
                store.setSession(session);
                store.resetAnswerUi();
            } else {
                const session = await sessionService.startSession(specification, {
                    mode: "Mental",
                    questionCount: defaultQuestionCount,
                    options: buildOptions(),
                    shuffle,
                });
                const store = usePracticeStore.getState();
                store.setSession(session);
                store.resetAnswerUi();
            }
            timer.start(mentalDurationSec);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            toast({variant: "error", message: "Failed to start mental session: " + message});
        } finally {
            isStartingRef.current = false;
            setIsStarting(false);
        }
    }, [specification, unlimited, physicsService, sessionService, buildOptions, defaultQuestionCount, shuffle, mentalDurationSec, timer, toast]);
    const pauseSession = useCallback(() => {
        timer.pause();
    }, [timer]);
    const resumeSession = useCallback(() => {
        timer.resume();
    }, [timer]);
    const advance = useCallback(async () => {
        const store = usePracticeStore.getState();
        const session = store.session;
        if (!session || !session.isActive || session.isFinished) return;
        if (unlimited) {
            if (!specification) return;
            try {
                const question = await physicsService.generateQuestion(specification, buildOptions());
                session.questions.push(question);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                toast({variant: "error", message: "Failed to generate next question: " + message});
                return;
            }
        }
        const advanced = await sessionService.advanceQuestion();
        if (advanced) {
            store.setSession(sessionService.getSession());
            store.resetAnswerUi();
        } else {
            await sessionService.finishSession();
            store.setSession(sessionService.getSession());
            timer.reset();
        }
    }, [unlimited, specification, physicsService, sessionService, buildOptions, toast, timer]);
    const {check} = usePracticeActions({mode: "Mental", shortcutEnabled: isSessionActive});
    const skipQuestion = useCallback(() => {
        const store = usePracticeStore.getState();
        if (!store.session || !store.session.isActive || store.session.mode !== "Mental") return;
        void advance();
    }, [advance]);
    useEffect(() => {
        if (!isSessionActive || isFinished) return;
        if (timer.timeRemaining === 0 && !timer.isRunning && mentalDurationSec > 0) {
            void (async () => {
                await sessionService.finishSession();
                const store = usePracticeStore.getState();
                store.setSession(sessionService.getSession());
                timer.reset();
            })();
        }
    }, [timer.timeRemaining, timer.isRunning, isSessionActive, isFinished, mentalDurationSec, sessionService, timer]);
    useEffect(() => {
        if (!showFeedback || !isSessionActive) return;
        const timerId = window.setTimeout(() => {
            void advance();
        }, AUTO_ADVANCE_DELAY_MS);
        return () => window.clearTimeout(timerId);
    }, [showFeedback, isSessionActive, advance]);
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
        check,
    };
}
