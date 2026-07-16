import {render, screen, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {DxDashboard} from "../DxDashboard";
beforeEach(() => {
	window.location.hash = "";
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
		window.location.hash = "/dx";
		render(() => <DxDashboard />);
		fireEvent.click(screen.getByRole("button", {name: /back to app/i}));
		expect(window.location.hash).toBe("");
	});
});
describe("DxDashboard a11y inspector (task 6.49)", () => {
	it("renders the A11y Inspector toggle button", () => {
		render(() => <DxDashboard />);
		expect(screen.getByRole("button", {name: /a11y inspector/i})).toBeInTheDocument();
	});
	it("does not render the overlay panel before the toggle is clicked", () => {
		render(() => <DxDashboard />);
		expect(screen.queryByRole("dialog", {name: /accessibility inspector/i})).not.toBeInTheDocument();
	});
	it("opens the overlay when the toggle is clicked", () => {
		render(() => <DxDashboard />);
		fireEvent.click(screen.getByRole("button", {name: /a11y inspector/i}));
		expect(screen.getByRole("dialog", {name: /accessibility inspector/i})).toBeInTheDocument();
	});
	it("closes the overlay when the Close button is clicked", () => {
		render(() => <DxDashboard />);
		fireEvent.click(screen.getByRole("button", {name: /a11y inspector/i}));
		expect(screen.getByRole("dialog", {name: /accessibility inspector/i})).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", {name: /close inspector/i}));
		expect(screen.queryByRole("dialog", {name: /accessibility inspector/i})).not.toBeInTheDocument();
	});
	it("renders the Refresh button inside the overlay", () => {
		render(() => <DxDashboard />);
		fireEvent.click(screen.getByRole("button", {name: /a11y inspector/i}));
		expect(screen.getByRole("button", {name: /re-run scan/i})).toBeInTheDocument();
	});
});
describe("DxDashboard network status indicator (task 6.48)", () => {
	it("renders the NetworkStatusIndicator in the header", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("Online")).toBeInTheDocument();
	});
	it("renders the Simulate offline toggle button", () => {
		render(() => <DxDashboard />);
		expect(screen.getByRole("button", {name: /simulate offline/i})).toBeInTheDocument();
	});
	it("toggles to Forced offline when the toggle is clicked", () => {
		render(() => <DxDashboard />);
		fireEvent.click(screen.getByRole("button", {name: /simulate offline/i}));
		expect(screen.getByText("Forced offline")).toBeInTheDocument();
		expect(screen.getByRole("button", {name: /restore online/i})).toBeInTheDocument();
	});
	it("restores online when the toggle is clicked again", () => {
		render(() => <DxDashboard />);
		let button = screen.getByRole("button", {name: /simulate offline/i});
		fireEvent.click(button);
		expect(screen.getByText("Forced offline")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", {name: /restore online/i}));
		expect(screen.getByText("Online")).toBeInTheDocument();
	});
});
describe("DxDashboard perf budget card (task 6.46)", () => {
	it("renders the Perf Budget card heading", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("Perf Budget")).toBeInTheDocument();
		expect(screen.getByText(/Live resource-size budget monitor/)).toBeInTheDocument();
	});
	it("renders the Refresh budget button", () => {
		render(() => <DxDashboard />);
		expect(screen.getByRole("button", {name: /refresh budget/i})).toBeInTheDocument();
	});
	it("renders the budget table headers", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("Category")).toBeInTheDocument();
		expect(screen.getByText("Assets")).toBeInTheDocument();
		expect(screen.getByText("Actual")).toBeInTheDocument();
		expect(screen.getByText("Limit")).toBeInTheDocument();
		expect(screen.getByText("Status")).toBeInTheDocument();
	});
	it("renders a row for every default budget category", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("script")).toBeInTheDocument();
		expect(screen.getByText("style")).toBeInTheDocument();
		expect(screen.getByText("font")).toBeInTheDocument();
		expect(screen.getByText("image")).toBeInTheDocument();
		expect(screen.getByText("other")).toBeInTheDocument();
	});
	it("shows the Within budget badge when no resources are loaded", () => {
		render(() => <DxDashboard />);
		expect(screen.getByText("Within budget")).toBeInTheDocument();
	});
	it("shows pass badges for every empty category", () => {
		render(() => <DxDashboard />);
		let passBadges = screen.getAllByText("pass");
		expect(passBadges).toHaveLength(5);
	});
	it("refreshes the budget when the Refresh budget button is clicked", () => {
		render(() => <DxDashboard />);
		let button = screen.getByRole("button", {name: /refresh budget/i});
		fireEvent.click(button);
		expect(screen.getByText("Within budget")).toBeInTheDocument();
	});
});
