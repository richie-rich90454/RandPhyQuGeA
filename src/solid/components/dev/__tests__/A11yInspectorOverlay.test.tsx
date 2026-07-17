import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {createSignal} from "solid-js";
import {A11yInspectorOverlay} from "../A11yInspectorOverlay";
import type {A11yIssue} from "../../../../lib/a11y/A11yChecker";
function makeRoot(issues: A11yIssue[], isOpen: boolean) {
    let [openSig, setOpenSig] = createSignal(isOpen);
    let [issuesSig, setIssuesSig] = createSignal(issues);
    return {
        render: () =>
            render(() => (
                <A11yInspectorOverlay
                    isOpen={openSig}
                    issues={issuesSig}
                    errorCount={() => issuesSig().filter(i => i.severity === "error").length}
                    warningCount={() => issuesSig().filter(i => i.severity === "warning").length}
                    onToggle={() => setOpenSig(!openSig())}
                    onRefresh={() => {}}
                />
            )),
        setOpen: setOpenSig,
        setIssues: setIssuesSig,
    };
}
beforeEach(() => {
    document.body.innerHTML = "";
});
describe("A11yInspectorOverlay", () => {
    it("renders nothing when isOpen is false", () => {
        let root = makeRoot([], false);
        root.render();
        expect(screen.queryByText("A11y Inspector")).not.toBeInTheDocument();
    });
    it("renders the panel when isOpen is true", () => {
        let root = makeRoot([], true);
        root.render();
        expect(screen.getByText("A11y Inspector")).toBeInTheDocument();
    });
    it("shows the empty state when there are no issues", () => {
        let root = makeRoot([], true);
        root.render();
        expect(screen.getByText("No accessibility issues found.")).toBeInTheDocument();
    });
    it("shows the error and warning counts", () => {
        let issues: A11yIssue[] = [
            {rule: "img-alt", severity: "error", message: "Missing alt", selector: "img"},
            {rule: "heading-order", severity: "warning", message: "Skip", selector: "h3"},
        ];
        let root = makeRoot(issues, true);
        root.render();
        expect(screen.getByText("1 errors")).toBeInTheDocument();
        expect(screen.getByText("1 warnings")).toBeInTheDocument();
    });
    it("renders one list item per issue", () => {
        let issues: A11yIssue[] = [
            {rule: "img-alt", severity: "error", message: "Missing alt", selector: "img"},
            {rule: "button-name", severity: "error", message: "No name", selector: "button"},
        ];
        let root = makeRoot(issues, true);
        root.render();
        expect(screen.getByText("img-alt")).toBeInTheDocument();
        expect(screen.getByText("button-name")).toBeInTheDocument();
        expect(screen.getByText("Missing alt")).toBeInTheDocument();
        expect(screen.getByText("No name")).toBeInTheDocument();
    });
    it("renders the Refresh button", () => {
        let root = makeRoot([], true);
        root.render();
        expect(screen.getByRole("button", {name: /re-run scan/i})).toBeInTheDocument();
    });
    it("renders the Close button", () => {
        let root = makeRoot([], true);
        root.render();
        expect(screen.getByRole("button", {name: /close inspector/i})).toBeInTheDocument();
    });
    it("hides the panel when Close is clicked", () => {
        let root = makeRoot([], true);
        root.render();
        fireEvent.click(screen.getByRole("button", {name: /close inspector/i}));
        expect(screen.queryByText("A11y Inspector")).not.toBeInTheDocument();
    });
    it("marks each item with data-severity", () => {
        let issues: A11yIssue[] = [
            {rule: "img-alt", severity: "error", message: "M", selector: "img"},
            {rule: "heading-order", severity: "warning", message: "M", selector: "h3"},
        ];
        let root = makeRoot(issues, true);
        root.render();
        let errorItem = document.querySelector('[data-severity="error"]');
        let warningItem = document.querySelector('[data-severity="warning"]');
        expect(errorItem).not.toBeNull();
        expect(warningItem).not.toBeNull();
    });
    it("renders the selector as a code element", () => {
        let issues: A11yIssue[] = [{rule: "img-alt", severity: "error", message: "Missing alt", selector: "#hero"}];
        let root = makeRoot(issues, true);
        root.render();
        expect(screen.getByText("#hero")).toBeInTheDocument();
        expect(screen.getByText("#hero").tagName).toBe("CODE");
    });
    it("updates reactively when issues change", () => {
        let issues: A11yIssue[] = [];
        let root = makeRoot(issues, true);
        root.render();
        expect(screen.getByText("No accessibility issues found.")).toBeInTheDocument();
        root.setIssues([{rule: "img-alt", severity: "error", message: "M", selector: "img"}]);
        expect(screen.queryByText("No accessibility issues found.")).not.toBeInTheDocument();
        expect(screen.getByText("img-alt")).toBeInTheDocument();
    });
});
