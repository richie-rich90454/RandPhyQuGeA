import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {ResultsCard} from "../../components/practice/ResultsCard";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useSpecStore} from "../../stores/specStore";
import {useUiStore} from "../../stores/uiStore";
import type {Session} from "../../../services/contracts";
import type {GeneratedQuestion, Specification} from "../../../types/models";
function makeSpec(): Specification {
	return {units: [], topics: [], skills: [], templates: []};
}
function makeQuestion(overrides?: Partial<GeneratedQuestion>): GeneratedQuestion {
	return {
		id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "SA",
		difficulty: 2,
		text: "What is F=ma?",
		answer: "force",
		response_mode: "frq",
		solution_text: "Use Newton's second law.",
		solution_latex: "",
		variables: {},
		...overrides,
	};
}
function makeSession(question: GeneratedQuestion): Session {
	let now=Date.now();
	return {
		id: "sess1",
		specification: makeSpec(),
		questions: [question],
		mode: "Single",
		currentIndex: 0,
		results: [],
		isActive: true,
		isFinished: false,
		questionStartTime: now,
		sessionStartTime: now,
	};
}
function resetStores() {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useProgressStore.setState(useProgressStore.getInitialState());
	useSettingsStore.setState(useSettingsStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
	useUiStore.setState(useUiStore.getInitialState());
}
beforeEach(() => {
	resetStores();
});
describe("results smoke", () => {
	it("renders the empty state when no feedback is available", () => {
		render(() => <ResultsCard />);
		expect(screen.getByText("Your results will appear here after checking")).toBeInTheDocument();
	});
	it("renders the correct banner when the last result is correct", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "force"},
		});
		render(() => <ResultsCard />);
		expect(screen.getByText("Correct!")).toBeInTheDocument();
	});
	it("renders the incorrect banner when the last result is incorrect", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: false, correctAnswer: "force"},
		});
		render(() => <ResultsCard />);
		expect(screen.getByText("Not quite")).toBeInTheDocument();
	});
	it("renders the correct answer in the feedback banner", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: false, correctAnswer: "42 N"},
		});
		render(() => <ResultsCard />);
		expect(screen.getByText("42 N")).toBeInTheDocument();
	});
	it("renders the text solution when available", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion({solution_text: "Use Newton's second law."})),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "force"},
		});
		render(() => <ResultsCard />);
		expect(screen.getByText("Solution")).toBeInTheDocument();
		expect(screen.getByText("Use Newton's second law.")).toBeInTheDocument();
	});
	it("does not render the solution section when no solution is available", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion({solution_text: "", solution_latex: ""})),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "force"},
		});
		render(() => <ResultsCard />);
		expect(screen.queryByText("Solution")).not.toBeInTheDocument();
	});
});
