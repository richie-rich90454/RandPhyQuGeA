import {render, screen} from "@solidjs/testing-library";
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
		text: "Compute the velocity.",
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
describe("QuestionCard: diagram SVG rendering (task 5.60)", () => {
	it("renders the diagram_svg markup as inline SVG when present", () => {
		let q = makeQuestion({
			diagram_svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>',
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		let diagram = screen.getByRole("img", {name: "Question diagram"});
		expect(diagram).toBeInTheDocument();
		let svg = diagram.querySelector("svg");
		expect(svg).not.toBeNull();
		let circle = diagram.querySelector("circle");
		expect(circle).not.toBeNull();
		expect(circle?.getAttribute("r")).toBe("40");
	});
	it("does not render a diagram region when diagram_svg is undefined", () => {
		let q = makeQuestion({});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.queryByRole("img", {name: "Question diagram"})).not.toBeInTheDocument();
	});
	it("does not render a diagram region when diagram_svg is empty string", () => {
		let q = makeQuestion({diagram_svg: ""});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.queryByRole("img", {name: "Question diagram"})).not.toBeInTheDocument();
	});
	it("does not render a diagram region when diagram_svg is whitespace-only", () => {
		let q = makeQuestion({diagram_svg: "   \n\t  "});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.queryByRole("img", {name: "Question diagram"})).not.toBeInTheDocument();
	});
	it("renders the substituted diagram_svg (variables and {answer} already substituted by the core)", () => {
		let q = makeQuestion({
			diagram_svg: '<svg xmlns="http://www.w3.org/2000/svg"><text x="0" y="16">v=42</text></svg>',
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		let diagram = screen.getByRole("img", {name: "Question diagram"});
		let text = diagram.querySelector("text");
		expect(text?.textContent).toBe("v=42");
	});
	it("renders the diagram alongside the question text", () => {
		let q = makeQuestion({
			text: "What is the velocity at t=2?",
			diagram_svg: '<svg xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="100" y2="100" stroke="black"/></svg>',
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.getByText("What is the velocity at t=2?")).toBeInTheDocument();
		let diagram = screen.getByRole("img", {name: "Question diagram"});
		expect(diagram.querySelector("line")).not.toBeNull();
	});
	it("renders the diagram for an MCQ-mode question too", () => {
		let q = makeQuestion({
			question_type: "MC",
			choices: ["2 N", "4 N"],
			correct_choice_index: 1,
			response_mode: "mcq",
			diagram_svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
		});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(q)});
		render(() => <QuestionCard />);
		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		let diagram = screen.getByRole("img", {name: "Question diagram"});
		expect(diagram.querySelector("rect")).not.toBeNull();
	});
});
