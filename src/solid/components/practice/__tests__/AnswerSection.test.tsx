import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {AnswerSection} from "../AnswerSection";
import {usePracticeStore} from "../../../stores/practiceStore";
import type {Session} from "../../../../services/contracts";
import type {GeneratedQuestion} from "../../../../types/models";
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
		solution_text: "",
		solution_latex: "",
		variables: {},
		...overrides,
	};
}
function makeSession(question: GeneratedQuestion): Session {
	let now=Date.now();
	return {
		id: "sess1",
		specification: {units: [], topics: [], skills: [], templates: []},
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
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
});
describe("AnswerSection", () => {
	it("renders the Check button when no feedback is shown", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "force"});
		render(() => <AnswerSection />);
		expect(screen.getByRole("button", {name: /Check/i})).toBeInTheDocument();
	});
	it("disables the Check button when no answer is provided", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "", selectedChoiceIndex: -1});
		render(() => <AnswerSection />);
		expect(screen.getByRole("button", {name: /Check/i})).toBeDisabled();
	});
	it("enables the Check button when an answer is provided", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "force"});
		render(() => <AnswerSection />);
		expect(screen.getByRole("button", {name: /Check/i})).not.toBeDisabled();
	});
	it("renders the Next button when feedback is shown", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), showFeedback: true});
		render(() => <AnswerSection />);
		expect(screen.getByRole("button", {name: /Next/i})).toBeInTheDocument();
		expect(screen.queryByRole("button", {name: /Check/i})).not.toBeInTheDocument();
	});
	it("disables the Next button on the last question with feedback", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), showFeedback: true});
		render(() => <AnswerSection />);
		expect(screen.getByRole("button", {name: /Next/i})).toBeDisabled();
	});
	it("enables the Next button when there are more questions", () => {
		let q1=makeQuestion({id: "q1"});
		let q2=makeQuestion({id: "q2"});
		let now=Date.now();
		let session: Session={
			id: "sess1",
			specification: {units: [], topics: [], skills: [], templates: []},
			questions: [q1, q2],
			mode: "Single",
			currentIndex: 0,
			results: [],
			isActive: true,
			isFinished: false,
			questionStartTime: now,
			sessionStartTime: now,
		};
		usePracticeStore.setState({...usePracticeStore.getState(), session, showFeedback: true});
		render(() => <AnswerSection />);
		expect(screen.getByRole("button", {name: /Next/i})).not.toBeDisabled();
	});
	it("renders the answerCard slot content", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion())});
		render(() => <AnswerSection answerCard={<div data-testid="answer-slot">Answer Input</div>} />);
		expect(screen.getByTestId("answer-slot")).toBeInTheDocument();
	});
	it("renders the resultsCard slot content", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion())});
		render(() => <AnswerSection resultsCard={<div data-testid="results-slot">Results</div>} />);
		expect(screen.getByTestId("results-slot")).toBeInTheDocument();
	});
	it("renders without slots", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion())});
		render(() => <AnswerSection />);
		expect(screen.getByRole("button", {name: /Check/i})).toBeInTheDocument();
	});
});
