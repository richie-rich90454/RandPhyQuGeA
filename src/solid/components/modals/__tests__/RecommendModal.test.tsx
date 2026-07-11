import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {RecommendModal} from "../RecommendModal";
import {useUiStore} from "../../../stores/uiStore";
import {useProgressStore} from "../../../stores/progressStore";
import {useSpecStore} from "../../../stores/specStore";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSettingsStore} from "../../../stores/settingsStore";
import type {PracticeResult, Specification} from "../../../../types/models";
function makeResult(overrides: Partial<PracticeResult>={}): PracticeResult {
	return {
		id: "r1",
		question_id: "q1",
		topic_id: "t1",
		skill_id: "s1",
		is_correct: true,
		time_taken_ms: 1500,
		user_answer: "4",
		timestamp: "2026-07-06T10:00:00.000Z",
		mode: "Single",
		difficulty: 2,
		...overrides,
	};
}
function makeSpecification(): Specification {
	return {
		units: [{id: "u1", name: "Algebra", description: ""}],
		topics: [
			{id: "t1", unit_id: "u1", name: "Linear Equations", description: ""},
			{id: "t2", unit_id: "u1", name: "Quadratics", description: ""},
		],
		skills: [],
		templates: [],
	};
}
beforeEach(() => {
	useUiStore.setState(useUiStore.getInitialState());
	useProgressStore.setState(useProgressStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useSettingsStore.setState(useSettingsStore.getInitialState());
});
describe("RecommendModal", () => {
	it("does not render when closed", () => {
		render(() => <RecommendModal />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it("renders the empty state when there are no results", () => {
		useSpecStore.setState({specification: makeSpecification(), empty: false});
		useUiStore.getState().openModal("recommend");
		render(() => <RecommendModal />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("No recommendations yet")).toBeInTheDocument();
		expect(screen.getByText(/complete a few questions/i)).toBeInTheDocument();
	});
	it("renders the strong-accuracy empty state when all topics are strong", () => {
		useSpecStore.setState({specification: makeSpecification(), empty: false});
		useProgressStore.setState({results: [makeResult({id: "r1", topic_id: "t1", is_correct: true})]});
		useUiStore.getState().openModal("recommend");
		render(() => <RecommendModal />);
		expect(screen.getByText(/accuracy is strong across every topic/i)).toBeInTheDocument();
	});
	it("renders weak topics as a list when accuracy is below threshold", () => {
		useSpecStore.setState({specification: makeSpecification(), empty: false});
		useProgressStore.setState({
			results: [
				makeResult({id: "r1", topic_id: "t1", is_correct: false}),
				makeResult({id: "r2", topic_id: "t1", is_correct: false}),
				makeResult({id: "r3", topic_id: "t2", is_correct: true}),
			],
		});
		useUiStore.getState().openModal("recommend");
		render(() => <RecommendModal />);
		let list=screen.getByRole("list");
		expect(list.tagName).toBe("UL");
		expect(screen.getByText("Linear Equations")).toBeInTheDocument();
		expect(screen.queryByText("Quadratics")).not.toBeInTheDocument();
		expect(screen.getByText("0%")).toBeInTheDocument();
		expect(screen.getByText("2 attempts · 0 correct")).toBeInTheDocument();
	});
	it("practices a single topic when Practice is clicked", () => {
		useSpecStore.setState({specification: makeSpecification(), empty: false});
		useProgressStore.setState({results: [makeResult({id: "r1", topic_id: "t1", is_correct: false})]});
		useUiStore.getState().openModal("recommend");
		render(() => <RecommendModal />);
		fireEvent.click(screen.getByRole("button", {name: /^practice$/i}));
		expect(usePracticeStore.getState().selectedTopicId).toBe("t1");
		expect(useSettingsStore.getState().defaultMode).toBe("Single");
		expect(useUiStore.getState().activeModal).toBe(null);
	});
	it("practices all weak topics when Practice All is clicked", () => {
		useSpecStore.setState({specification: makeSpecification(), empty: false});
		useProgressStore.setState({results: [makeResult({id: "r1", topic_id: "t1", is_correct: false})]});
		useUiStore.getState().openModal("recommend");
		render(() => <RecommendModal />);
		fireEvent.click(screen.getByRole("button", {name: /practice all/i}));
		expect(usePracticeStore.getState().selectedTopicId).toBe(null);
		expect(useSettingsStore.getState().defaultMode).toBe("Single");
		expect(useUiStore.getState().activeModal).toBe(null);
	});
	it("closes the modal when Dismiss is clicked", () => {
		useSpecStore.setState({specification: makeSpecification(), empty: false});
		useUiStore.getState().openModal("recommend");
		render(() => <RecommendModal />);
		fireEvent.click(screen.getByRole("button", {name: /dismiss/i}));
		expect(useUiStore.getState().activeModal).toBe(null);
	});
});
