import {describe, it, expect, beforeEach} from "vitest";
import {render, screen, fireEvent} from "@testing-library/react";
import {QuestionCard} from "../QuestionCard";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSpecStore} from "../../../stores/specStore";
import type {Session} from "../../../services/contracts";
import type {GeneratedQuestion, Specification} from "../../../types/models";
function createMatchMedia(initialMatches: boolean): () => {matches: boolean; addEventListener: () => void; removeEventListener: () => void} {
    return () => ({
        matches: initialMatches,
        addEventListener: () => {},
        removeEventListener: () => {},
    });
}
function makeQuestion(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
    return {
        id: "q1",
        topic_id: "t1",
        skill_id: "s1",
        question_type: "SA",
        difficulty: 2,
        text: "What is $2+2$?",
        answer: "4",
        solution_text: "",
        solution_latex: "",
        variables: {},
        ...overrides,
    };
}
function makeSession(question: GeneratedQuestion): Session {
    const spec: Specification = {
        units: [{id: "u1", name: "Unit One", description: ""}],
        topics: [{id: "t1", name: "Arithmetic", unit_id: "u1", description: ""}],
        skills: [],
        templates: [],
    };
    return {
        id: "s1",
        specification: spec,
        questions: [question],
        mode: "Single",
        currentIndex: 0,
        results: [],
        isActive: true,
        isFinished: false,
        questionStartTime: Date.now(),
        sessionStartTime: Date.now(),
    };
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
    useSpecStore.setState({
        specification: null,
        loading: false,
        error: null,
        empty: true,
    });
}
describe("QuestionCard", () => {
    beforeEach(() => {
        resetStores();
        Object.defineProperty(window, "matchMedia", {writable: true, value: createMatchMedia(false)});
    });
    it("renders empty state when no question is loaded", () => {
        render(<QuestionCard />);
        expect(screen.getByText("Pick a topic and click Generate to start")).toBeDefined();
    });
    it("renders question text when a question is loaded", () => {
        const question = makeQuestion();
        usePracticeStore.getState().setSession(makeSession(question));
        useSpecStore.getState().setSpecification(makeSession(question).specification);
        render(<QuestionCard />);
        expect(screen.getByText(/What is/)).toBeDefined();
    });
    it("renders topic badge from the parsed specification", () => {
        const question = makeQuestion();
        usePracticeStore.getState().setSession(makeSession(question));
        useSpecStore.getState().setSpecification(makeSession(question).specification);
        render(<QuestionCard />);
        expect(screen.getByText("Arithmetic")).toBeDefined();
    });
    it("renders difficulty badge based on question difficulty", () => {
        const question = makeQuestion({difficulty: 2});
        usePracticeStore.getState().setSession(makeSession(question));
        useSpecStore.getState().setSpecification(makeSession(question).specification);
        render(<QuestionCard />);
        expect(screen.getByText("Medium")).toBeDefined();
    });
    it("renders MCQ choices with letter prefixes", () => {
        const question = makeQuestion({
            question_type: "MC",
            choices: ["3", "4", "5"],
        });
        usePracticeStore.getState().setSession(makeSession(question));
        useSpecStore.getState().setSpecification(makeSession(question).specification);
        render(<QuestionCard />);
        const radios = screen.getAllByRole("radio");
        expect(radios.length).toBe(3);
        expect(radios[0]?.textContent).toContain("A");
        expect(radios[0]?.textContent).toContain("3");
        expect(radios[1]?.textContent).toContain("B");
        expect(radios[1]?.textContent).toContain("4");
        expect(radios[2]?.textContent).toContain("C");
        expect(radios[2]?.textContent).toContain("5");
    });
    it("selects an MCQ choice when clicked", () => {
        const question = makeQuestion({
            question_type: "MC",
            choices: ["3", "4", "5"],
        });
        usePracticeStore.getState().setSession(makeSession(question));
        useSpecStore.getState().setSpecification(makeSession(question).specification);
        render(<QuestionCard />);
        const radios = screen.getAllByRole("radio");
        fireEvent.click(radios[1]!);
        expect(radios[1]?.getAttribute("aria-checked")).toBe("true");
        expect(usePracticeStore.getState().selectedChoiceIndex).toBe(1);
    });
    it("disables MCQ choices when feedback is shown", () => {
        const question = makeQuestion({
            question_type: "MC",
            choices: ["3", "4", "5"],
        });
        usePracticeStore.getState().setSession(makeSession(question));
        usePracticeStore.getState().setShowFeedback(true);
        useSpecStore.getState().setSpecification(makeSession(question).specification);
        render(<QuestionCard />);
        const radios = screen.getAllByRole("radio");
        for (const radio of radios) {
            expect(radio.hasAttribute("disabled")).toBe(true);
        }
    });
    it("cycles through MCQ choices with arrow keys", () => {
        const question = makeQuestion({
            question_type: "MC",
            choices: ["3", "4", "5"],
        });
        usePracticeStore.getState().setSession(makeSession(question));
        useSpecStore.getState().setSpecification(makeSession(question).specification);
        render(<QuestionCard />);
        const container = screen.getByRole("radiogroup");
        fireEvent.keyDown(container, {key: "ArrowDown"});
        expect(usePracticeStore.getState().selectedChoiceIndex).toBe(0);
        fireEvent.keyDown(container, {key: "ArrowRight"});
        expect(usePracticeStore.getState().selectedChoiceIndex).toBe(1);
        fireEvent.keyDown(container, {key: "ArrowUp"});
        expect(usePracticeStore.getState().selectedChoiceIndex).toBe(0);
        fireEvent.keyDown(container, {key: "ArrowLeft"});
        expect(usePracticeStore.getState().selectedChoiceIndex).toBe(2);
    });
    it("does not render MCQ choices for short-answer questions", () => {
        const question = makeQuestion({question_type: "SA"});
        usePracticeStore.getState().setSession(makeSession(question));
        useSpecStore.getState().setSpecification(makeSession(question).specification);
        render(<QuestionCard />);
        expect(screen.queryByRole("radiogroup")).toBeNull();
    });
});
