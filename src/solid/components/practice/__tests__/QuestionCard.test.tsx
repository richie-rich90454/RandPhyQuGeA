import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {QuestionCard} from "../QuestionCard";
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
	let now = Date.now();
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
describe("QuestionCard", () => {
	it("renders the empty state when no question is loaded", () => {
		render(() => <QuestionCard />);
		expect(screen.getByText("Pick a topic and click Generate to start")).toBeInTheDocument();
	});
	it("renders the question text when a question is loaded", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion({text: "Compute the velocity."}))});
		render(() => <QuestionCard />);
		expect(screen.getByText("Compute the velocity.")).toBeInTheDocument();
	});
	it("renders the topic name badge from the specification", () => {
		useSpecStore.setState({specification: makeSpec(), loading: false, error: null, empty: false});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion())});
		render(() => <QuestionCard />);
		expect(screen.getByText("Kinematics")).toBeInTheDocument();
	});
	it("renders the difficulty badge for a medium question", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion({difficulty: 2}))});
		render(() => <QuestionCard />);
		expect(screen.getByText("Medium")).toBeInTheDocument();
	});
	it("renders MCQ choices when the question is multiple-choice", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N", "6 N", "8 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq)});
		render(() => <QuestionCard />);
		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		expect(screen.getByText("2 N")).toBeInTheDocument();
		expect(screen.getAllByRole("radio")).toHaveLength(4);
	});
	it("selects a choice when clicked", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq)});
		render(() => <QuestionCard />);
		let radios = screen.getAllByRole("radio");
		fireEvent.click(radios[1]!);
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(1);
		expect(radios[1]).toHaveAttribute("aria-checked", "true");
	});
	it("disables choices when feedback is shown", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), showFeedback: true});
		render(() => <QuestionCard />);
		let radios = screen.getAllByRole("radio");
		expect(radios[0]).toBeDisabled();
		expect(radios[1]).toBeDisabled();
	});
	it("does not render choices for a free-response question", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion({question_type: "SA"}))});
		render(() => <QuestionCard />);
		expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
	});
	it("has role=radiogroup on the choices container (task 5.14 bug 1)", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N", "6 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq)});
		render(() => <QuestionCard />);
		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-label", "Answer choices");
	});
	it("has role=radio on each choice button (task 5.14 bug 1)", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N", "6 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq)});
		render(() => <QuestionCard />);
		expect(screen.getAllByRole("radio")).toHaveLength(3);
	});
	it("sets aria-checked=false on all choices when none is selected (task 5.14 bug 2)", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), selectedChoiceIndex: -1});
		render(() => <QuestionCard />);
		let radios = screen.getAllByRole("radio");
		expect(radios[0]).toHaveAttribute("aria-checked", "false");
		expect(radios[1]).toHaveAttribute("aria-checked", "false");
	});
	it("sets aria-checked=true only on the selected choice (task 5.14 bug 2)", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N", "6 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), selectedChoiceIndex: 1});
		render(() => <QuestionCard />);
		let radios = screen.getAllByRole("radio");
		expect(radios[0]).toHaveAttribute("aria-checked", "false");
		expect(radios[1]).toHaveAttribute("aria-checked", "true");
		expect(radios[2]).toHaveAttribute("aria-checked", "false");
	});
	it("updates aria-checked when a different choice is selected (task 5.14 bug 2)", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N", "6 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), selectedChoiceIndex: 0});
		render(() => <QuestionCard />);
		let radios = screen.getAllByRole("radio");
		expect(radios[0]).toHaveAttribute("aria-checked", "true");
		fireEvent.click(radios[2]!);
		expect(radios[0]).toHaveAttribute("aria-checked", "false");
		expect(radios[2]).toHaveAttribute("aria-checked", "true");
	});
	it("selected choice has tabindex=0 and unselected have tabindex=-1 (task 5.14 bug 1)", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), selectedChoiceIndex: 1});
		render(() => <QuestionCard />);
		let radios = screen.getAllByRole("radio");
		expect(radios[0]).toHaveAttribute("tabindex", "-1");
		expect(radios[1]).toHaveAttribute("tabindex", "0");
	});
	it("ArrowDown moves selection to the next choice (task 5.14 bug 1)", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N", "6 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), selectedChoiceIndex: 0});
		render(() => <QuestionCard />);
		let radios = screen.getAllByRole("radio");
		radios[0]!.focus();
		fireEvent.keyDown(screen.getByRole("radiogroup"), {key: "ArrowDown"});
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(1);
		expect(radios[1]).toHaveAttribute("aria-checked", "true");
	});
	it("ArrowUp wraps from first to last (task 5.14 bug 1)", () => {
		let mcq = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N", "6 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), selectedChoiceIndex: 0});
		render(() => <QuestionCard />);
		let radios = screen.getAllByRole("radio");
		radios[0]!.focus();
		fireEvent.keyDown(screen.getByRole("radiogroup"), {key: "ArrowUp"});
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(2);
		expect(radios[2]).toHaveAttribute("aria-checked", "true");
	});
});
