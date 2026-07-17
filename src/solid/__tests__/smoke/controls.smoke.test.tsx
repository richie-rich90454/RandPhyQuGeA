import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {MentalControls} from "../../components/practice/MentalControls";
import {SingleControls} from "../../components/practice/SingleControls";
import {MathToolbar} from "../../components/practice/MathToolbar";
import {ToastProvider} from "../../components/ui/ToastProvider";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useSpecStore} from "../../stores/specStore";
import {useUiStore} from "../../stores/uiStore";
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
describe("controls smoke", () => {
    it("MentalControls renders the difficulty pills and start button", () => {
        render(() => (
            <ToastProvider>
                <MentalControls />
            </ToastProvider>
        ));
        expect(screen.getByRole("radiogroup", {name: "Difficulty"})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /Start Session/i})).toBeInTheDocument();
    });
    it("MentalControls renders the time and score badges in idle state", () => {
        render(() => (
            <ToastProvider>
                <MentalControls />
            </ToastProvider>
        ));
        expect(screen.getByText("01:00")).toBeInTheDocument();
        expect(screen.getByText("0 / 0")).toBeInTheDocument();
    });
    it("SingleControls renders Generate and Check buttons", () => {
        render(() => (
            <ToastProvider>
                <SingleControls />
            </ToastProvider>
        ));
        expect(screen.getByRole("button", {name: /Generate/i})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /Check/i})).toBeInTheDocument();
    });
    it("SingleControls renders the Auto and Shuffle switches", () => {
        render(() => (
            <ToastProvider>
                <SingleControls />
            </ToastProvider>
        ));
        expect(screen.getAllByRole("switch")).toHaveLength(2);
    });
    it("MathToolbar renders primary symbol buttons and the more trigger", () => {
        render(() => <MathToolbar onInsert={() => {}} />);
        expect(screen.getByText("\u2212")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "More symbols"})).toBeInTheDocument();
    });
    it("MathToolbar disables symbols when disabled prop is set", () => {
        render(() => <MathToolbar onInsert={() => {}} disabled={true} />);
        expect(screen.getByText("\u2212")).toBeDisabled();
    });
});
