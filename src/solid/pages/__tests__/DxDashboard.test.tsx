import {render, screen, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {DxDashboard} from "../DxDashboard";
beforeEach(() => {
	window.location.hash="";
});
describe("DxDashboard page", () => {
	it("renders the page heading and subtitle", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("DX Dashboard")).toBeInTheDocument();
		expect(screen.getByText(/Coverage targets, environment info/)).toBeInTheDocument();
	});
	it("renders the back-to-app link", () => {
		render(() => <DxDashboard />);
		expect(screen.getByRole("button", {name: /back to app/i})).toBeInTheDocument();
	});
	it("renders the Environment card", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("Environment")).toBeInTheDocument();
		expect(screen.getByText("Runtime context for this session.")).toBeInTheDocument();
	});
	it("shows the environment info labels", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("User Agent")).toBeInTheDocument();
		expect(screen.getByText("Viewport")).toBeInTheDocument();
		expect(screen.getByText("Device Pixel Ratio")).toBeInTheDocument();
		expect(screen.getByText("Hardware Concurrency")).toBeInTheDocument();
	});
	it("renders the DX Metrics card with metric values", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("DX Metrics")).toBeInTheDocument();
		expect(screen.getByText("Solid Routes")).toBeInTheDocument();
		expect(screen.getByText("Question Types")).toBeInTheDocument();
		expect(screen.getByText("UI Components")).toBeInTheDocument();
		expect(screen.getByText("Coverage Target")).toBeInTheDocument();
	});
	it("renders the Performance Benchmark card", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("Performance Benchmark")).toBeInTheDocument();
		expect(screen.getByText(/Times the core pipeline/)).toBeInTheDocument();
	});
	it("renders the Run benchmark button", () => {
		render(() => <DxDashboard />);
		expect(screen.getByRole("button", {name: /run benchmark/i})).toBeInTheDocument();
	});
	it("shows the empty state before running the benchmark", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("No results yet")).toBeInTheDocument();
	});
	it("runs the benchmark and shows the results table", async () => {
		render(() => <DxDashboard />);
		fireEvent.click(screen.getByRole("button", {name: /run benchmark/i}));
		await waitFor(() => expect(screen.getByText("Parse default spec")).toBeInTheDocument(), {timeout: 5000});
		expect(screen.getByText("Generate 1 question")).toBeInTheDocument();
		expect(screen.getByText("Generate batch (10)")).toBeInTheDocument();
		expect(screen.getByText("Generate batch (100)")).toBeInTheDocument();
		expect(screen.getByText("Export 100 questions (JSON)")).toBeInTheDocument();
		expect(screen.getByText("Operation")).toBeInTheDocument();
		expect(screen.getByText("Iterations")).toBeInTheDocument();
		expect(screen.getByText("Time", {exact: true})).toBeInTheDocument();
	});
	it("clears the hash when the back link is clicked", () => {
		window.location.hash="/dx";
		render(() => <DxDashboard />);
		fireEvent.click(screen.getByRole("button", {name: /back to app/i}));
		expect(window.location.hash).toBe("");
	});
});
