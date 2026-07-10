import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {McqToggle} from "../McqToggle";
import {usePracticeStore} from "../../../stores/practiceStore";
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
});
describe("McqToggle", () => {
	it("renders the MCQ switch unchecked by default", () => {
		render(() => <McqToggle />);
		let sw=screen.getByRole("switch");
		expect(sw).not.toBeChecked();
	});
	it("reflects the practice store mcqEnabled state", () => {
		usePracticeStore.setState({...usePracticeStore.getState(), mcqEnabled: true});
		render(() => <McqToggle />);
		expect(screen.getByRole("switch")).toBeChecked();
	});
	it("toggles mcqEnabled when clicked", () => {
		render(() => <McqToggle />);
		fireEvent.click(screen.getByRole("switch"));
		expect(usePracticeStore.getState().mcqEnabled).toBe(true);
	});
});
