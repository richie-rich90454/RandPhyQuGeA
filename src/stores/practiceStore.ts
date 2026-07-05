/**
 * Active practice session store (non-persisted).
 *
 * Holds only UI/session state and practice configuration. All business logic
 * lives in the OOP service layer, accessed via {@link useServices}. The
 * authoritative session object is the single source of truth for the session
 * lifecycle; every derived value is computed from it.
 */
import {create} from "zustand";
import type {Session} from "../services/contracts";
import type {Specification, GeneratedQuestion, PracticeResult, PracticeMode} from "../types/models";
export interface AnswerFeedback {
	isCorrect: boolean;
	correctAnswer: string;
}
export interface PracticeState {
	// The active session (null when no session is running).
	session: Session | null;
	// UI-only state for the current question.
	userAnswer: string;
	selectedChoiceIndex: number;
	showFeedback: boolean;
	lastResult: AnswerFeedback | null;
	// Practice configuration (persists across session resets).
	selectedTopicId: string | null;
	mcqEnabled: boolean;
	// Single-mode configuration (persists across session resets).
	autoEnabled: boolean;
	scope: string;
	shuffle: boolean;
	// Actions
	setSession: (session: Session | null) => void;
	setUserAnswer: (answer: string) => void;
	selectChoice: (index: number) => void;
	setShowFeedback: (show: boolean) => void;
	setLastResult: (result: AnswerFeedback | null) => void;
	setSelectedTopicId: (topicId: string | null) => void;
	setMcqEnabled: (enabled: boolean) => void;
	setAutoEnabled: (enabled: boolean) => void;
	setScope: (scope: string) => void;
	setShuffle: (enabled: boolean) => void;
	resetSession: () => void;
	resetAnswerUi: () => void;
}
const initialSessionState = {
	session: null as Session | null,
	userAnswer: "",
	selectedChoiceIndex: -1,
	showFeedback: false,
	lastResult: null as AnswerFeedback | null,
};
const initialConfigState = {
	selectedTopicId: null as string | null,
	mcqEnabled: false,
	autoEnabled: false,
	scope: "all",
	shuffle: false,
};
export const usePracticeStore = create<PracticeState>()((set) => ({
	...initialSessionState,
	...initialConfigState,
	setSession: session => set({session}),
	setUserAnswer: answer => set({userAnswer: answer}),
	selectChoice: index => set({selectedChoiceIndex: index}),
	setShowFeedback: show => set({showFeedback: show}),
	setLastResult: result => set({lastResult: result}),
	setSelectedTopicId: topicId => set({selectedTopicId: topicId}),
	setMcqEnabled: enabled => set({mcqEnabled: enabled}),
	setAutoEnabled: enabled => set({autoEnabled: enabled}),
	setScope: scope => set({scope}),
	setShuffle: enabled => set({shuffle: enabled}),
	resetSession: () => set({...initialSessionState}),
	resetAnswerUi: () => set({userAnswer: "", selectedChoiceIndex: -1, showFeedback: false, lastResult: null}),
}));
/** Derive the current question from the active session. */
export function selectCurrentQuestion(state: PracticeState): GeneratedQuestion | null {
	const session = state.session;
	if (!session) return null;
	return session.questions[session.currentIndex] ?? null;
}
/** Derive whether a session is currently active. */
export function selectIsActive(state: PracticeState): boolean {
	return state.session?.isActive ?? false;
}
/** Derive whether the active session has finished. */
export function selectIsFinished(state: PracticeState): boolean {
	return state.session?.isFinished ?? false;
}
/** Derive the mode of the active session. */
export function selectMode(state: PracticeState): PracticeMode {
	return state.session?.mode ?? "Single";
}
/** Derive the results of the active session. */
export function selectResults(state: PracticeState): PracticeResult[] {
	return state.session?.results ?? [];
}
/** Derive the current question index of the active session. */
export function selectCurrentIndex(state: PracticeState): number {
	return state.session?.currentIndex ?? 0;
}
/** Derive the questions of the active session. */
export function selectQuestions(state: PracticeState): GeneratedQuestion[] {
	return state.session?.questions ?? [];
}
/** Derive the question start time of the active session. */
export function selectQuestionStartTime(state: PracticeState): number | null {
	return state.session?.questionStartTime ?? null;
}
/** Derive the session start time of the active session. */
export function selectSessionStartTime(state: PracticeState): number | null {
	return state.session?.sessionStartTime ?? null;
}
/** Derive the specification of the active session. */
export function selectSpecification(state: PracticeState): Specification | null {
	return state.session?.specification ?? null;
}
