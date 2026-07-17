import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {MentalControls} from "../MentalControls";
import {QuestionCard} from "../QuestionCard";
import {ResultsCard} from "../ResultsCard";
import {ToastProvider} from "../../ui/ToastProvider";
import {usePracticeStore} from "../../../stores/practiceStore";
import {useSettingsStore} from "../../../stores/settingsStore";
import {useSpecStore} from "../../../stores/specStore";
beforeEach(() => {
    usePracticeStore.setState(usePracticeStore.getInitialState());
    useSettingsStore.setState({...useSettingsStore.getState(), mentalDifficulty: "medium", mentalDurationSec: 60, mentalScope: "all", mentalShuffle: false, mentalUnlimited: false});
    useSpecStore.setState(useSpecStore.getInitialState());
});
describe("live regions (task 5.23)", () => {
    it("timer badge exposes role=timer for screen readers", () => {
        render(() => (
            <ToastProvider>
                <MentalControls />
            </ToastProvider>
        ));
        expect(screen.getByRole("timer")).toBeInTheDocument();
    });
    it("timer badge retains its accessible name", () => {
        render(() => (
            <ToastProvider>
                <MentalControls />
            </ToastProvider>
        ));
        expect(screen.getByRole("timer")).toHaveAttribute("aria-label", "Time remaining");
    });
    it("score badge has aria-live=polite for change announcements", () => {
        render(() => (
            <ToastProvider>
                <MentalControls />
            </ToastProvider>
        ));
        let score = screen.getByLabelText("Current score");
        expect(score).toHaveAttribute("aria-live", "polite");
    });
    it("score badge has aria-atomic=true for full-content announcement", () => {
        render(() => (
            <ToastProvider>
                <MentalControls />
            </ToastProvider>
        ));
        let score = screen.getByLabelText("Current score");
        expect(score).toHaveAttribute("aria-atomic", "true");
    });
    it("question display live region has aria-atomic=true", () => {
        render(() => <QuestionCard />);
        let display = screen.getByRole("region", {name: "Question display"});
        expect(display).toHaveAttribute("aria-live", "polite");
        expect(display).toHaveAttribute("aria-atomic", "true");
    });
    it("results display live region has aria-atomic=true", () => {
        render(() => <ResultsCard />);
        let display = screen.getByRole("status");
        expect(display).toHaveAttribute("aria-live", "polite");
        expect(display).toHaveAttribute("aria-atomic", "true");
    });
});
