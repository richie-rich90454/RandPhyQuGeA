import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import {Playground} from "../Playground";
function resetClipboard() {
	let writeText=vi.fn(() => Promise.resolve());
	Object.defineProperty(navigator, "clipboard", {
		value: {writeText},
		writable: true,
		configurable: true,
	});
}
beforeEach(() => {
	resetClipboard();
	window.location.hash="";
});
describe("Playground page", () => {
	it("renders the page heading and subtitle", () => {
		render(() => <Playground />);
		expect(screen.getByText("Component Playground")).toBeInTheDocument();
		expect(screen.getByText(/Live showcase of every UI primitive/)).toBeInTheDocument();
	});
	it("renders the back-to-app link", () => {
		render(() => <Playground />);
		expect(screen.getByRole("button", {name: /back to app/i})).toBeInTheDocument();
	});
	it("renders all section titles", () => {
		render(() => <Playground />);
		expect(screen.getByText("Button — Live Editor")).toBeInTheDocument();
		expect(screen.getByText("Button — Variants")).toBeInTheDocument();
		expect(screen.getByText("Button — Sizes")).toBeInTheDocument();
		expect(screen.getByText("Button — Loading")).toBeInTheDocument();
		expect(screen.getByText("Card")).toBeInTheDocument();
		expect(screen.getByText("Badge")).toBeInTheDocument();
		expect(screen.getByText("Pill")).toBeInTheDocument();
		expect(screen.getByText("ProgressBar")).toBeInTheDocument();
		expect(screen.getByText("Spinner")).toBeInTheDocument();
		expect(screen.getByText("Switch")).toBeInTheDocument();
		expect(screen.getByText("Slider")).toBeInTheDocument();
		expect(screen.getByText("Input")).toBeInTheDocument();
		expect(screen.getByText("Select")).toBeInTheDocument();
		expect(screen.getByText("EmptyState")).toBeInTheDocument();
		expect(screen.getByText("Tabs")).toBeInTheDocument();
		expect(screen.getByText("Accordion")).toBeInTheDocument();
	});
	it("renders Button variant samples", () => {
		render(() => <Playground />);
		expect(screen.getByRole("button", {name: "Primary"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Secondary"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Ghost"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "Danger"})).toBeInTheDocument();
	});
	it("renders Button size samples", () => {
		render(() => <Playground />);
		expect(screen.getByRole("button", {name: "XS"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "SM"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "MD"})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: "LG"})).toBeInTheDocument();
	});
	it("renders the live button preview", () => {
		render(() => <Playground />);
		expect(screen.getByRole("button", {name: "Live Button"})).toBeInTheDocument();
	});
	it("renders Badge variants", () => {
		render(() => <Playground />);
		expect(screen.getAllByText("default").length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText("success")).toBeInTheDocument();
		expect(screen.getByText("warning")).toBeInTheDocument();
		expect(screen.getByText("error")).toBeInTheDocument();
		expect(screen.getByText("info")).toBeInTheDocument();
	});
	it("renders the EmptyState action button", () => {
		render(() => <Playground />);
		expect(screen.getByRole("button", {name: "Generate"})).toBeInTheDocument();
	});
	it("renders the Tabs component with triggers", () => {
		render(() => <Playground />);
		expect(screen.getByRole("tab", {name: "Overview"})).toBeInTheDocument();
		expect(screen.getByRole("tab", {name: "Details"})).toBeInTheDocument();
		expect(screen.getByRole("tab", {name: "Stats"})).toBeInTheDocument();
	});
	it("renders the Accordion triggers", () => {
		render(() => <Playground />);
		expect(screen.getByRole("button", {name: /What is RandPhyQuGeA/})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: /Which framework/})).toBeInTheDocument();
		expect(screen.getByRole("button", {name: /How to extend/})).toBeInTheDocument();
	});
	it("renders code snippets in pre blocks", () => {
		let {container}=render(() => <Playground />);
		let pres=container.querySelectorAll("pre");
		expect(pres.length).toBeGreaterThan(0);
		expect(pres[0]!.textContent).toContain("Button");
	});
	it("renders copy-code buttons for each section", () => {
		render(() => <Playground />);
		let copyButtons=screen.getAllByRole("button", {name: /copy code for/i});
		expect(copyButtons.length).toBeGreaterThanOrEqual(14);
	});
	it("copies code to clipboard when the copy button is clicked", () => {
		render(() => <Playground />);
		let copyButtons=screen.getAllByRole("button", {name: /copy code for/i});
		let firstCopyButton=copyButtons[0];
		if (!firstCopyButton) throw new Error("Copy button not found");
		fireEvent.click(firstCopyButton);
		expect(navigator.clipboard.writeText).toHaveBeenCalled();
	});
	it("updates the live button variant when the select changes", () => {
		render(() => <Playground />);
		let selects=screen.getAllByRole("combobox");
		let variantSelect=selects[0];
		if (!variantSelect) throw new Error("Variant select not found");
		fireEvent.change(variantSelect, {target: {value: "danger"}});
		let liveButton=screen.getByRole("button", {name: "Live Button"});
		expect(liveButton.className).toContain("danger");
	});
	it("updates the live button size when the select changes", () => {
		render(() => <Playground />);
		let selects=screen.getAllByRole("combobox");
		let sizeSelect=selects[1];
		if (!sizeSelect) throw new Error("Size select not found");
		fireEvent.change(sizeSelect, {target: {value: "lg"}});
		let liveButton=screen.getByRole("button", {name: "Live Button"});
		expect(liveButton.className).toContain("lg");
	});
	it("toggles the live button loading state when the checkbox changes", () => {
		render(() => <Playground />);
		let checkbox=screen.getByRole("checkbox");
		fireEvent.click(checkbox);
		let liveButton=screen.getByRole("button", {name: "Live Button"});
		expect(liveButton.hasAttribute("disabled")).toBe(true);
	});
	it("clears the hash when the back link is clicked", () => {
		window.location.hash="/playground";
		render(() => <Playground />);
		let backLink=screen.getByRole("button", {name: /back to app/i});
		fireEvent.click(backLink);
		expect(window.location.hash).toBe("");
	});
});
