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
        expect(useSettingsStore.getState().themeMode).toBe("dim");
        fireEvent.click(screen.getByRole("button", {name: "Toggle theme"}));
        expect(useSettingsStore.getState().themeMode).toBe("system");
    });
    it("reflects dim theme state on aria-pressed as mixed", () => {
        useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "dim"});
        renderWithToast();
        expect(screen.getByRole("button", {name: "Toggle theme"})).toHaveAttribute("aria-pressed", "mixed");
    });
    it("reflects theme state on aria-pressed", () => {
        useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "dark"});
        renderWithToast();
        expect(screen.getByRole("button", {name: "Toggle theme"})).toHaveAttribute("aria-pressed", "true");
    });
    it("reflects system theme state on aria-pressed as mixed (task 5.46, preventive fix)", () => {
        useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "system"});
        renderWithToast();
        expect(screen.getByRole("button", {name: "Toggle theme"})).toHaveAttribute("aria-pressed", "mixed");
    });
    it("reflects light theme state on aria-pressed as false (task 5.46, preventive fix)", () => {
        useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "light"});
        renderWithToast();
        expect(screen.getByRole("button", {name: "Toggle theme"})).toHaveAttribute("aria-pressed", "false");
    });
    it("shows a toast naming dim when the theme cycles to dim (task 5.46, preventive fix)", async () => {
        useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "dark"});
        renderWithToast();
        fireEvent.click(screen.getByRole("button", {name: "Toggle theme"}));
        expect(await screen.findByText(/Theme: dim/)).toBeInTheDocument();
    });
    it("shows a toast naming system when the theme cycles to system (task 5.46, preventive fix)", async () => {
        useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "dim"});
        renderWithToast();
        fireEvent.click(screen.getByRole("button", {name: "Toggle theme"}));
        expect(await screen.findByText(/Theme: system/)).toBeInTheDocument();
    });
    it("updates the theme button title to reflect system mode (task 5.46, preventive fix)", () => {
        useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "system"});
        renderWithToast();
        expect(screen.getByRole("button", {name: "Toggle theme"})).toHaveAttribute("title", "Theme: System (click to cycle)");
    });
    it("updates the theme button title to reflect dim mode (task 5.46, preventive fix)", () => {
        useSettingsStore.setState({...useSettingsStore.getState(), themeMode: "dim"});
        renderWithToast();
        expect(screen.getByRole("button", {name: "Toggle theme"})).toHaveAttribute("title", "Theme: Dim (click to cycle)");
    });
});
