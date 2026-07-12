import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {McqToggle} from "../McqToggle";
import {useSettingsStore} from "../../../stores/settingsStore";
beforeEach(() => {
	localStorage.clear();
	useSettingsStore.setState(useSettingsStore.getInitialState());
});
describe("McqToggle", () => {
	it("renders the MCQ switch unchecked by default", () => {
		render(() => <McqToggle />);
		let sw=screen.getByRole("switch");
		expect(sw).not.toBeChecked();
	});
	it("reflects the settings store defaultResponseMode state", () => {
		useSettingsStore.setState({...useSettingsStore.getState(), defaultResponseMode: "mcq"});
		render(() => <McqToggle />);
		expect(screen.getByRole("switch")).toBeChecked();
	});
	it("toggles defaultResponseMode to mcq when clicked", () => {
		render(() => <McqToggle />);
		fireEvent.click(screen.getByRole("switch"));
		expect(useSettingsStore.getState().defaultResponseMode).toBe("mcq");
	});
	it("toggles defaultResponseMode back to frq when clicked again (task 5.9)", () => {
		useSettingsStore.setState({...useSettingsStore.getState(), defaultResponseMode: "mcq"});
		render(() => <McqToggle />);
		fireEvent.click(screen.getByRole("switch"));
		expect(useSettingsStore.getState().defaultResponseMode).toBe("frq");
	});
});
