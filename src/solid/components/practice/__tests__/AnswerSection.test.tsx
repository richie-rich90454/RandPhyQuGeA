import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {AnswerSection} from "../AnswerSection";
import {usePracticeStore} from "../../../stores/practiceStore";
import type {Session} from "../../../../services/contracts";
import type {GeneratedQuestion} from "../../../../types/models";
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
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
		solution_text: "",
		solution_latex: "",
		variables: {},
		...overrides,
	};
}
function makeSession(question: GeneratedQuestion): Session {
	let now = Date.now();
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
		let q1 = makeQuestion({id: "q1"});
		let q2 = makeQuestion({id: "q2"});
		let now = Date.now();
		let session: Session = {
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
	it("plain Enter does not submit when an answer is ready (task 5.15 bug 1)", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "force"});
		render(() => <AnswerSection />);
		let event = new KeyboardEvent("keydown", {key: "Enter", bubbles: true, cancelable: true});
		window.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
	});
	it("digit keys do not select MCQ choices while typing in a textarea (task 5.15 bug 2)", () => {
		let q = makeQuestion({question_type: "MC", choices: ["a", "b", "c", "d"], correct_choice_index: 0});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q), userAnswer: ""});
		render(() => <AnswerSection />);
		let ta = document.createElement("textarea");
		document.body.appendChild(ta);
		ta.focus();
		let event = new KeyboardEvent("keydown", {key: "1", bubbles: true, cancelable: true});
		ta.dispatchEvent(event);
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(-1);
		document.body.removeChild(ta);
	});
	it("submit routes resolveSession errors through onError and resets the submitting flag (task 5.34)", async () => {
		let errors: string[] = [];
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "force"});
		render(() => <AnswerSection onError={message => errors.push(message)} />);
		let button = screen.getByRole("button", {name: /Check/i});
		fireEvent.click(button);
		await flush();
		expect(errors.length).toBe(1);
		expect(errors[0]).toContain("ServiceProvider");
		expect(button).not.toBeDisabled();
	});
	it("advance routes resolveSession errors through onError (task 5.34)", async () => {
		let errors: string[] = [];
		let q1 = makeQuestion({id: "q1"});
		let q2 = makeQuestion({id: "q2"});
		let now = Date.now();
		let session: Session = {
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
		render(() => <AnswerSection onError={message => errors.push(message)} />);
		let button = screen.getByRole("button", {name: /Next/i});
		fireEvent.click(button);
		await flush();
		expect(errors.length).toBe(1);
		expect(errors[0]).toContain("ServiceProvider");
	});
});
