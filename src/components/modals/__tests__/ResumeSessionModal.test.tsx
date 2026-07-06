import {describe, it, expect, beforeEach, vi} from "vitest";
import {render, screen, fireEvent} from "@testing-library/react";
import {createElement, type ReactNode} from "react";
import {ResumeSessionModal} from "../ResumeSessionModal";
import {ServiceProvider} from "../../providers/ServiceProvider";
import {ToastProvider} from "../../ui";
import {ServiceContainer} from "../../../services/container";
import {useUiStore} from "../../../stores/uiStore";
import {usePracticeStore} from "../../../stores/practiceStore";
import type {SessionSnapshot, Session} from "../../../services/contracts";
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
function makeSnapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
	const session: Session = {
		id: "s1",
		specification: {units: [], topics: [], skills: [], templates: []},
		questions: [{id: "q1", topic_id: "t1", skill_id: "s1", question_type: "SA", difficulty: 1, text: "text", answer: "42", solution_text: "", solution_latex: "", variables: {}}],
		mode: "Single",
		currentIndex: 0,
		results: [],
		isActive: true,
		isFinished: false,
		questionStartTime: Date.now(),
		sessionStartTime: Date.now(),
	};
	return {session, createdAt: new Date().toISOString(), ...overrides};
}
function renderWithStores(children: ReactNode) {
	const container = ServiceContainer.createDefault();
	return render(createElement(ToastProvider, null, createElement(ServiceProvider, {container}, children)));
}
beforeEach(() => {
	useUiStore.setState(useUiStore.getInitialState());
	usePracticeStore.setState(usePracticeStore.getInitialState());
	window.matchMedia = createMatchMedia(false);
});
describe("ResumeSessionModal", () => {
	it("does not render when closed", () => {
		renderWithStores(<ResumeSessionModal snapshot={makeSnapshot()} onResume={() => {}} onDiscard={() => {}} />);
		expect(screen.queryByRole("dialog")).toBeNull();
	});
	it("renders session details when open", () => {
		useUiStore.getState().openModal("resume-session");
		renderWithStores(<ResumeSessionModal snapshot={makeSnapshot()} onResume={() => {}} onDiscard={() => {}} />);
		expect(screen.getByRole("dialog")).toBeTruthy();
		expect(screen.getByText("Resume previous session?")).toBeTruthy();
		expect(screen.getByText("Single")).toBeTruthy();
		expect(screen.getByText("Question 1 of 1")).toBeTruthy();
	});
	it("calls onResume and closes the modal when Resume is clicked", () => {
		useUiStore.getState().openModal("resume-session");
		const onResume = vi.fn<() => void>();
		const onDiscard = vi.fn<() => void>();
		renderWithStores(<ResumeSessionModal snapshot={makeSnapshot()} onResume={onResume} onDiscard={onDiscard} />);
		fireEvent.click(screen.getByRole("button", {name: /resume/i}));
		expect(onResume).toHaveBeenCalledTimes(1);
		expect(onDiscard).not.toHaveBeenCalled();
		expect(useUiStore.getState().activeModal).toBeNull();
	});
	it("calls onDiscard and closes the modal when Discard is clicked", () => {
		useUiStore.getState().openModal("resume-session");
		const onResume = vi.fn<() => void>();
		const onDiscard = vi.fn<() => void>();
		renderWithStores(<ResumeSessionModal snapshot={makeSnapshot()} onResume={onResume} onDiscard={onDiscard} />);
		fireEvent.click(screen.getByRole("button", {name: /discard/i}));
		expect(onDiscard).toHaveBeenCalledTimes(1);
		expect(onResume).not.toHaveBeenCalled();
		expect(useUiStore.getState().activeModal).toBeNull();
	});
	it("calls onDiscard when the modal is dismissed via Escape/backdrop", () => {
		useUiStore.getState().openModal("resume-session");
		const onDiscard = vi.fn<() => void>();
		renderWithStores(<ResumeSessionModal snapshot={makeSnapshot()} onResume={() => {}} onDiscard={onDiscard} />);
		fireEvent.keyDown(screen.getByRole("dialog"), {key: "Escape"});
		expect(onDiscard).toHaveBeenCalledTimes(1);
	});
	it("does not render when snapshot is null", () => {
		useUiStore.getState().openModal("resume-session");
		renderWithStores(<ResumeSessionModal snapshot={null} onResume={() => {}} onDiscard={() => {}} />);
		expect(screen.queryByRole("dialog")).toBeNull();
	});
});
