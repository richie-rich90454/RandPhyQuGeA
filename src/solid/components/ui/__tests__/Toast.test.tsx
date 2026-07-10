import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import type {JSX} from "solid-js";
import {ToastProvider, useToast} from "../Toast";
function ToastConsumer(props: {message: string; variant?: "success" | "error" | "info" | "warning"; duration?: number}): JSX.Element {
	let api=useToast();
	let handleClick=() => api.toast({message: props.message, variant: props.variant, duration: props.duration});
	return (
		<button type="button" onClick={handleClick}>Push</button>
	);
}
describe("Toast", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});
	it("renders nothing initially", () => {
		render(() => <ToastProvider><div>No toast yet</div></ToastProvider>);
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});
	it("shows a toast when toast() is called", () => {
		render(() => (
			<ToastProvider>
				<ToastConsumer message="Hello" variant="info" />
			</ToastProvider>
		));
		fireEvent.click(screen.getByText("Push"));
		expect(screen.getByText("Hello")).toBeInTheDocument();
		expect(screen.getByRole("status")).toBeInTheDocument();
	});
	it("uses polite aria-live for info variant", () => {
		render(() => (
			<ToastProvider>
				<ToastConsumer message="Info" variant="info" />
			</ToastProvider>
		));
		fireEvent.click(screen.getByText("Push"));
		expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
	});
	it("uses assertive aria-live for error variant", () => {
		render(() => (
			<ToastProvider>
				<ToastConsumer message="Error" variant="error" />
			</ToastProvider>
		));
		fireEvent.click(screen.getByText("Push"));
		expect(screen.getByRole("status")).toHaveAttribute("aria-live", "assertive");
	});
	it("auto-dismisses after the duration", () => {
		render(() => (
			<ToastProvider>
				<ToastConsumer message="Bye" variant="info" duration={1000} />
			</ToastProvider>
		));
		fireEvent.click(screen.getByText("Push"));
		expect(screen.getByText("Bye")).toBeInTheDocument();
		vi.advanceTimersByTime(1000);
		expect(screen.queryByText("Bye")).not.toBeInTheDocument();
	});
	it("does not auto-dismiss when duration is 0", () => {
		render(() => (
			<ToastProvider>
				<ToastConsumer message="Persistent" variant="info" duration={0} />
			</ToastProvider>
		));
		fireEvent.click(screen.getByText("Push"));
		vi.advanceTimersByTime(10000);
		expect(screen.getByText("Persistent")).toBeInTheDocument();
	});
	it("dismisses on close button click", () => {
		render(() => (
			<ToastProvider>
				<ToastConsumer message="Dismiss me" variant="info" duration={0} />
			</ToastProvider>
		));
		fireEvent.click(screen.getByText("Push"));
		fireEvent.click(screen.getByLabelText("Dismiss notification"));
		expect(screen.queryByText("Dismiss me")).not.toBeInTheDocument();
	});
	it("renders multiple toasts", () => {
		render(() => (
			<ToastProvider>
				<ToastConsumer message="First" variant="info" duration={0} />
			</ToastProvider>
		));
		fireEvent.click(screen.getByText("Push"));
		fireEvent.click(screen.getByText("Push"));
		expect(screen.getAllByRole("status")).toHaveLength(2);
	});
});
