import {describe, it, expect, beforeEach} from "vitest";
import {render, screen, act} from "@testing-library/react";
import {AnswerCard} from "../AnswerCard";
import {usePracticeStore} from "../../../stores/practiceStore";
import type {Session} from "../../../services/contracts";
import type {GeneratedQuestion, Specification} from "../../../types/models";
function createMatchMedia(initialMatches: boolean): () => {matches: boolean; addEventListener: () => void; removeEventListener: () => void} {
	return () => ({
		matches: initialMatches,
		addEventListener: () => {},
		removeEventListener: () => {},
	});
}
function makeQuestion(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
	return {
		id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "SA",
		response_mode: "frq",
		difficulty: 1,
		text: "What is 2+2?",
		answer: "4",
		solution_text: "",
		solution_latex: "",
		variables: {},
		...overrides,
	};
}
function makeSession(question: GeneratedQuestion): Session {
	const spec: Specification = {
		units: [{id: "u1", name: "Unit One", description: ""}],
		topics: [{id: "t1", name: "Arithmetic", unit_id: "u1", description: ""}],
		skills: [],
		templates: [],
	};
	return {
		id: "s1",
		specification: spec,
		questions: [question],
		mode: "Single",
		currentIndex: 0,
		results: [],
		isActive: true,
		isFinished: false,
		questionStartTime: Date.now(),
		sessionStartTime: Date.now(),
	};
}
function resetStores(): void {
	usePracticeStore.setState({
		session: null,
		userAnswer: "",
		selectedChoiceIndex: -1,
		showFeedback: false,
		lastResult: null,
		selectedTopicId: null,
		mcqEnabled: false,
		autoEnabled: false,
		scope: "all",
		shuffle: false,
	});
}
describe("AnswerCard hot reconfiguration", () => {
	beforeEach(() => {
		resetStores();
		Object.defineProperty(window, "matchMedia", {writable: true, value: createMatchMedia(false)});
	});
	it("switches from textarea to selected-choice summary when the question becomes MC", () => {
		usePracticeStore.getState().setSession(makeSession(makeQuestion({question_type: "SA"})));
		render(<AnswerCard />);
		expect(screen.getByLabelText("Answer")).toBeDefined();
		expect(screen.queryByLabelText("Selected answer")).toBeNull();
		act(() => {
			usePracticeStore.getState().setSession(makeSession(makeQuestion({question_type: "MC", choices: ["3", "4", "5"]})));
		});
		expect(screen.queryByLabelText("Answer")).toBeNull();
		expect(screen.getByLabelText("Selected answer")).toBeDefined();
		expect(screen.getByText("Select an option in the question card")).toBeDefined();
		act(() => {
			usePracticeStore.getState().setSession(makeSession(makeQuestion({question_type: "SA"})));
		});
		expect(screen.getByLabelText("Answer")).toBeDefined();
		expect(screen.queryByLabelText("Selected answer")).toBeNull();
	});
});
