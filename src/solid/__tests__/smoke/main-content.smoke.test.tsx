import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {MainContent} from "../../components/practice/MainContent";
import {QuestionCard} from "../../components/practice/QuestionCard";
import {AnswerSection} from "../../components/practice/AnswerSection";
import {AnswerCard} from "../../components/practice/AnswerCard";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useSpecStore} from "../../stores/specStore";
import {useUiStore} from "../../stores/uiStore";
import type {Session} from "../../../services/contracts";
import type {GeneratedQuestion, Specification} from "../../../types/models";
function makeSpec(): Specification {
    return {
        units: [{id: "u1", name: "Mechanics", description: ""}],
        topics: [{id: "t1", name: "Kinematics", unit_id: "u1", description: ""}],
        skills: [],
        templates: [],
    };
}
function makeQuestion(overrides?: Partial<GeneratedQuestion>): GeneratedQuestion {
    return {
        id: "q1",
        topic_id: "t1",
        skill_id: "s1",
        question_type: "SA",
        difficulty: 2,
        text: "What is $F=ma$?",
        answer: "force",
        response_mode: "frq",
        solution_text: "",
        solution_latex: "",
        variables: {},
        ...overrides,
    };
}
function makeSession(question: GeneratedQuestion): Session {
    let now = Date.now();
    return {
        id: "sess1",
        specification: makeSpec(),
        questions: [question],
        mode: "Single",
        currentIndex: 0,
        results: [],
        isActive: true,
        isFinished: false,
        questionStartTime: now,
        sessionStartTime: now,
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
describe("main content smoke", () => {
    it("MainContent renders slotted children", () => {
        render(() => (
            <MainContent>
                <span data-testid="child">Child</span>
            </MainContent>
        ));
        expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    it("MainContent renders the analytics slot", () => {
        render(() => (
            <MainContent analytics={<span data-testid="analytics">Analytics</span>}>
                <span data-testid="practice">Practice</span>
            </MainContent>
        ));
        expect(screen.getByTestId("analytics")).toBeInTheDocument();
    });
    it("QuestionCard renders the empty state when no question is loaded", () => {
        render(() => <QuestionCard />);
        expect(screen.getByText("Pick a topic and click Generate to start")).toBeInTheDocument();
    });
    it("QuestionCard renders question text when a session is loaded", () => {
        usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion({text: "Compute velocity."}))});
        render(() => <QuestionCard />);
        expect(screen.getByText("Compute velocity.")).toBeInTheDocument();
    });
    it("QuestionCard renders MCQ choices for a multiple-choice question", () => {
        let mcq = makeQuestion({
            question_type: "MC",
            choices: ["2 N", "4 N", "6 N", "8 N"],
            correct_choice_index: 1,
            response_mode: "mcq",
        });
        usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(mcq)});
        render(() => <QuestionCard />);
        expect(screen.getByRole("radiogroup")).toBeInTheDocument();
        expect(screen.getAllByRole("radio")).toHaveLength(4);
    });
    it("AnswerSection renders the Check button when a session is active", () => {
        usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), userAnswer: "force"});
        render(() => <AnswerSection />);
        expect(screen.getByRole("button", {name: /Check/i})).toBeInTheDocument();
    });
    it("AnswerSection renders the Next button when feedback is shown", () => {
        usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion()), showFeedback: true});
        render(() => <AnswerSection />);
        expect(screen.getByRole("button", {name: /Next/i})).toBeInTheDocument();
    });
    it("AnswerCard renders the answer textarea when a session is active", () => {
        usePracticeStore.setState({...usePracticeStore.getState(), session: makeSession(makeQuestion())});
        render(() => <AnswerCard />);
        expect(screen.getByRole("textbox", {name: "Answer"})).toBeInTheDocument();
    });
    it("AnswerCard disables the textarea when no question is loaded", () => {
        render(() => <AnswerCard />);
        expect(screen.getByRole("textbox", {name: "Answer"})).toBeDisabled();
    });
});
