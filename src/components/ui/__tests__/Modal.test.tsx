import {describe, it, expect, vi} from "vitest";
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import {act} from "react";
import {Modal} from "../Modal";
function getDialog(): HTMLDivElement {
	return screen.getByRole<HTMLDivElement>("dialog");
}
function App({open}: {open: boolean}) {
	return (
		<div>
			<button data-testid="trigger">Open</button>
			<Modal open={open} onClose={vi.fn<() => void>()} title="Title" />
		</div>
	);
}
describe("Modal", () => {
	it("renders when open and does not render when closed", () => {
		const {unmount}=render(<Modal open={true} onClose={vi.fn<() => void>()} title="Title">Content</Modal>);
		expect(getDialog()).not.toBeNull();
		expect(screen.getByText("Content")).not.toBeNull();
		unmount();
		render(<Modal open={false} onClose={vi.fn<() => void>()} title="Title">Content</Modal>);
		expect(screen.queryByRole("dialog")).toBeNull();
	});
	it("calls onClose when Escape is pressed", () => {
		const onClose=vi.fn<() => void>();
		render(<Modal open={true} onClose={onClose} title="Title" />);
		fireEvent.keyDown(document, {key: "Escape"});
		expect(onClose).toHaveBeenCalledTimes(1);
	});
	it("calls onClose when the backdrop is clicked", () => {
		const onClose=vi.fn<() => void>();
		render(<Modal open={true} onClose={onClose} title="Title"><div>Body</div></Modal>);
		fireEvent.click(getDialog());
		expect(onClose).toHaveBeenCalledTimes(1);
	});
	it("calls onClose when the close button is clicked", () => {
		const onClose=vi.fn<() => void>();
		render(<Modal open={true} onClose={onClose} title="Title" />);
		const closeButton=screen.getByRole<HTMLButtonElement>("button", {name: /Close dialog/i});
		fireEvent.click(closeButton);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
	it("cycles focus with Tab and Shift+Tab", () => {
		render(<Modal open={true} onClose={vi.fn<() => void>()} title="Title"><button data-testid="first">First</button><button data-testid="second">Second</button></Modal>);
		const closeButton=screen.getByRole<HTMLButtonElement>("button", {name: /Close dialog/i});
		const second=screen.getByTestId<HTMLButtonElement>("second");
		expect(document.activeElement).toBe(closeButton);
		act(() => {
			second.focus();
		});
		fireEvent.keyDown(document, {key: "Tab"});
		expect(document.activeElement).toBe(closeButton);
		act(() => {
			closeButton.focus();
		});
		fireEvent.keyDown(document, {key: "Tab", shiftKey: true});
		expect(document.activeElement).toBe(second);
	});
	it("restores focus to the previously focused element on close", () => {
		const {rerender}=render(<App open={false} />);
		const trigger=screen.getByTestId<HTMLButtonElement>("trigger");
		act(() => {
			trigger.focus();
		});
		rerender(<App open={true} />);
		rerender(<App open={false} />);
		expect(document.activeElement).toBe(trigger);
	});
	it("uses aria-labelledby pointing to the title", () => {
		render(<Modal open={true} onClose={vi.fn<() => void>()} title="Hello">Content</Modal>);
		const dialog=getDialog();
		expect(dialog.getAttribute("aria-labelledby")).toBe("modal-title");
		const title=screen.getByText("Hello");
		expect(title.id).toBe("modal-title");
	});
	it("falls back to aria-label when no title is provided", () => {
		render(<Modal open={true} onClose={vi.fn<() => void>()} ariaLabel="Custom label">Content</Modal>);
		const dialog=getDialog();
		expect(dialog.getAttribute("aria-label")).toBe("Custom label");
		expect(dialog.getAttribute("aria-labelledby")).toBeNull();
	});
	it("uses Framer Motion AnimatePresence wrappers", async () => {
		const {rerender}=render(<Modal open={true} onClose={vi.fn<() => void>()} title="Title">Content</Modal>);
		expect(getDialog()).not.toBeNull();
		rerender(<Modal open={false} onClose={vi.fn<() => void>()} title="Title">Content</Modal>);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), {timeout: 500});
	});
});
