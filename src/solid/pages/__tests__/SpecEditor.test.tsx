import {render, screen, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {SpecEditor} from "../SpecEditor";
const BASIC_MC_SPEC=[
	"[UNIT]",
	"Id: U1",
	"Name: Mechanics",
	"[TOPIC]",
	"Id: T1",
	"Name: Kinematics",
	"UnitId: U1",
	"[SKILL]",
	"Id: S1",
	"Name: Uniform Acceleration",
	"TopicId: T1",
	"[TEMPLATE]",
	"Id: Q1",
	"TopicId: T1",
	"SkillId: S1",
	"QuestionType: MultipleChoice",
	"Difficulty: 2",
	"TextTemplate: A car accelerates from {v0} m/s to {v} m/s in {t} s.",
	"AnswerExpression: (v - v0) / t",
	"SolutionTemplate: Use a = (v - v0) / t.",
	"Var.v0: Type=double;Min=0;Max=20;Step=1",
	"Var.v: Type=double;Min=20;Max=40;Step=1",
	"Var.t: Type=double;Min=1;Max=10;Step=0.5",
	"Distractor: (v + v0) / t",
	"Distractor: v / t",
].join("\n");
const INVALID_SPEC="[UNIT]\nId: U1\nName: M\n[BOGUS]\nKey: value";
beforeEach(() => {
	localStorage.clear();
	window.location.hash="";
});
describe("SpecEditor page", () => {
	it("renders the page heading and subtitle", () => {
		render(() => <SpecEditor />);
		expect(screen.getByText("Live Spec Editor")).toBeInTheDocument();
		expect(screen.getByText(/Edit a question specification/)).toBeInTheDocument();
	});
	it("renders the back-to-app link", () => {
		render(() => <SpecEditor />);
		expect(screen.getByRole("button", {name: /back to app/i})).toBeInTheDocument();
	});
	it("renders the toolbar buttons", () => {
		render(() => <SpecEditor />);
		expect(screen.getByRole("button", {name: /load default spec/i})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: /export \.txt/i})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: /^clear$/i})).toBeInTheDocument();
	});
	it("disables Export and Clear when the textarea is empty", () => {
		render(() => <SpecEditor />);
		expect(screen.getByRole("button", {name: /export \.txt/i})).toBeDisabled();
		expect(screen.getByRole("button", {name: /^clear$/i})).toBeDisabled();
	});
	it("renders the specification textarea", () => {
		render(() => <SpecEditor />);
		expect(screen.getByLabelText(/specification text editor/i)).toBeInTheDocument();
	});
	it("shows the idle parse status initially", () => {
		render(() => <SpecEditor />);
		expect(screen.getByText("No spec loaded")).toBeInTheDocument();
	});
	it("updates the textarea value when typing", () => {
		render(() => <SpecEditor />);
		let textarea=screen.getByLabelText(/specification text editor/i);
		fireEvent.input(textarea, {target: {value: "[UNIT]"}});
		expect((textarea as HTMLTextAreaElement).value).toBe("[UNIT]");
	});
	it("clears the textarea when the Clear button is clicked", () => {
		render(() => <SpecEditor />);
		let textarea=screen.getByLabelText(/specification text editor/i);
		fireEvent.input(textarea, {target: {value: "[UNIT]"}});
		fireEvent.click(screen.getByRole("button", {name: /^clear$/i}));
		expect((textarea as HTMLTextAreaElement).value).toBe("");
	});
	it("loads the default spec when the Load default spec button is clicked", async () => {
		render(() => <SpecEditor />);
		fireEvent.click(screen.getByRole("button", {name: /load default spec/i}));
		await waitFor(() => {
			let textarea=screen.getByLabelText(/specification text editor/i);
			expect((textarea as HTMLTextAreaElement).value.length).toBeGreaterThan(0);
		}, {timeout: 3000});
	});
	it("parses a valid spec and shows the valid status with stats", async () => {
		render(() => <SpecEditor />);
		let textarea=screen.getByLabelText(/specification text editor/i);
		fireEvent.input(textarea, {target: {value: BASIC_MC_SPEC}});
		await waitFor(() => expect(screen.getByText("Parsed successfully")).toBeInTheDocument(), {timeout: 3000});
		expect(screen.getByText("Units")).toBeInTheDocument();
		expect(screen.getByText("Topics")).toBeInTheDocument();
		expect(screen.getByText("Skills")).toBeInTheDocument();
		expect(screen.getByText("Templates")).toBeInTheDocument();
	});
	it("generates and shows a sample question for a valid spec", async () => {
		render(() => <SpecEditor />);
		let textarea=screen.getByLabelText(/specification text editor/i);
		fireEvent.input(textarea, {target: {value: BASIC_MC_SPEC}});
		await waitFor(() => expect(screen.getByText(/A car accelerates from/)).toBeInTheDocument(), {timeout: 3000});
		expect(screen.getByText("Answer:")).toBeInTheDocument();
	});
	it("shows an error status for an invalid spec", async () => {
		render(() => <SpecEditor />);
		let textarea=screen.getByLabelText(/specification text editor/i);
		fireEvent.input(textarea, {target: {value: INVALID_SPEC}});
		await waitFor(() => expect(screen.getByText("Error")).toBeInTheDocument(), {timeout: 3000});
		expect(screen.getByText("Generation failed")).toBeInTheDocument();
	});
	it("clears the hash when the back link is clicked", () => {
		window.location.hash="/spec-editor";
		render(() => <SpecEditor />);
		fireEvent.click(screen.getByRole("button", {name: /back to app/i}));
		expect(window.location.hash).toBe("");
	});
});
