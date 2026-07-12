import {describe, it, expect, beforeEach} from "vitest";
import {render, screen} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {usePracticeStore, selectCurrentQuestion, selectIsActive, selectIsFinished, selectMode, selectResults, selectCurrentIndex, selectQuestions, selectQuestionStartTime, selectSessionStartTime, selectSpecification} from "../practiceStore";
import type {Session} from "../../../services/contracts";
import type {GeneratedQuestion, Specification} from "../../../types/models";
function makeQuestion(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
	return {
		id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "SA",
		difficulty: 1,
		text: "What is 2+2?",
		answer: "4",
		response_mode: "frq",
		solution_text: "",
		solution_latex: "",
		variables: {},
		...overrides,
	};
}
function makeSession(overrides: Partial<Session> = {}): Session {
	const spec: Specification = {units: [], topics: [], skills: [], templates: []};
	const question = makeQuestion();
	return {
		id: "s1",
		specification: spec,
		questions: [question],
		mode: "Mental",
		currentIndex: 0,
		results: [],
		isActive: true,
		isFinished: false,
		questionStartTime: 1000,
		sessionStartTime: 2000,
		...overrides,
	};
}
function AnswerView(): JSX.Element {
	const answer = usePracticeStore(s => s.userAnswer);
	return <div data-testid="answer">{answer()}</div>;
}
describe("solid practiceStore", () => {
	beforeEach(() => {
		usePracticeStore.setState(usePracticeStore.getInitialState());
	});
	describe("initial state", () => {
		it("has no session and empty UI state", () => {
			const state = usePracticeStore.getState();
			expect(state.session).toBeNull();
			expect(state.userAnswer).toBe("");
			expect(state.selectedChoiceIndex).toBe(-1);
			expect(state.showFeedback).toBe(false);
			expect(state.lastResult).toBeNull();
		});
		it("has default config values", () => {
			const state = usePracticeStore.getState();
			expect(state.selectedTopicId).toBeNull();
		});
		it("selectors return safe defaults with no session", () => {
			const state = usePracticeStore.getState();
			expect(selectCurrentQuestion(state)).toBeNull();
			expect(selectIsActive(state)).toBe(false);
			expect(selectIsFinished(state)).toBe(false);
			expect(selectMode(state)).toBe("Single");
			expect(selectResults(state)).toEqual([]);
			expect(selectCurrentIndex(state)).toBe(0);
			expect(selectQuestions(state)).toEqual([]);
			expect(selectQuestionStartTime(state)).toBeNull();
			expect(selectSessionStartTime(state)).toBeNull();
			expect(selectSpecification(state)).toBeNull();
		});
	});
	describe("setSession", () => {
		it("updates the session and derived selectors", () => {
			const session = makeSession();
			usePracticeStore.getState().setSession(session);
			const state = usePracticeStore.getState();
			expect(state.session).toBe(session);
			expect(selectCurrentQuestion(state)).toBe(session.questions[0]);
			expect(selectIsActive(state)).toBe(true);
			expect(selectIsFinished(state)).toBe(false);
			expect(selectMode(state)).toBe("Mental");
			expect(selectResults(state)).toEqual([]);
			expect(selectCurrentIndex(state)).toBe(0);
			expect(selectQuestions(state)).toEqual(session.questions);
			expect(selectQuestionStartTime(state)).toBe(1000);
			expect(selectSessionStartTime(state)).toBe(2000);
			expect(selectSpecification(state)).toBe(session.specification);
		});
		it("selects the correct current question by index", () => {
			const q1 = makeQuestion({id: "q1", answer: "4"});
			const q2 = makeQuestion({id: "q2", answer: "8"});
			const session = makeSession({questions: [q1, q2], currentIndex: 1});
			usePracticeStore.getState().setSession(session);
			const state = usePracticeStore.getState();
			expect(selectCurrentQuestion(state)).toBe(q2);
			expect(selectCurrentIndex(state)).toBe(1);
		});
	});
	describe("resetSession", () => {
		it("clears the session and UI state but keeps config", () => {
			const store = usePracticeStore.getState();
			store.setSession(makeSession());
			store.setUserAnswer("42");
			store.selectChoice(2);
			store.setShowFeedback(true);
			store.setLastResult({isCorrect: true, correctAnswer: "4"});
			store.resetSession();
			const state = usePracticeStore.getState();
			expect(state.session).toBeNull();
			expect(state.userAnswer).toBe("");
			expect(state.selectedChoiceIndex).toBe(-1);
			expect(state.showFeedback).toBe(false);
			expect(state.lastResult).toBeNull();
			expect(state.selectedTopicId).toBeNull();
		});
	});
	describe("config setters", () => {
		it("persist selectedTopicId across session resets", () => {
			const store = usePracticeStore.getState();
			store.setSelectedTopicId("topic-a");
			store.setSession(makeSession());
			store.resetSession();
			const state = usePracticeStore.getState();
			expect(state.selectedTopicId).toBe("topic-a");
		});
	});
	describe("resetAnswerUi", () => {
		it("clears answer-related UI state without touching the session", () => {
			const store = usePracticeStore.getState();
			const session = makeSession();
			store.setSession(session);
			store.setUserAnswer("42");
			store.selectChoice(1);
			store.setShowFeedback(true);
			store.setLastResult({isCorrect: true, correctAnswer: "4"});
			store.resetAnswerUi();
			const state = usePracticeStore.getState();
			expect(state.session).toBe(session);
			expect(state.userAnswer).toBe("");
			expect(state.selectedChoiceIndex).toBe(-1);
			expect(state.showFeedback).toBe(false);
			expect(state.lastResult).toBeNull();
		});
	});
	describe("reactive subscription", () => {
		it("updates a rendered accessor when setUserAnswer fires", () => {
			render(() => <AnswerView />);
			expect(screen.getByTestId("answer").textContent).toBe("");
			usePracticeStore.getState().setUserAnswer("42");
			expect(screen.getByTestId("answer").textContent).toBe("42");
		});
		it("does not notify subscribers when an unrelated slice changes", () => {
			let renderCount = 0;
			function TopicView(): JSX.Element {
				const topicId = usePracticeStore(s => s.selectedTopicId);
				renderCount++;
				return <div data-testid="topic">{topicId() ?? ""}</div>;
			}
			render(() => <TopicView />);
			const before = renderCount;
			usePracticeStore.getState().setUserAnswer("unrelated");
			expect(screen.getByTestId("topic").textContent).toBe("");
			expect(renderCount).toBe(before);
			usePracticeStore.getState().setSelectedTopicId("topic-a");
			expect(screen.getByTestId("topic").textContent).toBe("topic-a");
		});
	});
	describe("mode config moved to settingsStore (task 5.9)", () => {
		it("does not expose mcqEnabled/autoEnabled/scope/shuffle on practice state", () => {
			const state = usePracticeStore.getState();
			expect("mcqEnabled" in state).toBe(false);
			expect("autoEnabled" in state).toBe(false);
			expect("scope" in state).toBe(false);
			expect("shuffle" in state).toBe(false);
			expect("setMcqEnabled" in state).toBe(false);
			expect("setAutoEnabled" in state).toBe(false);
			expect("setScope" in state).toBe(false);
			expect("setShuffle" in state).toBe(false);
		});
		it("keeps selectedTopicId as the only retained config field", () => {
			const state = usePracticeStore.getState();
			expect(state.selectedTopicId).toBeNull();
			expect(typeof state.setSelectedTopicId).toBe("function");
		});
		it("resetSession keeps selectedTopicId intact", () => {
			const store = usePracticeStore.getState();
			store.setSelectedTopicId("topic-x");
			store.setSession(makeSession());
			store.resetSession();
			expect(usePracticeStore.getState().selectedTopicId).toBe("topic-x");
		});
	});
});
