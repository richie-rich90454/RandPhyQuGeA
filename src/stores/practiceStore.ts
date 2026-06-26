/**
 * Active practice session store (non-persisted).
 *
 * Holds the in-flight session state: the parsed specification, the
 * generated questions, the user's progress, and per-question answer
 * evaluation. State is reset whenever a new session starts.
 */
import {create} from 'zustand';
import type {Specification, GeneratedQuestion, PracticeResult, PracticeMode} from '../types/models';

export interface AnswerFeedback {
	isCorrect: boolean;
	correctAnswer: string;
}

export interface PracticeState {
	// Session state
	specification: Specification | null;
	questions: GeneratedQuestion[];
	currentIndex: number;
	results: PracticeResult[];
	mode: PracticeMode;
	isActive: boolean;
	isFinished: boolean;
	questionStartTime: number | null;
	sessionStartTime: number | null;
	userAnswer: string;
	selectedChoiceIndex: number;
	showFeedback: boolean;
	lastResult: AnswerFeedback | null;
	// Practice configuration (persists across session resets)
	selectedTopicId: string | null;
	mcqEnabled: boolean;
	// Actions
	setMode: (mode: PracticeMode) => void;
	setSelectedTopicId: (topicId: string | null) => void;
	setMcqEnabled: (enabled: boolean) => void;
	startSession: (spec: Specification, questions: GeneratedQuestion[], mode: PracticeMode) => void;
	setUserAnswer: (answer: string) => void;
	selectChoice: (index: number) => void;
	submitAnswer: () => void;
	advanceQuestion: () => void;
	finishSession: () => void;
	resetSession: () => void;
	getCurrentQuestion: () => GeneratedQuestion | null;
}

/**
 * Compare a user answer against the correct answer.
 *
 * Numeric answers are compared as floats with a small tolerance (0.01).
 * If either side fails to parse as a number, fall back to a trimmed,
 * case-insensitive string comparison.
 */
function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
	const trimmedUser = userAnswer.trim();
	const trimmedCorrect = correctAnswer.trim();

	if (trimmedUser !== '' && trimmedCorrect !== '') {
		const userNum = Number(trimmedUser);
		const correctNum = Number(trimmedCorrect);
		if (!Number.isNaN(userNum) && !Number.isNaN(correctNum)) {
			return Math.abs(userNum - correctNum) < 0.01;
		}
	}

	return trimmedUser.toLowerCase() === trimmedCorrect.toLowerCase();
}

const initialSessionState = {
	specification: null as Specification | null,
	questions: [] as GeneratedQuestion[],
	currentIndex: 0,
	results: [] as PracticeResult[],
	mode: 'Single' as PracticeMode,
	isActive: false,
	isFinished: false,
	questionStartTime: null as number | null,
	sessionStartTime: null as number | null,
	userAnswer: '',
	selectedChoiceIndex: -1,
	showFeedback: false,
	lastResult: null as AnswerFeedback | null
};

export const usePracticeStore = create<PracticeState>()((set, get) => ({
	...initialSessionState,
	selectedTopicId: null,
	mcqEnabled: false,
	setMode: mode => set({mode}),
	setSelectedTopicId: topicId => set({selectedTopicId: topicId}),
	setMcqEnabled: enabled => set({mcqEnabled: enabled}),
	startSession: (spec, questions, mode) => {
		const now = Date.now();
		set({
			...initialSessionState,
			specification: spec,
			questions,
			mode,
			isActive: true,
			isFinished: false,
			questionStartTime: now,
			sessionStartTime: now
		});
	},

	setUserAnswer: answer => set({userAnswer: answer}),

	selectChoice: index => set({selectedChoiceIndex: index}),

	submitAnswer: () => {
		const state = get();
		const question = state.questions[state.currentIndex];
		if (!question || state.showFeedback) return;

		const startTime = state.questionStartTime ?? Date.now();
		const timeTakenMs = Date.now() - startTime;

		let isCorrect = false;
		let userAnswerValue = state.userAnswer;

		if (question.question_type === 'MultipleChoice' && question.choices) {
			const correctIndex = question.choices.findIndex(choice => choice === question.answer);
			isCorrect = state.selectedChoiceIndex === correctIndex;
			userAnswerValue = state.selectedChoiceIndex >= 0 ? (question.choices[state.selectedChoiceIndex] ?? '') : '';
		} else {
			isCorrect = isAnswerCorrect(state.userAnswer, question.answer);
		}

		const result: PracticeResult = {
			id: crypto.randomUUID(),
			question_id: question.id,
			topic_id: question.topic_id,
			skill_id: question.skill_id,
			is_correct: isCorrect,
			time_taken_ms: timeTakenMs,
			user_answer: userAnswerValue,
			timestamp: new Date().toISOString(),
			mode: state.mode,
			difficulty: question.difficulty
		};

		set({
			results: [...state.results, result],
			showFeedback: true,
			lastResult: {isCorrect, correctAnswer: question.answer}
		});
	},

	advanceQuestion: () => {
		const state = get();
		const nextIndex = state.currentIndex + 1;
		if (nextIndex >= state.questions.length) {
			get().finishSession();
			return;
		}
		set({
			currentIndex: nextIndex,
			userAnswer: '',
			selectedChoiceIndex: -1,
			showFeedback: false,
			lastResult: null,
			questionStartTime: Date.now()
		});
	},

	finishSession: () => set({isActive: false, isFinished: true}),

	resetSession: () => set({...initialSessionState}),

	getCurrentQuestion: () => {
		const state = get();
		return state.questions[state.currentIndex] ?? null;
	}
}));
