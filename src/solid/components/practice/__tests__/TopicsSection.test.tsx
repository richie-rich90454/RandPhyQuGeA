import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {TopicsSection} from "../TopicsSection";
import {useSpecStore} from "../../../stores/specStore";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useUiStore} from "../../../stores/uiStore";
import type {Specification} from "../../../../types/models";
function makeSpec(): Specification {
	return {
		units: [{id: "u1", name: "Mechanics", description: ""}],
		topics: [
			{id: "t1", name: "Kinematics", unit_id: "u1", description: ""},
			{id: "t2", name: "Forces", unit_id: "u1", description: ""},
		],
		skills: [],
		templates: [],
	};
}
beforeEach(() => {
	useSpecStore.setState(useSpecStore.getInitialState());
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useUiStore.setState(useUiStore.getInitialState());
});
describe("TopicsSection", () => {
	it("renders pills for each topic when a spec is loaded", () => {
		useSpecStore.setState({specification: makeSpec(), loading: false, error: null, empty: false});
		render(() => <TopicsSection />);
		expect(screen.getByRole("button", {name: /Kinematics/i})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: /Forces/i})).toBeInTheDocument();
	});
	it("shows the no-topics message when the spec is empty", () => {
		render(() => <TopicsSection />);
		expect(screen.getByText("No topics found.")).toBeInTheDocument();
	});
	it("selecting a pill writes the topic id to the practice store", () => {
		useSpecStore.setState({specification: makeSpec(), loading: false, error: null, empty: false});
		render(() => <TopicsSection />);
		fireEvent.click(screen.getByRole("button", {name: /Kinematics/i}));
		expect(usePracticeStore.getState().selectedTopicId).toBe("t1");
	});
	it("clicking the active pill clears the selection", () => {
		useSpecStore.setState({specification: makeSpec(), loading: false, error: null, empty: false});
		usePracticeStore.setState({...usePracticeStore.getState(), selectedTopicId: "t1"});
		render(() => <TopicsSection />);
		fireEvent.click(screen.getByRole("button", {name: /Kinematics/i}));
		expect(usePracticeStore.getState().selectedTopicId).toBeNull();
	});
	it("filters pills by the search query", () => {
		useSpecStore.setState({specification: makeSpec(), loading: false, error: null, empty: false});
		render(() => <TopicsSection />);
		let input = screen.getByLabelText("Search topics");
		fireEvent.input(input, {target: {value: "forc"}});
		expect(screen.queryByRole("button", {name: /Kinematics/i})).not.toBeInTheDocument();
		expect(screen.getByRole("button", {name: /Forces/i})).toBeInTheDocument();
	});
	it("shows the error message when loading fails", () => {
		useSpecStore.setState({specification: null, loading: false, error: {type: "parse", message: "boom"}, empty: true});
		render(() => <TopicsSection />);
		expect(screen.getByText(/boom/)).toBeInTheDocument();
	});
});
