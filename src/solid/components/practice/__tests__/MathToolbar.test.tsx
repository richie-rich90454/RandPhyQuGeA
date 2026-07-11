import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {MathToolbar} from "../MathToolbar";
describe("MathToolbar", () => {
	it("renders a button for each primary symbol", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		expect(screen.getByText("\u2212")).toBeInTheDocument();
		expect(screen.getAllByText("\u00d7")).toHaveLength(2);
		expect(screen.getByText("\u222b")).toBeInTheDocument();
		expect(screen.getByText("\u03b1")).toBeInTheDocument();
	});
	it("renders the dropdown trigger button", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		expect(screen.getByRole("button", {name: "More symbols"})).toBeInTheDocument();
	});
	it("calls onInsert with the LaTeX when a primary symbol is clicked", () => {
		let handler=vi.fn();
		render(() => <MathToolbar onInsert={handler} />);
		fireEvent.click(screen.getByText("\u221a"));
		expect(handler).toHaveBeenCalledWith("\\sqrt{}");
	});
	it("does not call onInsert when disabled", () => {
		let handler=vi.fn();
		render(() => <MathToolbar onInsert={handler} disabled={true} />);
		fireEvent.click(screen.getByText("\u221a"));
		expect(handler).not.toHaveBeenCalled();
	});
	it("disables all symbol buttons when disabled prop is set", () => {
		render(() => <MathToolbar onInsert={() => {}} disabled={true} />);
		expect(screen.getByText("\u2212")).toBeDisabled();
	});
	it("opens the dropdown when the trigger is clicked", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		let trigger=screen.getByRole("button", {name: "More symbols"});
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(trigger);
		expect(trigger).toHaveAttribute("aria-expanded", "true");
	});
	it("renders dropdown symbols when opened", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		fireEvent.click(screen.getByRole("button", {name: "More symbols"}));
		expect(screen.getByText("\u2200")).toBeInTheDocument();
		expect(screen.getByText("\u2220")).toBeInTheDocument();
	});
	it("calls onInsert and closes the dropdown when a dropdown symbol is clicked", () => {
		let handler=vi.fn();
		render(() => <MathToolbar onInsert={handler} />);
		let trigger=screen.getByRole("button", {name: "More symbols"});
		fireEvent.click(trigger);
		fireEvent.click(screen.getByText("\u2200"));
		expect(handler).toHaveBeenCalledWith("\\forall");
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});
	it("closes the dropdown on outside click", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		let trigger=screen.getByRole("button", {name: "More symbols"});
		fireEvent.click(trigger);
		expect(trigger).toHaveAttribute("aria-expanded", "true");
		fireEvent.mouseDown(document.body);
		expect(trigger).toHaveAttribute("aria-expanded", "false");
	});
	it("renders collapsible section headers for each primary group", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		expect(screen.getByRole("button", {name: "Basic"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Exponents & Roots"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Calculus"})).toBeInTheDocument();
	});
	it("collapses a section when its header is clicked", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		let header=screen.getByRole("button", {name: "Basic"});
		expect(header).toHaveAttribute("aria-expanded", "true");
		fireEvent.click(header);
		expect(header).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByText("\u2212")).not.toBeInTheDocument();
	});
	it("renders the new basic symbols", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		expect(screen.getByText("\u221e")).toBeInTheDocument();
	});
	it("renders the x squared and d/dx symbols", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		expect(screen.getByText("x\u00b2")).toBeInTheDocument();
		expect(screen.getByText("d/dx")).toBeInTheDocument();
	});
	it("renders the enhanced Greek symbols", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		expect(screen.getByText("\u03c6")).toBeInTheDocument();
		expect(screen.getByText("\u03a8")).toBeInTheDocument();
		expect(screen.getByText("\u03a9")).toBeInTheDocument();
		expect(screen.getAllByText("\u0394")).toHaveLength(2);
	});
	it("renders the enhanced trig and log symbols", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		expect(screen.getByText("sec")).toBeInTheDocument();
		expect(screen.getByText("csc")).toBeInTheDocument();
		expect(screen.getByText("cot")).toBeInTheDocument();
		expect(screen.getByText("arcsin")).toBeInTheDocument();
		expect(screen.getByText("arccos")).toBeInTheDocument();
		expect(screen.getByText("arctan")).toBeInTheDocument();
	});
	it("renders the enhanced vector symbols", () => {
		render(() => <MathToolbar onInsert={() => {}} />);
		expect(screen.getByText("\u2016\u2016")).toBeInTheDocument();
		expect(screen.getAllByText("\u2207")).toHaveLength(2);
	});
});
