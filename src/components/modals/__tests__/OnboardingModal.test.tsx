import {describe, it, expect, beforeEach} from "vitest";
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import {OnboardingModal} from "../OnboardingModal";
import {useUiStore} from "../../../stores/uiStore";
import {useSettingsStore} from "../../../stores/settingsStore";
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
	useSettingsStore.setState({onboardingCompleted: false});
	window.matchMedia=createMatchMedia(false);
});
describe("OnboardingModal", () => {
	it("does not render when no modal is open", () => {
		render(<OnboardingModal />);
		expect(screen.queryByRole("dialog")).not.toBeTruthy();
	});
	it("renders the first step when the onboarding modal is open", () => {
		useUiStore.getState().openModal("onboarding");
		render(<OnboardingModal />);
		expect(screen.getByRole("dialog")).toBeTruthy();
		expect(screen.getByText("Physics practice, simplified")).toBeTruthy();
		expect(screen.getByText(/focused practice environment/)).toBeTruthy();
	});
	it("advances to the next step when Next is clicked", async () => {
		useUiStore.getState().openModal("onboarding");
		render(<OnboardingModal />);
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		await waitFor(() => {
			expect(screen.getByText("Practice your way")).toBeTruthy();
		});
	});
	it("goes back to the previous step when Back is clicked", async () => {
		useUiStore.getState().openModal("onboarding");
		render(<OnboardingModal />);
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		await waitFor(() => expect(screen.getByText("Practice your way")).toBeTruthy());
		fireEvent.click(screen.getByRole("button", {name: /back/i}));
		await waitFor(() => expect(screen.getByText("Welcome to RandPhyQuGeA")).toBeTruthy());
	});
	it("marks onboarding completed and closes modal on Get started", async () => {
		useUiStore.getState().openModal("onboarding");
		render(<OnboardingModal />);
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		fireEvent.click(screen.getByRole("button", {name: /next/i}));
		await waitFor(() => expect(screen.getByRole("button", {name: /get started/i})).toBeTruthy());
		fireEvent.click(screen.getByRole("button", {name: /get started/i}));
		await waitFor(() => {
			expect(useSettingsStore.getState().onboardingCompleted).toBe(true);
			expect(useUiStore.getState().activeModal).toBe(null);
		});
	});
	it("navigates steps using dot buttons", async () => {
		useUiStore.getState().openModal("onboarding");
		render(<OnboardingModal />);
		const dots=screen.getAllByRole("tab");
		fireEvent.click(dots[2]!);
		await waitFor(() => expect(screen.getByText("Stay in flow")).toBeTruthy());
	});
	it("advances with ArrowRight and goes back with ArrowLeft", async () => {
		useUiStore.getState().openModal("onboarding");
		render(<OnboardingModal />);
		fireEvent.keyDown(document, {key: "ArrowRight"});
		await waitFor(() => expect(screen.getByText("Practice your way")).toBeTruthy());
		fireEvent.keyDown(document, {key: "ArrowLeft"});
		await waitFor(() => expect(screen.getByText("Welcome to RandPhyQuGeA")).toBeTruthy());
	});
	it("jumps to first and last step with Home and End", async () => {
		useUiStore.getState().openModal("onboarding");
		render(<OnboardingModal />);
		fireEvent.keyDown(document, {key: "End"});
		await waitFor(() => expect(screen.getByText("Build momentum")).toBeTruthy());
		fireEvent.keyDown(document, {key: "Home"});
		await waitFor(() => expect(screen.getByText("Welcome to RandPhyQuGeA")).toBeTruthy());
	});
	it("closes modal and marks onboarding completed on Escape", async () => {
		useUiStore.getState().openModal("onboarding");
		render(<OnboardingModal />);
		fireEvent.keyDown(document, {key: "Escape"});
		await waitFor(() => {
			expect(useSettingsStore.getState().onboardingCompleted).toBe(true);
			expect(useUiStore.getState().activeModal).toBe(null);
		});
	});
});
