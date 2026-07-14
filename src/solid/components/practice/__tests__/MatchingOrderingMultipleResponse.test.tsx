import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {QuestionCard} from "../QuestionCard";
import {AnswerCard} from "../AnswerCard";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSpecStore} from "../../../stores/specStore";
import type {Session} from "../../../../services/contracts";
import type {GeneratedQuestion, Specification} from "../../../../types/models";
function makeSpec(): Specification {
	return {
		units: [{id: "u1", name: "Mechanics", description: ""}],
		topics: [{id: "t1", name: "Kinematics", unit_id: "u1", description: ""}],
		skills: [],
		templates: [],
	};
}
function makeQuestion(overrides?: Partial<GeneratedQuestion>): GeneratedQuestion {
	return {
		id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "SA",
		difficulty: 2,
		text: "What is $F=ma$?",
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
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
});
describe("QuestionCard: Matching/Ordering MCQ rendering (task 5.59 bug 1)", () => {
	it("renders radio choices for a Matching question in MCQ mode", () => {
		let q=makeQuestion({
			question_type: "MATCHING",
			choices: ["Velocity", "Force", "Energy"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		expect(screen.getAllByRole("radio")).toHaveLength(3);
		expect(screen.getByText("Force")).toBeInTheDocument();
	});
	it("renders radio choices for an Ordering question in MCQ mode", () => {
		let q=makeQuestion({
			question_type: "ORDERING",
			choices: ["A, B, C", "C, B, A", "B, A, C"],
			correct_choice_index: 0,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		expect(screen.getAllByRole("radio")).toHaveLength(3);
	});
	it("does NOT render choices when a Matching question is in FRQ mode", () => {
		let q=makeQuestion({
			question_type: "MATCHING",
			response_mode: "frq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
		expect(screen.queryByRole("group", {name: "Answer choices"})).not.toBeInTheDocument();
	});
});
describe("QuestionCard: MultipleResponse multi-select rendering (task 5.59 bug 2)", () => {
	it("renders checkbox choices (not radios) for a MultipleResponse question", () => {
		let q=makeQuestion({
			question_type: "MULTI_RESPONSE",
			choices: ["Force", "Energy", "Momentum", "Mass"],
			correct_choice_indices: [0, 2],
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
		expect(screen.getByRole("group", {name: "Answer choices"})).toBeInTheDocument();
		expect(screen.getAllByRole("checkbox")).toHaveLength(4);
	});
	it("toggles a checkbox selection on click without clearing other selections", () => {
		let q=makeQuestion({
			question_type: "MULTI_RESPONSE",
			choices: ["Force", "Energy", "Momentum", "Mass"],
			correct_choice_indices: [0, 2],
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		let checkboxes=screen.getAllByRole("checkbox");
		fireEvent.click(checkboxes[0]!);
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([0]);
		expect(checkboxes[0]).toHaveAttribute("aria-checked", "true");
		expect(checkboxes[1]).toHaveAttribute("aria-checked", "false");
		fireEvent.click(checkboxes[2]!);
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([0, 2]);
		expect(checkboxes[0]).toHaveAttribute("aria-checked", "true");
		expect(checkboxes[2]).toHaveAttribute("aria-checked", "true");
		fireEvent.click(checkboxes[0]!);
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([2]);
		expect(checkboxes[0]).toHaveAttribute("aria-checked", "false");
		expect(checkboxes[2]).toHaveAttribute("aria-checked", "true");
	});
	it("does not affect selectedChoiceIndex for single-select MCQ questions", () => {
		let q=makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.getAllByRole("radio")).toHaveLength(2);
		expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
	});
});
describe("AnswerCard: multi-select summary (task 5.59 bug 2)", () => {
	it("shows a placeholder when no multi-select option is chosen", () => {
		let q=makeQuestion({
			question_type: "MULTI_RESPONSE",
			choices: ["Force", "Energy", "Momentum"],
			correct_choice_indices: [0, 2],
			response_mode: "mcq",
		});
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(q),
			selectedChoiceIndices: [],
		});
		render(() => <AnswerCard />);
		expect(screen.getByText("Select options in the question card")).toBeInTheDocument();
	});
	it("lists the selected options in the multi-select summary", () => {
		let q=makeQuestion({
			question_type: "MULTI_RESPONSE",
			choices: ["Force", "Energy", "Momentum"],
			correct_choice_indices: [0, 2],
			response_mode: "mcq",
		});
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(q),
			selectedChoiceIndices: [0, 2],
		});
		render(() => <AnswerCard />);
		expect(screen.queryByText("Select options in the question card")).not.toBeInTheDocument();
		expect(screen.getByText("Force")).toBeInTheDocument();
		expect(screen.getByText("Momentum")).toBeInTheDocument();
	});
	it("clears all multi-select options when the clear button is clicked", () => {
		let q=makeQuestion({
			question_type: "MULTI_RESPONSE",
			choices: ["Force", "Energy", "Momentum"],
			correct_choice_indices: [0, 2],
			response_mode: "mcq",
		});
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(q),
			selectedChoiceIndices: [0, 2],
		});
		render(() => <AnswerCard />);
		fireEvent.click(screen.getByRole("button", {name: "Clear answer"}));
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([]);
	});
	it("hides the textarea for a MultipleResponse MCQ question", () => {
		let q=makeQuestion({
			question_type: "MULTI_RESPONSE",
			choices: ["Force", "Energy"],
			correct_choice_indices: [0],
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <AnswerCard />);
		expect(screen.queryByRole("textbox", {name: "Answer"})).not.toBeInTheDocument();
	});
	it("shows the multi-select hint for MultipleResponse MCQ questions", () => {
		let q=makeQuestion({
			question_type: "MULTI_RESPONSE",
			choices: ["Force", "Energy"],
			correct_choice_indices: [0],
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <AnswerCard />);
		expect(screen.getByText("Select all options that apply to the question.")).toBeInTheDocument();
	});
});
describe("practiceStore: multi-select state (task 5.59 bug 3)", () => {
	it("initializes selectedChoiceIndices to an empty array", () => {
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([]);
	});
	it("toggleChoice adds and removes indices", () => {
		let store=usePracticeStore.getState();
		store.toggleChoice(0);
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([0]);
		store.toggleChoice(2);
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([0, 2]);
		store.toggleChoice(0);
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([2]);
	});
	it("setSelectedChoiceIndices replaces the selection", () => {
		usePracticeStore.getState().setSelectedChoiceIndices([1, 3]);
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([1, 3]);
	});
	it("resetAnswerUi clears selectedChoiceIndices", () => {
		usePracticeStore.getState().setSelectedChoiceIndices([0, 1]);
		usePracticeStore.getState().resetAnswerUi();
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([]);
	});
	it("resetSession clears selectedChoiceIndices", () => {
		usePracticeStore.getState().setSelectedChoiceIndices([0, 1]);
		usePracticeStore.getState().resetSession();
		expect(usePracticeStore.getState().selectedChoiceIndices).toEqual([]);
	});
});
