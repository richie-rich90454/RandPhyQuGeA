import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {OnboardingModal} from "../../components/modals/OnboardingModal";
import {PrintModal} from "../../components/modals/PrintModal";
import {RecommendModal} from "../../components/modals/RecommendModal";
import {ManageDataModal} from "../../components/modals/ManageDataModal";
import {SettingsModal} from "../../components/modals/SettingsModal";
import {ShortcutsModal} from "../../components/modals/ShortcutsModal";
import {ResumeSessionModal} from "../../components/modals/ResumeSessionModal";
import {ToastProvider} from "../../components/ui/ToastProvider";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useSpecStore} from "../../stores/specStore";
import {useUiStore} from "../../stores/uiStore";
import type {SessionSnapshot, Session} from "../../../services/contracts";
function createMatchMedia(): Window["matchMedia"] {
	return (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	});
}
function makeSnapshot(): SessionSnapshot {
	let session: Session = {
		id: "s1",
		specification: {units: [], topics: [], skills: [], templates: []},
		questions: [
			{id: "q1", topic_id: "t1", skill_id: "s1", question_type: "SA", response_mode: "frq", difficulty: 1, text: "text", answer: "42", solution_text: "", solution_latex: "", variables: {}},
		],
		mode: "Single",
		currentIndex: 0,
		results: [],
		isActive: true,
		isFinished: false,
		questionStartTime: Date.now(),
		sessionStartTime: Date.now(),
	};
	return {session, createdAt: new Date().toISOString()};
}
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
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
	window.matchMedia = createMatchMedia();
});
describe("modals smoke", () => {
	it("OnboardingModal renders the dialog when open", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});
	it("PrintModal renders the dialog when open", () => {
		useUiStore.getState().openModal("print");
		render(() => (
			<ToastProvider>
				<PrintModal />
			</ToastProvider>
		));
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Print Worksheet")).toBeInTheDocument();
	});
	it("RecommendModal renders the dialog when open", () => {
		useUiStore.getState().openModal("recommend");
		render(() => <RecommendModal />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});
	it("ManageDataModal renders the dialog when open", () => {
		useUiStore.getState().openModal("manage-data");
		render(() => (
			<ToastProvider>
				<ManageDataModal />
			</ToastProvider>
		));
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Manage Performance Data")).toBeInTheDocument();
	});
	it("SettingsModal renders the dialog when open", () => {
		useUiStore.getState().openModal("settings");
		render(() => <SettingsModal />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Settings")).toBeInTheDocument();
	});
	it("ShortcutsModal renders the dialog when open", () => {
		useUiStore.getState().openModal("shortcuts");
		render(() => <ShortcutsModal />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
	});
	it("ResumeSessionModal renders the dialog when open", () => {
		useUiStore.getState().openModal("resume-session");
		render(() => <ResumeSessionModal snapshot={makeSnapshot()} onResume={() => {}} onDiscard={() => {}} />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Resume previous session?")).toBeInTheDocument();
	});
	it("none of the modals render a dialog when closed", () => {
		render(() => (
			<>
				<OnboardingModal />
				<ToastProvider>
					<PrintModal />
					<ManageDataModal />
				</ToastProvider>
				<RecommendModal />
				<SettingsModal />
				<ShortcutsModal />
				<ResumeSessionModal snapshot={makeSnapshot()} onResume={() => {}} onDiscard={() => {}} />
			</>
		));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
