import {render, screen, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {SettingsModal} from "../SettingsModal";
import {useUiStore} from "../../../stores/uiStore";
import {useSettingsStore} from "../../../stores/settingsStore";
function createMatchMedia(initialMatches: boolean): Window["matchMedia"] {
	return (query: string) => ({
		matches: initialMatches,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	});
}
beforeEach(() => {
	useUiStore.setState(useUiStore.getInitialState());
	useSettingsStore.setState(useSettingsStore.getInitialState());
	window.matchMedia=createMatchMedia(false);
});
describe("SettingsModal", () => {
	it("renders when the settings modal is open", () => {
		useUiStore.getState().openModal("settings");
		render(() => <SettingsModal />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Settings")).toBeInTheDocument();
	});
	it("does not render when closed", () => {
		render(() => <SettingsModal />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it("switches to the Advanced tab and back", async () => {
		useUiStore.getState().openModal("settings");
		render(() => <SettingsModal />);
		fireEvent.click(screen.getByRole("tab", {name: /advanced/i}));
		await waitFor(() => expect(screen.getByText("Performance")).toBeInTheDocument());
		fireEvent.click(screen.getByRole("tab", {name: /basic/i}));
		await waitFor(() => expect(screen.getByText("Appearance")).toBeInTheDocument());
	});
	it("updates the theme setting", async () => {
		useUiStore.getState().openModal("settings");
		render(() => <SettingsModal />);
		let select=screen.getByLabelText("Theme");
		fireEvent.change(select, {target: {value: "dark"}});
		await waitFor(() => expect(useSettingsStore.getState().themeMode).toBe("dark"));
	});
	it("toggles a switch setting", async () => {
		useSettingsStore.setState({adaptiveEnabled: false});
		useUiStore.getState().openModal("settings");
		render(() => <SettingsModal />);
		let switchInput=screen.getByRole("switch", {name: /adaptive learning/i});
		fireEvent.click(switchInput);
		await waitFor(() => expect(useSettingsStore.getState().adaptiveEnabled).toBe(true));
	});
	it("updates a numeric input", async () => {
		useUiStore.getState().openModal("settings");
		render(() => <SettingsModal />);
		let input=screen.getByLabelText("Timer");
		fireEvent.change(input, {target: {value: "45"}});
		await waitFor(() => expect(useSettingsStore.getState().mentalDurationSec).toBe(45));
	});
	it("switches tabs with arrow keys", async () => {
		useUiStore.getState().openModal("settings");
		render(() => <SettingsModal />);
		let tablist=screen.getByRole("tablist", {name: /settings sections/i});
		fireEvent.keyDown(tablist, {key: "ArrowRight"});
		await waitFor(() => expect(screen.getByText("Performance")).toBeInTheDocument());
		fireEvent.keyDown(tablist, {key: "ArrowLeft"});
		await waitFor(() => expect(screen.getByText("Appearance")).toBeInTheDocument());
	});
	it("opens the reset confirmation dialog and resets settings", async () => {
		useSettingsStore.setState({themeMode: "dark", mentalDurationSec: 45});
		useUiStore.getState().openModal("settings");
		render(() => <SettingsModal />);
		fireEvent.click(screen.getByRole("tab", {name: /advanced/i}));
		await waitFor(() => expect(screen.getByText("Data")).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", {name: /reset settings/i}));
		await waitFor(() => expect(screen.getByText("Reset settings?")).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", {name: /^reset$/i}));
		await waitFor(() => {
			expect(useSettingsStore.getState().themeMode).toBe("system");
			expect(useSettingsStore.getState().mentalDurationSec).toBe(60);
		});
	});
	it("closes the modal when Save & Close is clicked", async () => {
		useUiStore.getState().openModal("settings");
		render(() => <SettingsModal />);
		fireEvent.click(screen.getByRole("button", {name: /save & close/i}));
		await waitFor(() => expect(useUiStore.getState().activeModal).toBe(null));
	});
});
