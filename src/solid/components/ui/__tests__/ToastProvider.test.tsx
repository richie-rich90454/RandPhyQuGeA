import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import type {JSX} from "solid-js";
import {ToastProvider, useToast} from "../ToastProvider";
import type {ToastApi} from "../ToastProvider";
function ToastConsumer(props: {message: string; variant?: "success" | "error" | "info" | "warning"; duration?: number}): JSX.Element {
	let api = useToast();
	let handleClick = () => api.toast({message: props.message, variant: props.variant, duration: props.duration});
	return (
		<button type="button" onClick={handleClick}>
			Push
		</button>
	);
}
describe("ToastProvider", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});
	it("renders nothing initially", () => {
		render(() => (
			<ToastProvider>
				<div>No toast yet</div>
			</ToastProvider>
		));
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});
	it("renders children content", () => {
		render(() => (
			<ToastProvider>
				<div>Child content</div>
			</ToastProvider>
		));
		expect(screen.getByText("Child content")).toBeInTheDocument();
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
	it("removeToast dismisses a queued toast by id", () => {
		let captured: ToastApi | null = null;
		function Captor(): JSX.Element {
			let api = useToast();
			captured = api;
			return <div>captor</div>;
		}
		render(() => (
			<ToastProvider>
				<Captor />
			</ToastProvider>
		));
		expect(captured).not.toBeNull();
		captured!.toast({message: "Removable", duration: 0});
		expect(screen.getByText("Removable")).toBeInTheDocument();
		let status = screen.getByRole("status");
		let id = Number(status.dataset.toastId ?? "0");
		captured!.removeToast(id);
		expect(screen.queryByText("Removable")).not.toBeInTheDocument();
	});
	it("renders the toast region into a portal on document.body", () => {
		render(() => (
			<ToastProvider>
				<ToastConsumer message="Portalled" variant="info" duration={0} />
			</ToastProvider>
		));
		fireEvent.click(screen.getByText("Push"));
		let region = screen.getByRole("region", {name: /notifications/i});
		expect(region).toBeInTheDocument();
		expect(document.body.contains(region)).toBe(true);
	});
	it("throws when useToast is used outside a provider", () => {
		expect(() =>
			render(() => {
				useToast();
				return <div />;
			}),
		).toThrow(/ToastProvider/);
	});
});
