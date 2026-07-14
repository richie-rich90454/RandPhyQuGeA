import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {ResultsCard} from "../ResultsCard";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSpecStore} from "../../../stores/specStore";
import type {Session} from "../../../../services/contracts";
import type {GeneratedQuestion} from "../../../../types/models";
import type {WorkedSolution} from "../../../../lib/physics/solution/WorkedSolution";
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
describe("ResultsCard", () => {
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
	it("renders the partial-correct banner when the last result is partial", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: false, correctAnswer: "force", partial: true, userAnswer: "F"},
		});
		render(() => <ResultsCard />);
		expect(screen.getByText("Close!")).toBeInTheDocument();
	});
	it("renders the side-by-side answer comparison when userAnswer is present", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: false, correctAnswer: "42 N", userAnswer: "42"},
		});
		render(() => <ResultsCard />);
		expect(screen.getByText("Your answer:")).toBeInTheDocument();
		expect(screen.getByText("Correct answer:")).toBeInTheDocument();
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
	it("renders the text solution when solution_text is available", () => {
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
	it("renders the latex solution when solution_latex is available", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion({solution_latex: "F = ma", solution_text: ""})),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "force"},
		});
		render(() => <ResultsCard />);
		expect(screen.getByText("Solution")).toBeInTheDocument();
	});
	it("falls back to solution_text rendered as plain text when solution_latex is empty (regression 5.2)", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion({solution_latex: "", solution_text: "Use Newton's second law."})),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "force"},
		});
		let {container}=render(() => <ResultsCard />);
		expect(screen.getByText("Use Newton's second law.")).toBeInTheDocument();
		let solutionDisplay=container.querySelector('[class*="solutionDisplay"]');
		expect(solutionDisplay).not.toBeNull();
		expect(solutionDisplay?.querySelector("div[class*='display']")).toBeNull();
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
	it("renders the empty state when feedback is not shown even with a last result", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: false,
			lastResult: {isCorrect: true, correctAnswer: "force"},
		});
		render(() => <ResultsCard />);
		expect(screen.getByText("Your results will appear here after checking")).toBeInTheDocument();
	});
	it("renders the worked solution title and steps when provided", () => {
		let workedSolution: WorkedSolution={
			questionId: "q1",
			title: "Step-by-step solution",
			steps: [
				{description: "Identify the knowns", latex: "v = 20, t = 4"},
				{description: "Apply the formula", latex: "a = \\frac{v}{t}", substitution: "a = \\frac{20}{4}", result: "a = 5"},
			],
		};
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "5"},
		});
		render(() => <ResultsCard workedSolution={workedSolution} />);
		expect(screen.getByText("Step-by-step solution")).toBeInTheDocument();
		expect(screen.getByText("Identify the knowns")).toBeInTheDocument();
		expect(screen.getByText("Apply the formula")).toBeInTheDocument();
	});
	it("renders the worked solution steps as an ordered list", () => {
		let workedSolution: WorkedSolution={
			questionId: "q1",
			title: "Solution",
			steps: [
				{description: "Step one"},
				{description: "Step two"},
			],
		};
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "force"},
		});
		render(() => <ResultsCard workedSolution={workedSolution} />);
		let list=screen.getByRole("list");
		expect(list.tagName).toBe("OL");
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});
	it("renders the final answer when provided in the worked solution", () => {
		let workedSolution: WorkedSolution={
			questionId: "q1",
			title: "Solution",
			steps: [{description: "Compute"}],
			finalAnswer: "5 m/s",
		};
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "5"},
		});
		render(() => <ResultsCard workedSolution={workedSolution} />);
		expect(screen.getByText("Final answer:")).toBeInTheDocument();
		expect(screen.getByText("5 m/s")).toBeInTheDocument();
	});
	it("does not render the worked solution when steps are empty", () => {
		let workedSolution: WorkedSolution={
			questionId: "q1",
			title: "Empty",
			steps: [],
		};
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "force"},
		});
		render(() => <ResultsCard workedSolution={workedSolution} />);
		expect(screen.queryByText("Empty")).not.toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});
	it("does not render the worked solution section when not provided", () => {
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "force"},
		});
		render(() => <ResultsCard />);
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
		expect(screen.queryByText("Final answer:")).not.toBeInTheDocument();
	});
	it("renders step.substitution as LaTeX via MathRenderer (regression 5.76)", () => {
		let workedSolution: WorkedSolution={
			questionId: "q1",
			title: "Solution",
			steps: [
				{
					description: "Plug in numbers",
					latex: "a = \\frac{v - v_0}{t}",
					substitution: "a = \\frac{20 - 0}{4}",
					result: "a = 5",
				},
			],
		};
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "5"},
		});
		let {container}=render(() => <ResultsCard workedSolution={workedSolution} />);
		let substitutionEl=container.querySelector('[class*="stepSubstitution"]');
		expect(substitutionEl).not.toBeNull();
		expect(substitutionEl?.querySelector(".katex")).not.toBeNull();
		expect(substitutionEl?.querySelector("div[class*='display']")).not.toBeNull();
		expect(substitutionEl?.querySelector("span.katex-html")).not.toBeNull();
	});
	it("renders step.latex as LaTeX via MathRenderer (regression 5.76)", () => {
		let workedSolution: WorkedSolution={
			questionId: "q1",
			title: "Solution",
			steps: [
				{
					description: "Formula",
					latex: "a = \\frac{v - v_0}{t}",
				},
			],
		};
		usePracticeStore.setState({
			...usePracticeStore.getState(),
			session: makeSession(makeQuestion()),
			showFeedback: true,
			lastResult: {isCorrect: true, correctAnswer: "5"},
		});
		let {container}=render(() => <ResultsCard workedSolution={workedSolution} />);
		let expressionEl=container.querySelector('[class*="stepExpression"]');
		expect(expressionEl).not.toBeNull();
		expect(expressionEl?.querySelector(".katex")).not.toBeNull();
		expect(expressionEl?.querySelector("div[class*='display']")).not.toBeNull();
	});
});
