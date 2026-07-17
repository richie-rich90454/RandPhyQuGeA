import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import {ResumeSessionModal} from "../ResumeSessionModal";
import {useUiStore} from "../../../stores/uiStore";
import type {SessionSnapshot, Session} from "../../../../services/contracts";
function makeSnapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
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
    return {session, createdAt: new Date().toISOString(), ...overrides};
}
beforeEach(() => {
    useUiStore.setState(useUiStore.getInitialState());
});
describe("ResumeSessionModal", () => {
    it("does not render when closed", () => {
        render(() => <ResumeSessionModal snapshot={makeSnapshot()} onResume={() => {}} onDiscard={() => {}} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    it("renders session details when open", () => {
        useUiStore.getState().openModal("resume-session");
        render(() => <ResumeSessionModal snapshot={makeSnapshot()} onResume={() => {}} onDiscard={() => {}} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Resume previous session?")).toBeInTheDocument();
        expect(screen.getByText("Single")).toBeInTheDocument();
        expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
    });
    it("calls onResume and closes the modal when Resume is clicked", () => {
        useUiStore.getState().openModal("resume-session");
        let onResume = vi.fn<() => void>();
        let onDiscard = vi.fn<() => void>();
        render(() => <ResumeSessionModal snapshot={makeSnapshot()} onResume={onResume} onDiscard={onDiscard} />);
        fireEvent.click(screen.getByRole("button", {name: /resume/i}));
        expect(onResume).toHaveBeenCalledTimes(1);
        expect(onDiscard).not.toHaveBeenCalled();
        expect(useUiStore.getState().activeModal).toBeNull();
    });
    it("calls onDiscard and closes the modal when Discard is clicked", () => {
        useUiStore.getState().openModal("resume-session");
        let onResume = vi.fn<() => void>();
        let onDiscard = vi.fn<() => void>();
        render(() => <ResumeSessionModal snapshot={makeSnapshot()} onResume={onResume} onDiscard={onDiscard} />);
        fireEvent.click(screen.getByRole("button", {name: /discard/i}));
        expect(onDiscard).toHaveBeenCalledTimes(1);
        expect(onResume).not.toHaveBeenCalled();
        expect(useUiStore.getState().activeModal).toBeNull();
    });
    it("calls onDiscard when the modal is dismissed via Escape", () => {
        useUiStore.getState().openModal("resume-session");
        let onDiscard = vi.fn<() => void>();
        render(() => <ResumeSessionModal snapshot={makeSnapshot()} onResume={() => {}} onDiscard={onDiscard} />);
        fireEvent.keyDown(screen.getByRole("dialog"), {key: "Escape"});
        expect(onDiscard).toHaveBeenCalledTimes(1);
    });
    it("does not render when snapshot is null", () => {
        useUiStore.getState().openModal("resume-session");
        render(() => <ResumeSessionModal snapshot={null} onResume={() => {}} onDiscard={() => {}} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
