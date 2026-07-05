import {describe, it, expect, vi, afterEach} from "vitest";
import {render, screen, fireEvent, waitFor, act} from "@testing-library/react";
import React from "react";
import {ToastProvider, useToast, type ToastVariant} from "../Toast";
vi.mock("framer-motion", () => ({
	motion: {
		div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {initial?: unknown; animate?: unknown; exit?: unknown; variants?: unknown; transition?: unknown; layout?: unknown}>(function MotionDiv(props, ref) {
			const {initial: _initial, animate: _animate, exit: _exit, variants: _variants, transition: _transition, layout: _layout, ...rest} = props;
			return <div ref={ref} {...rest} />;
		}),
	},
	AnimatePresence: function AnimatePresence({children}: {children: React.ReactNode}) {
		return <>{children}</>;
	},
	useReducedMotion: () => false,
}));
function getStatus(): HTMLDivElement {
	return screen.getByRole<HTMLDivElement>("status");
}
function TestButton({message="Hello", variant, duration}: {message?: string; variant?: ToastVariant; duration?: number}) {
	const {toast} = useToast();
	return <button onClick={() => toast({message, variant, duration})}>Show toast</button>;
}
function MultiButton() {
	const {toast} = useToast();
	return (
		<button
			onClick={() => {
				toast({message: "First"});
				toast({message: "Second"});
				toast({message: "Third"});
			}}
		>
			Show toasts
		</button>
	);
}
describe("Toast", () => {
	afterEach(() => {
		vi.useRealTimers();
	});
	it("shows a toast when toast() is called", async () => {
		render(
			<ToastProvider>
				<TestButton message="Hello" />
			</ToastProvider>
		);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() => expect(screen.getByText("Hello")).not.toBeNull());
	});
	it("auto-dismisses after duration", () => {
		vi.useFakeTimers();
		render(
			<ToastProvider>
				<TestButton message="Hello" duration={4000} />
			</ToastProvider>
		);
		fireEvent.click(screen.getByRole("button"));
		expect(screen.getByText("Hello")).not.toBeNull();
		act(() => {
			vi.advanceTimersByTime(4000);
		});
		expect(screen.queryByText("Hello")).toBeNull();
	});
	it("pauses auto-dismiss on hover", () => {
		vi.useFakeTimers();
		render(
			<ToastProvider>
				<TestButton message="Hello" duration={4000} />
			</ToastProvider>
		);
		fireEvent.click(screen.getByRole("button"));
		expect(screen.getByText("Hello")).not.toBeNull();
		act(() => {
			vi.advanceTimersByTime(2000);
		});
		const toast = getStatus();
		fireEvent.mouseEnter(toast);
		act(() => {
			vi.advanceTimersByTime(5000);
		});
		expect(screen.getByText("Hello")).not.toBeNull();
		fireEvent.mouseLeave(toast);
		act(() => {
			vi.advanceTimersByTime(2000);
		});
		expect(screen.queryByText("Hello")).toBeNull();
	});
	it("dismisses toast when close button is clicked", async () => {
		render(
			<ToastProvider>
				<TestButton message="Hello" />
			</ToastProvider>
		);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() => expect(screen.getByText("Hello")).not.toBeNull());
		fireEvent.click(screen.getByRole("button", {name: /Dismiss notification/i}));
		await waitFor(() => expect(screen.queryByText("Hello")).toBeNull());
	});
	it.each<[ToastVariant, string]>([
		["success", "success"],
		["error", "error"],
		["warning", "warning"],
		["info", "info"],
	])("renders the correct Phosphor icon for the %s variant", async (variant, label) => {
		render(
			<ToastProvider>
				<TestButton message={`${variant} toast`} variant={variant} />
			</ToastProvider>
		);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() => expect(screen.getByLabelText(label)).not.toBeNull());
	});
	it.each<[ToastVariant, string]>([
		["error", "assertive"],
		["warning", "assertive"],
		["info", "polite"],
		["success", "polite"],
	])("applies %s aria-live=%s", async (variant, live) => {
		render(
			<ToastProvider>
				<TestButton message={`${variant} toast`} variant={variant} />
			</ToastProvider>
		);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() => expect(getStatus().getAttribute("aria-live")).toBe(live));
	});
	it("stacks multiple toasts", async () => {
		render(
			<ToastProvider>
				<MultiButton />
			</ToastProvider>
		);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() => {
			expect(screen.getByText("First")).not.toBeNull();
			expect(screen.getByText("Second")).not.toBeNull();
			expect(screen.getByText("Third")).not.toBeNull();
		});
	});
});
