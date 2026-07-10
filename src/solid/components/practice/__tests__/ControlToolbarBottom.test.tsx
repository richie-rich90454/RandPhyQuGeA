import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {ControlToolbarBottom} from "../ControlToolbarBottom";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSettingsStore} from "../../../stores/settingsStore";
import type {Session} from "../../../../services/contracts";
import type {Specification} from "../../../../types/models";
function emptySpec(): Specification {
	return {units: [], topics: [], skills: [], templates: []};
}
beforeEach(() => {
	usePracticeStore.setState(usePracticeStore.getInitialState());
	useSettingsStore.setState({...useSettingsStore.getState(), defaultMode: "Single"});
});
describe("ControlToolbarBottom", () => {
	it("renders single controls when default mode is Single and no session", () => {
		render(() => (
			<ControlToolbarBottom
				singleControls={<span data-testid="single">Single</span>}
				mentalControls={<span data-testid="mental">Mental</span>}
			/>
		));
		expect(screen.getByTestId("single")).toBeInTheDocument();
		expect(screen.queryByTestId("mental")).not.toBeInTheDocument();
	});
	it("renders mental controls when default mode is Mental", () => {
		useSettingsStore.setState({...useSettingsStore.getState(), defaultMode: "Mental"});
		render(() => (
			<ControlToolbarBottom
				singleControls={<span data-testid="single">Single</span>}
				mentalControls={<span data-testid="mental">Mental</span>}
			/>
		));
		expect(screen.getByTestId("mental")).toBeInTheDocument();
		expect(screen.queryByTestId("single")).not.toBeInTheDocument();
	});
	it("uses the active session mode over the default mode", () => {
		useSettingsStore.setState({...useSettingsStore.getState(), defaultMode: "Single"});
		let session: Session={
			id: "s1",
			specification: emptySpec(),
			questions: [],
			mode: "Mental",
			currentIndex: 0,
			results: [],
			isActive: true,
			isFinished: false,
			questionStartTime: 0,
			sessionStartTime: 0,
		};
		usePracticeStore.setState({session});
		render(() => (
			<ControlToolbarBottom
				singleControls={<span data-testid="single">Single</span>}
				mentalControls={<span data-testid="mental">Mental</span>}
			/>
		));
		expect(screen.getByTestId("mental")).toBeInTheDocument();
	});
	it("renders nothing for a mode when its slot is not provided", () => {
		render(() => <ControlToolbarBottom singleControls={<span data-testid="single">Single</span>} />);
		expect(screen.getByTestId("single")).toBeInTheDocument();
	});
});
