import {render, screen, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {MentalControls} from "../MentalControls";
import {ToastProvider} from "../../ui/Toast";
import {ServiceProvider} from "../../../providers/ServiceProvider";
import {PhysicsCore} from "../../../../lib/physics";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSettingsStore} from "../../../stores/settingsStore";
import {useSpecStore} from "../../../stores/specStore";
import type {Session} from "../../../../services/contracts";
import type {PracticeResult, GeneratedQuestion, Specification} from "../../../../types/models";
import type {JSX} from "solid-js";
function makeResult(correct: boolean): PracticeResult {
	return {id: "r", question_id: "q", topic_id: "t", skill_id: "s", is_correct: correct, time_taken_ms: 2000, user_answer: "x", timestamp: new Date().toISOString(), mode: "Mental", difficulty: 3};
}
function makeFinishedSession(results: PracticeResult[]): Session {
	let now = Date.now();
	return {
		id: "sess",
		specification: {units: [], topics: [], skills: [], templates: []},
		questions: [],
		mode: "Mental",
		currentIndex: 0,
		results,
		isActive: false,
		isFinished: true,
		questionStartTime: now,
		sessionStartTime: now,
	};
}
function makeEmptySpec(): Specification {
	return {units: [], topics: [], skills: [], templates: []};
}
function makeQuestion(): GeneratedQuestion {
	return {
		id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		question_type: "SA",
		difficulty: 1,
		text: "What is 1?",
		answer: "1",
		solution_text: "",
		solution_latex: "",
		variables: {x: 1},
		response_mode: "frq",
	};
}
function makeActiveMentalSession(): Session {
	let now = Date.now();
	return {
		id: "sess-active",
		specification: makeEmptySpec(),
		questions: [makeQuestion()],
		mode: "Mental",
		currentIndex: 0,
		results: [],
		isActive: true,
		isFinished: false,
		questionStartTime: now,
		sessionStartTime: now,
	};
}
function renderWithToast(ui: () => JSX.Element) {
	return render(() => <ToastProvider>{ui()}</ToastProvider>);
}
function renderWithProviders(ui: () => JSX.Element, core?: PhysicsCore) {
	return render(() => (
		<ToastProvider>
			<ServiceProvider core={core ?? PhysicsCore.default()}>{ui()}</ServiceProvider>
		</ToastProvider>
	));
}
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useSettingsStore.setState({...useSettingsStore.getState(), mentalDifficulty: "medium", mentalDurationSec: 60, mentalScope: "all", mentalShuffle: false, mentalUnlimited: false});
	useSpecStore.setState(useSpecStore.getInitialState());
	localStorage.clear();
});
describe("MentalControls", () => {
	it("renders the difficulty pill radiogroup with all difficulty options", () => {
		renderWithToast(() => <MentalControls />);
		let group = screen.getByRole("radiogroup", {name: "Difficulty"});
		expect(group).toBeInTheDocument();
		let radios = screen.getAllByRole("radio");
		let labels = radios.map(r => (r as HTMLElement).getAttribute("aria-label"));
		expect(labels).toEqual(["Easy", "Medium", "Hard"]);
	});
	it("marks the active difficulty pill as checked", () => {
		renderWithToast(() => <MentalControls />);
		let active = screen.getByRole("radio", {name: "Medium"});
		expect(active).toHaveAttribute("aria-checked", "true");
		let inactive = screen.getByRole("radio", {name: "Hard"});
		expect(inactive).toHaveAttribute("aria-checked", "false");
	});
	it("renders the time badge formatted from the mental duration", () => {
		renderWithToast(() => <MentalControls />);
		expect(screen.getByText("01:00")).toBeInTheDocument();
	});
	it("labels the timer badge with an accessible name", () => {
		renderWithToast(() => <MentalControls />);
		expect(screen.getByLabelText("Time remaining")).toBeInTheDocument();
	});
	it("renders the score badge at zero in idle state", () => {
		renderWithToast(() => <MentalControls />);
		expect(screen.getByText("0 / 0")).toBeInTheDocument();
	});
	it("labels the score badge with an accessible name", () => {
		renderWithToast(() => <MentalControls />);
		expect(screen.getByLabelText("Current score")).toBeInTheDocument();
	});
	it("renders an enabled Start Session button in idle state", () => {
		renderWithToast(() => <MentalControls />);
		let button = screen.getByRole("button", {name: /Start Session/i});
		expect(button).toBeInTheDocument();
		expect(button).not.toBeDisabled();
	});
	it("does not render pause/resume/skip controls when no session is active", () => {
		renderWithToast(() => <MentalControls />);
		expect(screen.queryByRole("button", {name: /Pause session/i})).not.toBeInTheDocument();
		expect(screen.queryByRole("button", {name: /Resume session/i})).not.toBeInTheDocument();
		expect(screen.queryByRole("button", {name: /Skip question/i})).not.toBeInTheDocument();
	});
	it("updates the settings store when a difficulty pill is clicked", () => {
		renderWithToast(() => <MentalControls />);
		fireEvent.click(screen.getByRole("radio", {name: "Hard"}));
		expect(useSettingsStore.getState().mentalDifficulty).toBe("hard");
	});
	it("updates the settings store when the scope changes", () => {
		renderWithToast(() => <MentalControls />);
		let select = screen.getByRole("combobox", {name: "Mental scope"});
		fireEvent.input(select, {target: {value: "all"}});
		expect(useSettingsStore.getState().mentalScope).toBe("all");
	});
	it("reflects the mental scope options from the loaded specification", () => {
		useSpecStore.setState({specification: {units: [{id: "u1", name: "Mechanics", description: ""}], topics: [], skills: [], templates: []}, loading: false, error: null, empty: false});
		renderWithToast(() => <MentalControls />);
		let select = screen.getByRole("combobox", {name: "Mental scope"}) as HTMLSelectElement;
		let optionValues = Array.from(select.options).map(o => o.value);
		expect(optionValues).toEqual(["all", "u1"]);
	});
	it("renders session statistics with streak in the finished summary", () => {
		let results = [makeResult(false), makeResult(true), makeResult(true)];
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeFinishedSession(results)});
		renderWithToast(() => <MentalControls />);
		expect(screen.getByText(/Streak: 2/)).toBeInTheDocument();
		expect(screen.getByText(/Accuracy: 67%/)).toBeInTheDocument();
	});
	it("labels the progress bar with the time remaining context", () => {
		renderWithToast(() => <MentalControls />);
		expect(screen.getByRole("progressbar", {name: "Mental session time remaining"})).toBeInTheDocument();
	});
});
describe("MentalControls resilience (task 5.31)", () => {
	it("shows an error toast when startSession fails (no-template path, unlimited mode)", async () => {
		useSpecStore.setState({specification: makeEmptySpec(), loading: false, error: null, empty: false});
		useSettingsStore.setState({...useSettingsStore.getState(), mentalUnlimited: true});
		renderWithProviders(() => <MentalControls />);
		fireEvent.click(screen.getByRole("button", {name: /Start Session/i}));
		await waitFor(() => {
			expect(screen.getByRole("status")).toBeInTheDocument();
		});
		expect(screen.getByRole("status")).toHaveTextContent(/Failed to start session/);
		expect(screen.getByRole("status")).toHaveTextContent(/No question template matches/);
	});
	it("shows an error toast when skipQuestion fails (SessionService has no active session)", async () => {
		useSpecStore.setState({specification: makeEmptySpec(), loading: false, error: null, empty: false});
		usePracticeStore.setState({...usePracticeStore.getState(), session: makeActiveMentalSession()});
		renderWithProviders(() => <MentalControls />);
		let skipButton = screen.getByRole("button", {name: /Skip question/i});
		fireEvent.click(skipButton);
		await waitFor(() => {
			expect(screen.getByRole("status")).toBeInTheDocument();
		});
		expect(screen.getByRole("status")).toHaveTextContent(/Failed to skip question/);
	});
	it("shows an error toast when advance cannot load the next question (unlimited no-template)", async () => {
		let validSpec: Specification = {
			units: [{id: "u1", name: "U1", description: ""}],
			topics: [{id: "t1", name: "T1", unit_id: "u1", description: ""}],
			skills: [{id: "s1", name: "S1", topic_id: "t1", description: ""}],
			templates: [
				{
					id: "tpl1",
					topic_id: "t1",
					skill_id: "s1",
					question_type: "SA",
					difficulty: 3,
					text_template: "Q",
					answer_expression: "1",
					solution_template: "",
					solution_latex_template: "",
					variable_definitions: [],
					distractor_expressions: [],
				},
			],
		};
		useSpecStore.setState({specification: validSpec, loading: false, error: null, empty: false});
		useSettingsStore.setState({...useSettingsStore.getState(), mentalUnlimited: true, mentalDurationSec: 0});
		renderWithProviders(() => <MentalControls />);
		fireEvent.click(screen.getByRole("button", {name: /Start Session/i}));
		await waitFor(() => expect(screen.getByRole("button", {name: /Skip question/i})).toBeInTheDocument());
		useSpecStore.setState({specification: makeEmptySpec(), loading: false, error: null, empty: false});
		fireEvent.click(screen.getByRole("button", {name: /Skip question/i}));
		await waitFor(
			() => {
				expect(screen.getByRole("status")).toBeInTheDocument();
			},
			{timeout: 5000},
		);
		expect(screen.getByRole("status")).toHaveTextContent(/Failed to load next question/);
	}, 10000);
});
describe("MentalControls focus preservation on pause/resume (task 5.51)", () => {
	it("pauseSession calls timer.pause and uses requestAnimationFrame to focus the Resume button", () => {
		let src = readFileSync(join(process.cwd(), "src", "solid", "components", "practice", "MentalControls.tsx"), "utf-8");
		expect(src).toContain("timer.pause()");
		expect(src).toMatch(/requestAnimationFrame\(\(\)\s*=>\s*\{[^}]*Resume session/s);
	});
	it("resumeSession calls timer.resume and uses requestAnimationFrame to focus the Pause button", () => {
		let src = readFileSync(join(process.cwd(), "src", "solid", "components", "practice", "MentalControls.tsx"), "utf-8");
		expect(src).toContain("timer.resume()");
		expect(src).toMatch(/requestAnimationFrame\(\(\)\s*=>\s*\{[^}]*Pause session/s);
	});
});
