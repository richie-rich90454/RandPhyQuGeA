import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
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
	window.matchMedia=createMatchMedia(false);
});
describe("ShortcutsModal", () => {
	it("renders when the shortcuts modal is open", () => {
		useUiStore.getState().openModal("shortcuts");
		render(() => <ShortcutsModal />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
	});
	it("does not render when closed", () => {
		render(() => <ShortcutsModal />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it("renders grouped shortcut entries", () => {
		useUiStore.getState().openModal("shortcuts");
		render(() => <ShortcutsModal />);
		expect(screen.getByText("Practice")).toBeInTheDocument();
		expect(screen.getByText("Modes")).toBeInTheDocument();
		expect(screen.getByText("App")).toBeInTheDocument();
		expect(screen.getByText("Ctrl+G")).toBeInTheDocument();
		expect(screen.getByText("Generate question")).toBeInTheDocument();
		expect(screen.getByText("Create a new random question with current settings.")).toBeInTheDocument();
		expect(screen.getByText("Ctrl+Shift+T")).toBeInTheDocument();
	});
	it("closes when the Got it button is clicked", () => {
		useUiStore.getState().openModal("shortcuts");
		render(() => <ShortcutsModal />);
		fireEvent.click(screen.getByRole("button", {name: "Got it"}));
		expect(useUiStore.getState().activeModal).toBeNull();
	});
});
