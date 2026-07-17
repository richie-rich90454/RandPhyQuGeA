import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {ModeSelector} from "../ModeSelector";
import {useSettingsStore} from "../../../stores/settingsStore";
beforeEach(() => {
    useSettingsStore.setState({...useSettingsStore.getState(), defaultMode: "Single"});
});
describe("ModeSelector", () => {
    it("renders a button for each mode", () => {
        render(() => <ModeSelector />);
        expect(screen.getByRole("button", {name: "Single"})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Mental"})).toBeInTheDocument();
    });
    it("marks the active mode as pressed", () => {
        render(() => <ModeSelector />);
        let single = screen.getByRole("button", {name: "Single"});
        expect(single).toHaveAttribute("aria-pressed", "true");
    });
    it("switches the default mode when clicked", () => {
        render(() => <ModeSelector />);
        fireEvent.click(screen.getByRole("button", {name: "Mental"}));
        expect(useSettingsStore.getState().defaultMode).toBe("Mental");
    });
});
