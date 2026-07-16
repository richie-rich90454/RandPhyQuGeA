import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {ControlToolbarTop} from "../../components/practice/ControlToolbarTop";
import {ControlToolbarBottom} from "../../components/practice/ControlToolbarBottom";
import {ModeSelector} from "../../components/practice/ModeSelector";
import {TopicsSection} from "../../components/practice/TopicsSection";
import {McqToggle} from "../../components/practice/McqToggle";
import {UtilityButtons} from "../../components/practice/UtilityButtons";
import {ToastProvider} from "../../components/ui/ToastProvider";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useSpecStore} from "../../stores/specStore";
import {useUiStore} from "../../stores/uiStore";
import type {Specification} from "../../../types/models";
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
function resetStores() {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useProgressStore.setState(useProgressStore.getInitialState());
	useSettingsStore.setState(useSettingsStore.getInitialState());
	useSpecStore.setState(useSpecStore.getInitialState());
	useUiStore.setState(useUiStore.getInitialState());
}
beforeEach(() => {
	resetStores();
});
describe("toolbars smoke", () => {
	it("ControlToolbarTop renders slotted children", () => {
		render(() => (
			<ControlToolbarTop>
				<span data-testid="slot-a">A</span>
				<span data-testid="slot-b">B</span>
			</ControlToolbarTop>
		));
		expect(screen.getByTestId("slot-a")).toBeInTheDocument();
		expect(screen.getByTestId("slot-b")).toBeInTheDocument();
	});
	it("ControlToolbarBottom renders single controls slot by default", () => {
		useSettingsStore.setState({...useSettingsStore.getState(), defaultMode: "Single"});
		render(() => <ControlToolbarBottom singleControls={<span data-testid="single">Single</span>} mentalControls={<span data-testid="mental">Mental</span>} />);
		expect(screen.getByTestId("single")).toBeInTheDocument();
	});
	it("ControlToolbarBottom renders mental controls slot when mode is Mental", () => {
		useSettingsStore.setState({...useSettingsStore.getState(), defaultMode: "Mental"});
		render(() => <ControlToolbarBottom singleControls={<span data-testid="single">Single</span>} mentalControls={<span data-testid="mental">Mental</span>} />);
		expect(screen.getByTestId("mental")).toBeInTheDocument();
	});
	it("ModeSelector renders a button for each mode", () => {
		render(() => <ModeSelector />);
		expect(screen.getByRole("button", {name: "Single"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Mental"})).toBeInTheDocument();
	});
	it("TopicsSection renders pills when a spec is loaded", () => {
		useSpecStore.setState({specification: makeSpec(), loading: false, error: null, empty: false});
		render(() => <TopicsSection />);
		expect(screen.getByRole("button", {name: /Kinematics/i})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: /Forces/i})).toBeInTheDocument();
	});
	it("TopicsSection renders the empty message when no spec", () => {
		render(() => <TopicsSection />);
		expect(screen.getByText("No topics found.")).toBeInTheDocument();
	});
	it("McqToggle renders the response-mode switch", () => {
		render(() => <McqToggle />);
		expect(screen.getByRole("switch")).toBeInTheDocument();
	});
	it("UtilityButtons renders theme, settings, and print buttons", () => {
		render(() => (
			<ToastProvider>
				<UtilityButtons />
			</ToastProvider>
		));
		expect(screen.getByRole("button", {name: "Toggle theme"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Settings"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Print worksheet"})).toBeInTheDocument();
	});
});
