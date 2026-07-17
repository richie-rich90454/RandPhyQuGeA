import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import {AppShell} from "../../components/layout/AppShell";
import {AppTopBar} from "../../components/layout/AppTopBar";
import {LiquidBackground} from "../../components/LiquidBackground";
import {A11yLiveRegion} from "../../components/A11yLiveRegion";
import {ToastProvider, useToast} from "../../components/ui/ToastProvider";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useSpecStore} from "../../stores/specStore";
import {useUiStore} from "../../stores/uiStore";
function ToastCaller(props: {message: string}): JSX.Element {
    let {toast} = useToast();
    return (
        <button type="button" onClick={() => toast({variant: "info", message: props.message, duration: 0})}>
            Fire
        </button>
    );
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
describe("layout smoke", () => {
    it("AppShell renders the skip-link targeting main content", () => {
        render(() => (
            <AppShell toolbar={<div>Toolbar</div>}>
                <div>Main child</div>
            </AppShell>
        ));
        let skipLink = screen.getByRole("link", {name: /skip to main content/i});
        expect(skipLink.getAttribute("href")).toBe("#main-content");
    });
    it("AppShell renders the main landmark with id main-content", () => {
        render(() => (
            <AppShell toolbar={<div>Toolbar</div>}>
                <div>Main child</div>
            </AppShell>
        ));
        let main = screen.getByRole("main");
        expect(main.id).toBe("main-content");
    });
    it("AppShell renders the footer with version and copyright", () => {
        render(() => (
            <AppShell toolbar={<div>Toolbar</div>}>
                <div>Main child</div>
            </AppShell>
        ));
        let footer = screen.getByRole("contentinfo");
        expect(footer.textContent).toContain("RandPhyQuGeA v");
        expect(footer.textContent).toContain("2026 Richard");
    });
    it("AppShell renders toolbar above main and children inside main", () => {
        render(() => (
            <AppShell toolbar={<div data-testid="toolbar">Toolbar</div>}>
                <div data-testid="main-child">Main child</div>
            </AppShell>
        ));
        expect(screen.getByTestId("toolbar")).toBeInTheDocument();
        let main = screen.getByRole("main");
        expect(main.contains(screen.getByTestId("main-child"))).toBe(true);
    });
    it("AppTopBar renders the wordmark and actions slot", () => {
        render(() => <AppTopBar actions={<button data-testid="action">Action</button>} />);
        expect(screen.getByRole("link", {name: /RandPhyQuGeA home/i})).toBeInTheDocument();
        expect(screen.getByTestId("action")).toBeInTheDocument();
    });
    it("AppTopBar renders a custom wordmark override", () => {
        render(() => <AppTopBar wordmark="CustomBrand" />);
        expect(screen.getByText("CustomBrand")).toBeInTheDocument();
    });
    it("LiquidBackground renders a decorative root marked aria-hidden", () => {
        let {container} = render(() => <LiquidBackground />);
        let root = container.firstChild as HTMLElement;
        expect(root).toBeTruthy();
        expect(root.getAttribute("aria-hidden")).toBe("true");
    });
    it("A11yLiveRegion renders a status role with polite aria-live", () => {
        render(() => <A11yLiveRegion message="Question loaded" />);
        let region = screen.getByTestId("a11y-live-region");
        expect(region).toHaveAttribute("role", "status");
        expect(region).toHaveAttribute("aria-live", "polite");
        expect(region.textContent).toBe("Question loaded");
    });
    it("ToastProvider renders a toast via the provider API", () => {
        render(() => (
            <ToastProvider>
                <ToastCaller message="Layout toast" />
            </ToastProvider>
        ));
        fireEvent.click(screen.getByRole("button", {name: "Fire"}));
        expect(screen.getByText("Layout toast")).toBeInTheDocument();
    });
});
