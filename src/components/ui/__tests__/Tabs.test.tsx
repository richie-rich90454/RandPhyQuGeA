import {describe, it, expect, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {Tabs} from "../Tabs";
function getTriggers(): HTMLButtonElement[] {
	return screen.getAllByRole("tab");
}
function getPanels(): HTMLElement[] {
	return screen.getAllByRole("tabpanel", {hidden: true});
}
describe("Tabs", () => {
	it("renders tablist with accessible label", () => {
		render(
			<Tabs defaultValue="one" ariaLabel="Sample tabs">
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">Panel one</Tabs.Content>
				<Tabs.Content value="two">Panel two</Tabs.Content>
			</Tabs>,
		);
		const list=screen.getByRole("tablist");
		expect(list.getAttribute("aria-label")).toBe("Sample tabs");
	});
	it("only shows the default tab panel", () => {
		render(
			<Tabs defaultValue="one">
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">Panel one</Tabs.Content>
				<Tabs.Content value="two">Panel two</Tabs.Content>
			</Tabs>,
		);
		expect(screen.getByText("Panel one")).toBeDefined();
		expect(screen.queryByText("Panel two")).toBeNull();
	});
	it("uses roving tabIndex: only active tab is tabbable", () => {
		render(
			<Tabs defaultValue="one">
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">Panel one</Tabs.Content>
				<Tabs.Content value="two">Panel two</Tabs.Content>
			</Tabs>,
		);
		const triggers=getTriggers();
		expect(triggers[0]?.tabIndex).toBe(0);
		expect(triggers[1]?.tabIndex).toBe(-1);
	});
	it("switches panel when trigger is clicked", () => {
		render(
			<Tabs defaultValue="one">
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">Panel one</Tabs.Content>
				<Tabs.Content value="two">Panel two</Tabs.Content>
			</Tabs>,
		);
		fireEvent.click(getTriggers()[1]!);
		expect(screen.queryByText("Panel one")).toBeNull();
		expect(screen.getByText("Panel two")).toBeDefined();
	});
	it("calls onValueChange in controlled mode", () => {
		const handleChange=vi.fn<(value: string) => void>();
		render(
			<Tabs value="one" onValueChange={handleChange}>
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">Panel one</Tabs.Content>
				<Tabs.Content value="two">Panel two</Tabs.Content>
			</Tabs>,
		);
		fireEvent.click(getTriggers()[1]!);
		expect(handleChange).toHaveBeenCalledWith("two");
	});
	it("arrow right moves focus and selection to next tab", () => {
		render(
			<Tabs defaultValue="one">
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
					<Tabs.Trigger value="three">Three</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">Panel one</Tabs.Content>
				<Tabs.Content value="two">Panel two</Tabs.Content>
				<Tabs.Content value="three">Panel three</Tabs.Content>
			</Tabs>,
		);
		getTriggers()[0]!.focus();
		fireEvent.keyDown(getTriggers()[0]!, {key: "ArrowRight"});
		expect(document.activeElement).toBe(getTriggers()[1]);
		expect(getTriggers()[0]?.tabIndex).toBe(-1);
		expect(getTriggers()[1]?.tabIndex).toBe(0);
		expect(screen.getByText("Panel two")).toBeDefined();
	});
	it("arrow left wraps focus to last tab", () => {
		render(
			<Tabs defaultValue="one">
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
					<Tabs.Trigger value="three">Three</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">Panel one</Tabs.Content>
				<Tabs.Content value="two">Panel two</Tabs.Content>
				<Tabs.Content value="three">Panel three</Tabs.Content>
			</Tabs>,
		);
		getTriggers()[0]!.focus();
		fireEvent.keyDown(getTriggers()[0]!, {key: "ArrowLeft"});
		expect(document.activeElement).toBe(getTriggers()[2]);
		expect(screen.getByText("Panel three")).toBeDefined();
	});
	it("Home focuses first tab and End focuses last tab", () => {
		render(
			<Tabs defaultValue="two">
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
					<Tabs.Trigger value="three">Three</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">Panel one</Tabs.Content>
				<Tabs.Content value="two">Panel two</Tabs.Content>
				<Tabs.Content value="three">Panel three</Tabs.Content>
			</Tabs>,
		);
		getTriggers()[1]!.focus();
		fireEvent.keyDown(getTriggers()[1]!, {key: "Home"});
		expect(document.activeElement).toBe(getTriggers()[0]);
		fireEvent.keyDown(getTriggers()[0]!, {key: "End"});
		expect(document.activeElement).toBe(getTriggers()[2]);
	});
	it("links triggers and panels via aria attributes", () => {
		render(
			<Tabs defaultValue="one">
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">Panel one</Tabs.Content>
			</Tabs>,
		);
		const trigger=getTriggers()[0]!;
		const panel=getPanels()[0]!;
		expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
		expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
	});
});
