import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {OnboardingModal} from "../OnboardingModal";
import {useUiStore} from "../../../stores/uiStore";
import {useSettingsStore} from "../../../stores/settingsStore";
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
beforeEach(() => {
	useUiStore.setState(useUiStore.getInitialState());
	useSettingsStore.setState(useSettingsStore.getInitialState());
});
describe("OnboardingModal", () => {
	it("does not render when no modal is open", () => {
		render(() => <OnboardingModal />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it("renders the first step when the onboarding modal is open", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Physics practice, simplified")).toBeInTheDocument();
		expect(screen.getByText(/focused practice environment/)).toBeInTheDocument();
	});
	it("renders the steps as an ordered list", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		let list=screen.getByRole("list");
		expect(list.tagName).toBe("OL");
	});
	it("advances to the next step when Next is clicked", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		expect(screen.getByText("Practice your way")).toBeInTheDocument();
	});
	it("goes back to the previous step when Back is clicked", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		fireEvent.click(screen.getByRole("button", {name: /back/i}));
		expect(screen.getByText("Physics practice, simplified")).toBeInTheDocument();
	});
	it("marks onboarding completed and closes modal on Get started", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		fireEvent.click(screen.getByRole("button", {name: /get started/i}));
		expect(useSettingsStore.getState().onboardingCompleted).toBe(true);
		expect(useUiStore.getState().activeModal).toBe(null);
	});
	it("dismisses and marks completed when Skip is clicked", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		fireEvent.click(screen.getByRole("button", {name: /skip/i}));
		expect(useSettingsStore.getState().onboardingCompleted).toBe(true);
		expect(useUiStore.getState().activeModal).toBe(null);
	});
	it("navigates steps using dot buttons", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		let dots=screen.getAllByRole("tab");
		fireEvent.click(dots[2]!);
		expect(screen.getByText("Stay in flow")).toBeInTheDocument();
	});
	it("advances with ArrowRight and goes back with ArrowLeft", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		fireEvent.keyDown(document, {key: "ArrowRight"});
		expect(screen.getByText("Practice your way")).toBeInTheDocument();
		fireEvent.keyDown(document, {key: "ArrowLeft"});
		expect(screen.getByText("Physics practice, simplified")).toBeInTheDocument();
	});
	it("jumps to first and last step with Home and End", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		fireEvent.keyDown(document, {key: "End"});
		expect(screen.getByText("Build momentum")).toBeInTheDocument();
		fireEvent.keyDown(document, {key: "Home"});
		expect(screen.getByText("Physics practice, simplified")).toBeInTheDocument();
	});
	it("closes modal and marks onboarding completed on Escape", async () => {
		useUiStore.getState().openModal("onboarding");
		render(() => <OnboardingModal />);
		await flush();
		fireEvent.keyDown(document, {key: "Escape"});
		expect(useSettingsStore.getState().onboardingCompleted).toBe(true);
		expect(useUiStore.getState().activeModal).toBe(null);
	});
});
