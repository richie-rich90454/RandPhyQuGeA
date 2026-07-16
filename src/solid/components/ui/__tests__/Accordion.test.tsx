import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Accordion} from "../Accordion";
import {AccordionItem} from "../Accordion";
import {AccordionTrigger} from "../Accordion";
import {AccordionContent} from "../Accordion";
describe("Accordion", () => {
	it("renders accordion items", () => {
		render(() => (
			<Accordion defaultValue="a">
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		expect(screen.getByText("Section A")).toBeInTheDocument();
	});
	it("shows content when item is open by default", () => {
		render(() => (
			<Accordion defaultValue="a">
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		expect(screen.getByText("Content A")).toBeInTheDocument();
	});
	it("hides content when item is closed", () => {
		render(() => (
			<Accordion defaultValue="b">
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		expect(screen.queryByText("Content A")).not.toBeInTheDocument();
	});
	it("toggles open state on trigger click (uncontrolled)", () => {
		render(() => (
			<Accordion defaultValue="a">
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		expect(screen.getByText("Content A")).toBeInTheDocument();
		fireEvent.click(screen.getByText("Section A"));
		expect(screen.queryByText("Content A")).not.toBeInTheDocument();
	});
	it("calls onValueChange when toggled", () => {
		let handler = vi.fn<(value: string) => void>();
		render(() => (
			<Accordion defaultValue="a" onValueChange={handler}>
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
				<AccordionItem value="b">
					<AccordionTrigger>Section B</AccordionTrigger>
					<AccordionContent>Content B</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		fireEvent.click(screen.getByText("Section B"));
		expect(handler).toHaveBeenCalledWith("b");
	});
	it("only one item open at a time", () => {
		render(() => (
			<Accordion defaultValue="a">
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
				<AccordionItem value="b">
					<AccordionTrigger>Section B</AccordionTrigger>
					<AccordionContent>Content B</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		expect(screen.getByText("Content A")).toBeInTheDocument();
		fireEvent.click(screen.getByText("Section B"));
		expect(screen.queryByText("Content A")).not.toBeInTheDocument();
		expect(screen.getByText("Content B")).toBeInTheDocument();
	});
	it("sets aria-expanded on trigger", () => {
		render(() => (
			<Accordion defaultValue="a">
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		expect(screen.getByText("Section A")).toHaveAttribute("aria-expanded", "true");
		fireEvent.click(screen.getByText("Section A"));
		expect(screen.getByText("Section A")).toHaveAttribute("aria-expanded", "false");
	});
	it("links trigger and content via aria-controls and aria-labelledby", () => {
		render(() => (
			<Accordion defaultValue="a">
				<AccordionItem value="a">
					<AccordionTrigger>Section A</AccordionTrigger>
					<AccordionContent>Content A</AccordionContent>
				</AccordionItem>
			</Accordion>
		));
		let trigger = screen.getByText("Section A");
		let content = screen.getByRole("region");
		expect(trigger).toHaveAttribute("aria-controls", content.id);
		expect(content).toHaveAttribute("aria-labelledby", trigger.id);
	});
});
