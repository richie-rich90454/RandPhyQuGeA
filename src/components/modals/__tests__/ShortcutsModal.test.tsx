import {describe, it, expect, beforeEach} from "vitest";
import {render, screen, fireEvent} from "@testing-library/react";
import {ShortcutsModal} from "../ShortcutsModal";
import {useUiStore} from "../../../stores/uiStore";
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
	window.matchMedia = createMatchMedia(false);
});
describe("ShortcutsModal", () => {
	it("renders when the shortcuts modal is open", () => {
		useUiStore.getState().openModal("shortcuts");
		render(<ShortcutsModal />);
		expect(screen.getByRole("dialog")).toBeTruthy();
		expect(screen.getByText("Keyboard Shortcuts")).toBeTruthy();
	});
	it("does not render when closed", () => {
		render(<ShortcutsModal />);
		expect(screen.queryByRole("dialog")).toBeNull();
	});
	it("renders grouped shortcut entries", () => {
		useUiStore.getState().openModal("shortcuts");
		render(<ShortcutsModal />);
		expect(screen.getByText("Practice")).toBeTruthy();
		expect(screen.getByText("Modes")).toBeTruthy();
		expect(screen.getByText("App")).toBeTruthy();
		expect(screen.getByText("Ctrl+G")).toBeTruthy();
		expect(screen.getByText("Generate a new question")).toBeTruthy();
		expect(screen.getByText("Ctrl+Shift+T")).toBeTruthy();
	});
	it("closes when the Got it button is clicked", () => {
		useUiStore.getState().openModal("shortcuts");
		render(<ShortcutsModal />);
		fireEvent.click(screen.getByRole("button", {name: "Got it"}));
		expect(useUiStore.getState().activeModal).toBeNull();
	});
});
