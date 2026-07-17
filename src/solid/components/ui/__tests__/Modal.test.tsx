import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {createSignal} from "solid-js";
import {Modal} from "../Modal";
function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}
describe("Modal", () => {
    it("renders nothing when closed", () => {
        render(() => (
            <Modal open={false} onClose={() => {}}>
                Hidden
            </Modal>
        ));
        expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });
    it("renders title and children when open", () => {
        render(() => (
            <Modal open={true} onClose={() => {}} title="My Title">
                Body content
            </Modal>
        ));
        expect(screen.getByText("My Title")).toBeInTheDocument();
        expect(screen.getByText("Body content")).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    it("calls onClose when Escape is pressed", async () => {
        let onClose = vi.fn<() => void>();
        render(() => (
            <Modal open={true} onClose={onClose}>
                Body
            </Modal>
        ));
        await flush();
        fireEvent.keyDown(document, {key: "Escape"});
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it("calls onClose when backdrop is clicked", async () => {
        let onClose = vi.fn<() => void>();
        render(() => (
            <Modal open={true} onClose={onClose}>
                Body
            </Modal>
        ));
        await flush();
        fireEvent.click(screen.getByRole("dialog"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it("does not close when content is clicked", async () => {
        let onClose = vi.fn<() => void>();
        render(() => (
            <Modal open={true} onClose={onClose}>
                <span data-testid="inner">Body</span>
            </Modal>
        ));
        await flush();
        fireEvent.click(screen.getByTestId("inner"));
        expect(onClose).not.toHaveBeenCalled();
    });
    it("close button calls onClose", async () => {
        let onClose = vi.fn<() => void>();
        render(() => (
            <Modal open={true} onClose={onClose}>
                Body
            </Modal>
        ));
        await flush();
        fireEvent.click(screen.getByRole("button", {name: /close dialog/i}));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it("renders footer when provided", () => {
        render(() => (
            <Modal open={true} onClose={() => {}} footer={<button>OK</button>}>
                Body
            </Modal>
        ));
        expect(screen.getByRole("button", {name: "OK"})).toBeInTheDocument();
    });
    it("locks body scroll while open", async () => {
        render(() => (
            <Modal open={true} onClose={() => {}}>
                Body
            </Modal>
        ));
        await flush();
        expect(document.body.style.overflow).toBe("hidden");
    });
    it("restores body scroll on close", async () => {
        document.body.style.overflow = "";
        let [open, setOpen] = createSignal(true);
        render(() => (
            <Modal open={open()} onClose={() => setOpen(false)}>
                Body
            </Modal>
        ));
        await flush();
        expect(document.body.style.overflow).toBe("hidden");
        setOpen(false);
        await flush();
        expect(document.body.style.overflow).not.toBe("hidden");
    });
    it("traps Tab focus inside the modal (wraps from last to first) (task 5.12 bug 1)", async () => {
        render(() => (
            <Modal open={true} onClose={() => {}}>
                <button>First</button>
                <button>Second</button>
            </Modal>
        ));
        await flush();
        let buttons = screen.getAllByRole("button");
        let contentBtns = buttons.filter(b => b.textContent === "First" || b.textContent === "Second");
        let lastBtn = contentBtns[contentBtns.length - 1];
        if (!lastBtn) throw new Error("last button not found");
        lastBtn.focus();
        expect(document.activeElement).toBe(lastBtn);
        fireEvent.keyDown(document, {key: "Tab"});
        expect(document.activeElement).not.toBe(lastBtn);
        let firstBtn = contentBtns[0];
        if (!firstBtn) throw new Error("first button not found");
        expect(document.activeElement === firstBtn || document.activeElement === screen.getByRole("button", {name: /close dialog/i})).toBe(true);
    });
    it("traps Shift+Tab focus inside the modal (wraps from first to last) (task 5.12 bug 1)", async () => {
        render(() => (
            <Modal open={true} onClose={() => {}}>
                <button>First</button>
                <button>Second</button>
            </Modal>
        ));
        await flush();
        let closeBtn = screen.getByRole("button", {name: /close dialog/i});
        closeBtn.focus();
        expect(document.activeElement).toBe(closeBtn);
        fireEvent.keyDown(document, {key: "Tab", shiftKey: true});
        let buttons = screen.getAllByRole("button");
        let contentBtns = buttons.filter(b => b.textContent === "First" || b.textContent === "Second");
        let lastBtn = contentBtns[contentBtns.length - 1];
        if (!lastBtn) throw new Error("last button not found");
        expect(document.activeElement).toBe(lastBtn);
    });
    it("moves focus into the modal when it opens (task 5.12 bug 1)", async () => {
        render(() => (
            <Modal open={true} onClose={() => {}} title="Test">
                Body
            </Modal>
        ));
        await flush();
        let closeBtn = screen.getByRole("button", {name: /close dialog/i});
        expect(document.activeElement).toBe(closeBtn);
    });
    it("restores focus to the trigger element when the modal closes (task 5.12 bug 2)", async () => {
        let [open, setOpen] = createSignal(false);
        render(() => (
            <>
                <button data-testid="trigger" onClick={() => setOpen(true)}>
                    Open
                </button>
                <Modal open={open()} onClose={() => setOpen(false)}>
                    Body
                </Modal>
            </>
        ));
        let trigger = screen.getByTestId("trigger");
        trigger.focus();
        expect(document.activeElement).toBe(trigger);
        setOpen(true);
        await flush();
        expect(document.activeElement).not.toBe(trigger);
        setOpen(false);
        await flush();
        expect(document.activeElement).toBe(trigger);
    });
    it("brings focus back into the modal when it escapes via focusin (task 5.12 bug 1)", async () => {
        let [open, setOpen] = createSignal(true);
        render(() => (
            <>
                <button data-testid="outside">Outside</button>
                <Modal open={open()} onClose={() => setOpen(false)}>
                    <button>Inside</button>
                </Modal>
            </>
        ));
        await flush();
        let outsideBtn = screen.getByTestId("outside");
        if (!(outsideBtn instanceof HTMLButtonElement)) throw new Error("outside button not found");
        outsideBtn.focus();
        expect(document.activeElement).not.toBe(outsideBtn);
        let dialog = screen.getByRole("dialog");
        expect(dialog.contains(document.activeElement)).toBe(true);
    });
    it("locks body scroll with overflow hidden (task 5.12 bug 3)", async () => {
        document.body.style.overflow = "";
        render(() => (
            <Modal open={true} onClose={() => {}}>
                Body
            </Modal>
        ));
        await flush();
        expect(document.body.style.overflow).toBe("hidden");
    });
});
