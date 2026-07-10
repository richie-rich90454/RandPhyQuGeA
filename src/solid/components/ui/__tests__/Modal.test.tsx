import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {createSignal} from "solid-js";
import {Modal} from "../Modal";
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
describe("Modal", () => {
	it("renders nothing when closed", () => {
		render(() => <Modal open={false} onClose={() => {}}>Hidden</Modal>);
		expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
	});
	it("renders title and children when open", () => {
		render(() => <Modal open={true} onClose={() => {}} title="My Title">Body content</Modal>);
		expect(screen.getByText("My Title")).toBeInTheDocument();
		expect(screen.getByText("Body content")).toBeInTheDocument();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});
	it("calls onClose when Escape is pressed", async () => {
		let onClose=vi.fn();
		render(() => <Modal open={true} onClose={onClose}>Body</Modal>);
		await flush();
		fireEvent.keyDown(document, {key: "Escape"});
		expect(onClose).toHaveBeenCalledTimes(1);
	});
	it("calls onClose when backdrop is clicked", async () => {
		let onClose=vi.fn();
		render(() => <Modal open={true} onClose={onClose}>Body</Modal>);
		await flush();
		fireEvent.click(screen.getByRole("dialog"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
	it("does not close when content is clicked", async () => {
		let onClose=vi.fn();
		render(() => <Modal open={true} onClose={onClose}><span data-testid="inner">Body</span></Modal>);
		await flush();
		fireEvent.click(screen.getByTestId("inner"));
		expect(onClose).not.toHaveBeenCalled();
	});
	it("close button calls onClose", async () => {
		let onClose=vi.fn();
		render(() => <Modal open={true} onClose={onClose}>Body</Modal>);
		await flush();
		fireEvent.click(screen.getByRole("button", {name: /close dialog/i}));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
	it("renders footer when provided", () => {
		render(() => <Modal open={true} onClose={() => {}} footer={<button>OK</button>}>Body</Modal>);
		expect(screen.getByRole("button", {name: "OK"})).toBeInTheDocument();
	});
	it("locks body scroll while open", async () => {
		render(() => <Modal open={true} onClose={() => {}}>Body</Modal>);
		await flush();
		expect(document.body.style.overflow).toBe("hidden");
	});
	it("restores body scroll on close", async () => {
		document.body.style.overflow="";
		let [open, setOpen]=createSignal(true);
		render(() => <Modal open={open()} onClose={() => setOpen(false)}>Body</Modal>);
		await flush();
		expect(document.body.style.overflow).toBe("hidden");
		setOpen(false);
		await flush();
		expect(document.body.style.overflow).not.toBe("hidden");
	});
});
