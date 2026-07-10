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
		let mcq=makeQuestion({
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
		let mcq=makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq)});
		render(() => <QuestionCard />);
		let radios=screen.getAllByRole("radio");
		fireEvent.click(radios[1]!);
		expect(usePracticeStore.getState().selectedChoiceIndex).toBe(1);
		expect(radios[1]).toHaveAttribute("aria-checked", "true");
	});
	it("disables choices when feedback is shown", () => {
		let mcq=makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq), showFeedback: true});
		render(() => <QuestionCard />);
		let radios=screen.getAllByRole("radio");
		expect(radios[0]).toBeDisabled();
		expect(radios[1]).toBeDisabled();
	});
	it("does not render choices for a free-response question", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion({question_type: "SA"}))});
		render(() => <QuestionCard />);
		expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
	});
});
