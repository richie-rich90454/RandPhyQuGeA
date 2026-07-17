/**
 * Active practice session store (non-persisted), Solid port.
 *
 * Mirrors {@link ../../stores/practiceStore} state shape and actions, backed by
 * a Zustand-vanilla store exposed as a Solid reactive primitive via
 * {@link createSolidStore}. The selector helpers (`selectCurrentQuestion` etc.)
 * are pure functions over the state and are reused unchanged so Solid
 * components can subscribe idiomatically: `usePracticeStore(s => s.session)`.
 */
import {createStore} from "zustand/vanilla";
import {createSolidStore} from "./createSolidStore";
import type {Session} from "../../services/contracts";
import type {Specification, GeneratedQuestion, PracticeResult, PracticeMode} from "../../types/models";
export interface AnswerFeedback {
    isCorrect: boolean;
    correctAnswer: string;
    userAnswer?: string;
    partial?: boolean;
}
export interface PracticeState {
    session: Session | null;
    userAnswer: string;
    selectedChoiceIndex: number;
    selectedChoiceIndices: number[];
    showFeedback: boolean;
    lastResult: AnswerFeedback | null;
    selectedTopicId: string | null;
    setSession: (session: Session | null) => void;
    setUserAnswer: (answer: string) => void;
    selectChoice: (index: number) => void;
    toggleChoice: (index: number) => void;
    setSelectedChoiceIndices: (indices: number[]) => void;
    setShowFeedback: (show: boolean) => void;
    setLastResult: (result: AnswerFeedback | null) => void;
    setSelectedTopicId: (topicId: string | null) => void;
    resetSession: () => void;
    resetAnswerUi: () => void;
}
const initialSessionState = {
    session: null as Session | null,
    userAnswer: "",
    selectedChoiceIndex: -1,
    selectedChoiceIndices: [] as number[],
    showFeedback: false,
    lastResult: null as AnswerFeedback | null,
};
const initialConfigState = {
    selectedTopicId: null as string | null,
};
const practiceStore = createStore<PracticeState>()(set => ({
    ...initialSessionState,
    ...initialConfigState,
    setSession: session => set({session}),
    setUserAnswer: answer => set({userAnswer: answer}),
    selectChoice: index => set({selectedChoiceIndex: index}),
    toggleChoice: index =>
        set(state => {
            let current = state.selectedChoiceIndices;
            if (current.includes(index)) {
                return {selectedChoiceIndices: current.filter(i => i !== index)};
            }
            return {selectedChoiceIndices: [...current, index]};
        }),
    setSelectedChoiceIndices: indices => set({selectedChoiceIndices: indices}),
    setShowFeedback: show => set({showFeedback: show}),
    setLastResult: result => set({lastResult: result}),
    setSelectedTopicId: topicId => set({selectedTopicId: topicId}),
    resetSession: () => set({...initialSessionState}),
    resetAnswerUi: () => set({userAnswer: "", selectedChoiceIndex: -1, selectedChoiceIndices: [], showFeedback: false, lastResult: null}),
}));
export const usePracticeStore = createSolidStore<PracticeState>(practiceStore);
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
