import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {SingleControls} from "../SingleControls";
import {ToastProvider} from "../../ui/Toast";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSpecStore} from "../../../stores/specStore";
function renderWithToast() {
	return render(() => (
		<ToastProvider>
			<SingleControls />
		</ToastProvider>
	));
}
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
});
describe("SingleControls", () => {
	it("renders the Generate and Check buttons", () => {
		renderWithToast();
		expect(screen.getByRole("button", {name: /Generate/i})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: /Check/i})).toBeInTheDocument();
	});
	it("disables the Check button when no session is active", () => {
		renderWithToast();
		expect(screen.getByRole("button", {name: /Check/i})).toBeDisabled();
	});
	it("renders the Auto and Shuffle switches unchecked by default", () => {
		renderWithToast();
		let switches=screen.getAllByRole("switch");
		expect(switches).toHaveLength(2);
		for (let sw of switches) {
			expect(sw).not.toBeChecked();
		}
	});
	it("renders the scope select with a default All option", () => {
		renderWithToast();
		let select=screen.getByRole("combobox", {name: "Scope"}) as HTMLSelectElement;
		let optionValues=Array.from(select.options).map(o => o.value);
		expect(optionValues).toEqual(["all"]);
	});
	it("toggles autoEnabled when the Auto switch is clicked", () => {
		renderWithToast();
		let autoSwitch=screen.getAllByRole("switch")[0]!;
		fireEvent.click(autoSwitch);
		expect(usePracticeStore.getState().autoEnabled).toBe(true);
	});
	it("toggles shuffle when the Shuffle switch is clicked", () => {
		renderWithToast();
		let shuffleSwitch=screen.getAllByRole("switch")[1]!;
		fireEvent.click(shuffleSwitch);
		expect(usePracticeStore.getState().shuffle).toBe(true);
	});
	it("updates the scope in the practice store when changed", () => {
		useSpecStore.setState({specification: {units: [{id: "u1", name: "Mechanics", description: ""}], topics: [], skills: [], templates: []}, loading: false, error: null, empty: false});
		renderWithToast();
		let select=screen.getByRole("combobox", {name: "Scope"});
		fireEvent.input(select, {target: {value: "u1"}});
		expect(usePracticeStore.getState().scope).toBe("u1");
	});
	it("shows the Ctrl+G shortcut hint on the Generate button when not generating", () => {
		renderWithToast();
		expect(screen.getByText("Ctrl+G")).toBeInTheDocument();
	});
});
