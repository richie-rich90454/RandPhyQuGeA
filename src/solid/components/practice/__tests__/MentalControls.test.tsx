import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {MentalControls} from "../MentalControls";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSettingsStore} from "../../../stores/settingsStore";
import {useSpecStore} from "../../../stores/specStore";
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useSettingsStore.setState({...useSettingsStore.getState(), mentalDifficulty: "medium", mentalDurationSec: 60, mentalScope: "all", mentalShuffle: false, mentalUnlimited: false});
	useSpecStore.setState(useSpecStore.getInitialState());
});
describe("MentalControls", () => {
	it("renders the difficulty select with all difficulty options", () => {
		render(() => <MentalControls />);
		let select=screen.getByRole("combobox", {name: "Difficulty"}) as HTMLSelectElement;
		expect(select).toBeInTheDocument();
		let optionValues=Array.from(select.options).map(o => o.value);
		expect(optionValues).toEqual(["easy", "medium", "hard"]);
	});
	it("renders the time badge formatted from the mental duration", () => {
		render(() => <MentalControls />);
		expect(screen.getByText("01:00")).toBeInTheDocument();
	});
	it("renders the score badge at zero in idle state", () => {
		render(() => <MentalControls />);
		expect(screen.getByText("0 / 0")).toBeInTheDocument();
	});
	it("renders an enabled Start Session button in idle state", () => {
		render(() => <MentalControls />);
		let button=screen.getByRole("button", {name: /Start Session/i});
		expect(button).toBeInTheDocument();
		expect(button).not.toBeDisabled();
	});
	it("does not render pause/resume/skip controls when no session is active", () => {
		render(() => <MentalControls />);
		expect(screen.queryByRole("button", {name: /Pause session/i})).not.toBeInTheDocument();
		expect(screen.queryByRole("button", {name: /Resume session/i})).not.toBeInTheDocument();
		expect(screen.queryByRole("button", {name: /Skip question/i})).not.toBeInTheDocument();
	});
	it("updates the settings store when the difficulty changes", () => {
		render(() => <MentalControls />);
		let select=screen.getByRole("combobox", {name: "Difficulty"});
		fireEvent.input(select, {target: {value: "hard"}});
		expect(useSettingsStore.getState().mentalDifficulty).toBe("hard");
	});
	it("updates the settings store when the scope changes", () => {
		render(() => <MentalControls />);
		let select=screen.getByRole("combobox", {name: "Mental scope"});
		fireEvent.input(select, {target: {value: "all"}});
		expect(useSettingsStore.getState().mentalScope).toBe("all");
	});
	it("reflects the mental scope options from the loaded specification", () => {
		useSpecStore.setState({specification: {units: [{id: "u1", name: "Mechanics", description: ""}], topics: [], skills: [], templates: []}, loading: false, error: null, empty: false});
		render(() => <MentalControls />);
		let select=screen.getByRole("combobox", {name: "Mental scope"}) as HTMLSelectElement;
		let optionValues=Array.from(select.options).map(o => o.value);
		expect(optionValues).toEqual(["all", "u1"]);
	});
});
