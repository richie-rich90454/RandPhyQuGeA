import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {UtilityButtons} from "../UtilityButtons";
import {ToastProvider} from "../../ui/Toast";
import {useUiStore} from "../../../stores/uiStore";
import {useSettingsStore} from "../../../stores/settingsStore";
function renderWithToast() {
	return render(() => (
		<ToastProvider>
			<UtilityButtons />
		</ToastProvider>
	));
}
beforeEach(() => {
	useUiStore.setState(useUiStore.getInitialState());
	useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "system"});
});
describe("UtilityButtons", () => {
	it("renders an icon button for each utility", () => {
		renderWithToast();
		expect(screen.getByRole("button", {name: "Toggle theme"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Settings"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Print worksheet"})).toBeInTheDocument();
	});
	it("opens the settings modal when the settings button is clicked", () => {
		renderWithToast();
		fireEvent.click(screen.getByRole("button", {name: "Settings"}));
		expect(useUiStore.getState().activeModal).toBe("settings");
	});
	it("cycles the theme mode when the theme button is clicked", () => {
		renderWithToast();
		fireEvent.click(screen.getByRole("button", {name: "Toggle theme"}));
		expect(useSettingsStore.getState().themeMode).toBe("light");
		fireEvent.click(screen.getByRole("button", {name: "Toggle theme"}));
		expect(useSettingsStore.getState().themeMode).toBe("dark");
		fireEvent.click(screen.getByRole("button", {name: "Toggle theme"}));
		expect(useSettingsStore.getState().themeMode).toBe("system");
	});
	it("reflects theme state on aria-pressed", () => {
		useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "dark"});
		renderWithToast();
		expect(screen.getByRole("button", {name: "Toggle theme"})).toHaveAttribute("aria-pressed", "true");
	});
});
