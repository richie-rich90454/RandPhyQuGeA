import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {ConfirmDialog} from "../ConfirmDialog";
describe("ConfirmDialog", () => {
	it("renders nothing when closed", () => {
		render(() => <ConfirmDialog open={false} title="Delete" message="Sure?" onConfirm={() => {}} onCancel={() => {}} />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it("renders title and message when open", () => {
		render(() => <ConfirmDialog open={true} title="Delete" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Delete")).toBeInTheDocument();
		expect(screen.getByText("Are you sure?")).toBeInTheDocument();
	});
	it("renders default button labels", () => {
		render(() => <ConfirmDialog open={true} title="Delete" message="Sure?" onConfirm={() => {}} onCancel={() => {}} />);
		expect(screen.getByText("Confirm")).toBeInTheDocument();
		expect(screen.getByText("Cancel")).toBeInTheDocument();
	});
	it("renders custom button labels", () => {
		render(() => <ConfirmDialog open={true} title="Delete" message="Sure?" confirmLabel="Delete it" cancelLabel="Keep it" onConfirm={() => {}} onCancel={() => {}} />);
		expect(screen.getByText("Delete it")).toBeInTheDocument();
		expect(screen.getByText("Keep it")).toBeInTheDocument();
	});
	it("calls onConfirm when confirm button clicked", () => {
		let handler=vi.fn();
		render(() => <ConfirmDialog open={true} title="Delete" message="Sure?" onConfirm={handler} onCancel={() => {}} />);
		fireEvent.click(screen.getByText("Confirm"));
		expect(handler).toHaveBeenCalledOnce();
	});
	it("calls onCancel when cancel button clicked", () => {
		let handler=vi.fn();
		render(() => <ConfirmDialog open={true} title="Delete" message="Sure?" onConfirm={() => {}} onCancel={handler} />);
		fireEvent.click(screen.getByText("Cancel"));
		expect(handler).toHaveBeenCalledOnce();
	});
	it("calls onCancel when modal is dismissed via Escape", () => {
		let handler=vi.fn();
		render(() => <ConfirmDialog open={true} title="Delete" message="Sure?" onConfirm={() => {}} onCancel={handler} />);
		fireEvent.keyDown(document, {key: "Escape"});
		expect(handler).toHaveBeenCalledOnce();
	});
});
