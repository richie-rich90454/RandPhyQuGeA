import {describe, it, expect, beforeEach} from "vitest";
import {render, screen} from "@testing-library/react";
import {ControlToolbarTop} from "../ControlToolbarTop";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSettingsStore} from "../../../stores/settingsStore";
import {useSpecStore} from "../../../stores/specStore";
import {useUiStore} from "../../../stores/uiStore";
function createMatchMedia(initialMatches: boolean): () => {matches: boolean; addEventListener: () => void; removeEventListener: () => void} {
	return () => ({
		matches: initialMatches,
		addEventListener: () => {},
		removeEventListener: () => {},
	});
}
function resetStores(): void {
	usePracticeStore.setState({
		session: null,
		userAnswer: "",
		selectedChoiceIndex: -1,
		showFeedback: false,
		lastResult: null,
		selectedTopicId: null,
		mcqEnabled: false,
		autoEnabled: false,
		scope: "all",
		shuffle: false,
	});
	useSettingsStore.setState({defaultMode: "Single"});
	useSpecStore.setState({specification: null, loading: false, error: null, empty: true});
	useUiStore.setState({searchQuery: "", activeModal: null});
}
describe("ControlToolbarTop", () => {
	beforeEach(() => {
		resetStores();
		Object.defineProperty(window, "matchMedia", {writable: true, value: createMatchMedia(false)});
	});
	it("renders the toolbar row with mode, topics, and MCQ groups", () => {
		const {container} = render(<ControlToolbarTop />);
		const row = container.querySelector(".toolbar-row-top");
		expect(row).not.toBeNull();
		expect(screen.getByRole("button", {name: "Single"})).toBeDefined();
		expect(screen.getByRole("button", {name: "Mental"})).toBeDefined();
		expect(screen.getByRole("textbox", {name: "Search topics"})).toBeDefined();
		expect(screen.getByRole("switch", {name: "MCQ"})).toBeDefined();
	});
	it("keeps separators between groups", () => {
		const {container} = render(<ControlToolbarTop />);
		const separators = container.querySelectorAll("[role='separator']");
		expect(separators.length).toBe(2);
	});
	it("preserves overflow-prevention classes on child groups", () => {
		const {container} = render(<ControlToolbarTop />);
		expect(container.querySelector(".mode-group")).not.toBeNull();
		expect(container.querySelector(".options-group")).not.toBeNull();
		expect(container.querySelector(".mcq-switch")).not.toBeNull();
		expect(container.querySelector(".toolbar-section")).not.toBeNull();
		expect(container.querySelector(".topic-pills-container")).not.toBeNull();
	});
});
