import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi, afterEach} from "vitest";
import {AnswerCard} from "../AnswerCard";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSpecStore} from "../../../stores/specStore";
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
	useSpecStore.setState(useSpecStore.getInitialState());
});
afterEach(() => {
	vi.restoreAllMocks();
	Reflect.deleteProperty(document, "execCommand");
});
describe("AnswerCard", () => {
	it("renders the answer textarea for a free-response question", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion())});
		render(() => <AnswerCard />);
		expect(screen.getByRole("textbox", {name: "Answer"})).toBeInTheDocument();
	});
	it("disables the textarea when no question is loaded", () => {
		render(() => <AnswerCard />);
		expect(screen.getByRole("textbox", {name: "Answer"})).toBeDisabled();
	});
	it("updates the practice store when typing in the answer textarea", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion())});
		render(() => <AnswerCard />);
		let textarea=screen.getByRole("textbox", {name: "Answer"}) as HTMLTextAreaElement;
		fireEvent.input(textarea, {target: {value: "42 N"}});
		expect(usePracticeStore.getState().userAnswer).toBe("42 N");
	});
	it("shows the clear answer button when the answer has content", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "force"});
		render(() => <AnswerCard />);
		expect(screen.getByRole("button", {name: "Clear answer"})).toBeInTheDocument();
	});
	it("clears the answer when the clear button is clicked", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "force"});
		render(() => <AnswerCard />);
		fireEvent.click(screen.getByRole("button", {name: "Clear answer"}));
		expect(usePracticeStore.getState().userAnswer).toBe("");
	});
	it("renders the MCQ summary instead of a textarea for multiple-choice questions", () => {
		let mcq=makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N", "6 N", "8 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), selectedChoiceIndex: 1});
		render(() => <AnswerCard />);
		expect(screen.queryByRole("textbox", {name: "Answer"})).not.toBeInTheDocument();
		expect(screen.getByRole("status", {name: "Selected answer"})).toBeInTheDocument();
		expect(screen.getByText("4 N")).toBeInTheDocument();
	});
	it("renders a placeholder when no MCQ choice is selected", () => {
		let mcq=makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), selectedChoiceIndex: -1});
		render(() => <AnswerCard />);
		expect(screen.getByText("Select an option in the question card")).toBeInTheDocument();
	});
	it("clears the MCQ selection when the clear button is clicked", () => {
		let mcq=makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), selectedChoiceIndex: 1});
		render(() => <AnswerCard />);
		fireEvent.click(screen.getByRole("button", {name: "Clear answer"}));
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(-1);
	});
	it("disables the textarea when feedback is shown", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), showFeedback: true});
		render(() => <AnswerCard />);
		expect(screen.getByRole("textbox", {name: "Answer"})).toBeDisabled();
	});
	it("shows the preview placeholder when the answer is empty", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion())});
		render(() => <AnswerCard />);
		expect(screen.getByText("Preview will appear here")).toBeInTheDocument();
	});
	it("renders the live preview when the answer has content", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "42 N"});
		render(() => <AnswerCard />);
		expect(screen.queryByText("Preview will appear here")).not.toBeInTheDocument();
		expect(document.getElementById("preview")?.textContent).toContain("42 N");
	});
	it("shows an error indicator when the answer has invalid LaTeX", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "$\\sqrt{$"});
		render(() => <AnswerCard />);
		expect(screen.getByRole("alert")).toBeInTheDocument();
		expect(document.getElementById("preview")?.textContent).toContain("$\\sqrt{$");
	});
	it("associates a label element with the answer textarea via for/id (task 5.48)", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion())});
		render(() => <AnswerCard />);
		let label=document.querySelector('label[for="answer-box"]');
		expect(label).not.toBeNull();
		expect(label?.textContent).toBe("Answer");
		expect(screen.getByLabelText("Answer")).toBeInTheDocument();
	});
	it("inserts a math symbol at the cursor via the fallback path (undo/redo regression)", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "abc"});
		render(() => <AnswerCard />);
		let textarea=screen.getByRole("textbox", {name: "Answer"}) as HTMLTextAreaElement;
		textarea.focus();
		textarea.setSelectionRange(1, 1);
		fireEvent.click(screen.getByText("\u221a"));
		expect(usePracticeStore.getState().userAnswer).toBe("a\\sqrt{}bc");
	});
	it("uses execCommand insertText for undoable symbol insertion when available (undo/redo regression)", () => {
		let execSpy=vi.fn().mockReturnValue(true);
		Object.defineProperty(document, "execCommand", {value: execSpy, configurable: true, writable: true});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "abc"});
		render(() => <AnswerCard />);
		let textarea=screen.getByRole("textbox", {name: "Answer"}) as HTMLTextAreaElement;
		textarea.focus();
		textarea.setSelectionRange(1, 1);
		fireEvent.click(screen.getByText("\u221a"));
		expect(execSpy).toHaveBeenCalledWith("insertText", false, "\\sqrt{}");
	});
	it("falls back to manual insertion when execCommand returns false (undo/redo regression)", () => {
		let execSpy=vi.fn().mockReturnValue(false);
		Object.defineProperty(document, "execCommand", {value: execSpy, configurable: true, writable: true});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "abc"});
		render(() => <AnswerCard />);
		let textarea=screen.getByRole("textbox", {name: "Answer"}) as HTMLTextAreaElement;
		textarea.focus();
		textarea.setSelectionRange(2, 2);
		fireEvent.click(screen.getByText("\u221a"));
		expect(usePracticeStore.getState().userAnswer).toBe("ab\\sqrt{}c");
		expect(execSpy).toHaveBeenCalledWith("insertText", false, "\\sqrt{}");
	});
});
