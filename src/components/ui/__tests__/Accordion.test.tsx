import {describe, it, expect, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {Accordion} from "../Accordion";
function getTriggers(): HTMLButtonElement[] {
	return screen.getAllByRole("button");
}
describe("Accordion", () => {
	it("renders accordion with items", () => {
		render(
			<Accordion>
				<Accordion.Item value="one">
					<Accordion.Trigger>One</Accordion.Trigger>
					<Accordion.Content>Content one</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="two">
					<Accordion.Trigger>Two</Accordion.Trigger>
					<Accordion.Content>Content two</Accordion.Content>
				</Accordion.Item>
			</Accordion>,
		);
		expect(getTriggers().length).toBe(2);
		expect(screen.getByText("One")).toBeDefined();
		expect(screen.getByText("Two")).toBeDefined();
	});
	it("opens default item and keeps others closed", () => {
		render(
			<Accordion defaultValue="one">
				<Accordion.Item value="one">
					<Accordion.Trigger>One</Accordion.Trigger>
					<Accordion.Content>Content one</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="two">
					<Accordion.Trigger>Two</Accordion.Trigger>
					<Accordion.Content>Content two</Accordion.Content>
				</Accordion.Item>
			</Accordion>,
		);
		const triggers=getTriggers();
		expect(triggers[0]?.getAttribute("aria-expanded")).toBe("true");
		expect(triggers[1]?.getAttribute("aria-expanded")).toBe("false");
		const regions=screen.getAllByRole("region", {hidden: true});
		expect(regions[0]?.getAttribute("data-state")).toBe("open");
		expect(regions[1]?.getAttribute("data-state")).toBe("closed");
	});
	it("toggles item on trigger click", () => {
		render(
			<Accordion defaultValue="one">
				<Accordion.Item value="one">
					<Accordion.Trigger>One</Accordion.Trigger>
					<Accordion.Content>Content one</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="two">
					<Accordion.Trigger>Two</Accordion.Trigger>
					<Accordion.Content>Content two</Accordion.Content>
				</Accordion.Item>
			</Accordion>,
		);
		const triggers=getTriggers();
		fireEvent.click(triggers[1]!);
		expect(triggers[1]?.getAttribute("aria-expanded")).toBe("true");
		expect(triggers[0]?.getAttribute("aria-expanded")).toBe("false");
		fireEvent.click(triggers[1]!);
		expect(triggers[1]?.getAttribute("aria-expanded")).toBe("false");
	});
	it("only allows one item open at a time", () => {
		render(
			<Accordion defaultValue="one">
				<Accordion.Item value="one">
					<Accordion.Trigger>One</Accordion.Trigger>
					<Accordion.Content>Content one</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="two">
					<Accordion.Trigger>Two</Accordion.Trigger>
					<Accordion.Content>Content two</Accordion.Content>
				</Accordion.Item>
			</Accordion>,
		);
		const triggers=getTriggers();
		fireEvent.click(triggers[1]!);
		expect(triggers[0]?.getAttribute("aria-expanded")).toBe("false");
		expect(triggers[1]?.getAttribute("aria-expanded")).toBe("true");
	});
	it("calls onValueChange in controlled mode", () => {
		const handleChange=vi.fn<(value: string) => void>();
		render(
			<Accordion value="one" onValueChange={handleChange}>
				<Accordion.Item value="one">
					<Accordion.Trigger>One</Accordion.Trigger>
					<Accordion.Content>Content one</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="two">
					<Accordion.Trigger>Two</Accordion.Trigger>
					<Accordion.Content>Content two</Accordion.Content>
				</Accordion.Item>
			</Accordion>,
		);
		fireEvent.click(getTriggers()[1]!);
		expect(handleChange).toHaveBeenCalledWith("two");
	});
	it("links triggers and regions via aria attributes", () => {
		render(
			<Accordion defaultValue="one">
				<Accordion.Item value="one">
					<Accordion.Trigger>One</Accordion.Trigger>
					<Accordion.Content>Content one</Accordion.Content>
				</Accordion.Item>
			</Accordion>,
		);
		const trigger=getTriggers()[0]!;
		const region=screen.getByRole("region");
		expect(trigger.getAttribute("aria-controls")).toBe(region.id);
		expect(region.getAttribute("aria-labelledby")).toBe(trigger.id);
	});
	it("applies grid-row transition classes for smooth height", () => {
		render(
			<Accordion defaultValue="one">
				<Accordion.Item value="one">
					<Accordion.Trigger>One</Accordion.Trigger>
					<Accordion.Content>Content one</Accordion.Content>
				</Accordion.Item>
			</Accordion>,
		);
		const region=screen.getByRole("region");
		expect(region.classList.contains("grid-rows-[1fr]")).toBe(true);
		expect(region.classList.contains("transition-[grid-template-rows]")).toBe(true);
	});
});
