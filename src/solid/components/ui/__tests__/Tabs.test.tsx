import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Tabs} from "../Tabs";
import {TabsList} from "../Tabs";
import {TabsTrigger} from "../Tabs";
import {TabsContent} from "../Tabs";
describe("Tabs", () => {
	it("renders tablist and triggers", () => {
		render(() => (
			<Tabs defaultValue="a">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b">B</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Content A</TabsContent>
				<TabsContent value="b">Content B</TabsContent>
			</Tabs>
		));
		expect(screen.getByRole("tablist")).toBeInTheDocument();
		expect(screen.getAllByRole("tab")).toHaveLength(2);
	});
	it("shows the default active panel content", () => {
		render(() => (
			<Tabs defaultValue="a">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b">B</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Content A</TabsContent>
				<TabsContent value="b">Content B</TabsContent>
			</Tabs>
		));
		expect(screen.getByText("Content A")).toBeInTheDocument();
		expect(screen.queryByText("Content B")).not.toBeInTheDocument();
	});
	it("marks the active trigger with aria-selected", () => {
		render(() => (
			<Tabs defaultValue="a">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b">B</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Content A</TabsContent>
			</Tabs>
		));
		let tabs=screen.getAllByRole("tab");
		expect(tabs[0]).toHaveAttribute("aria-selected", "true");
		expect(tabs[1]).toHaveAttribute("aria-selected", "false");
	});
	it("switches panel on trigger click (uncontrolled)", () => {
		render(() => (
			<Tabs defaultValue="a">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b">B</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Content A</TabsContent>
				<TabsContent value="b">Content B</TabsContent>
			</Tabs>
		));
		fireEvent.click(screen.getByText("B"));
		expect(screen.getByText("Content B")).toBeInTheDocument();
		expect(screen.queryByText("Content A")).not.toBeInTheDocument();
	});
	it("calls onValueChange when active changes", () => {
		let handler=vi.fn();
		render(() => (
			<Tabs defaultValue="a" onValueChange={handler}>
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b">B</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Content A</TabsContent>
			</Tabs>
		));
		fireEvent.click(screen.getByText("B"));
		expect(handler).toHaveBeenCalledWith("b");
	});
	it("supports controlled value", () => {
		render(() => (
			<Tabs value="b">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
					<TabsTrigger value="b">B</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Content A</TabsContent>
				<TabsContent value="b">Content B</TabsContent>
			</Tabs>
		));
		expect(screen.getByText("Content B")).toBeInTheDocument();
	});
	it("links trigger and panel via aria-controls and aria-labelledby", () => {
		render(() => (
			<Tabs defaultValue="a">
				<TabsList>
					<TabsTrigger value="a">A</TabsTrigger>
				</TabsList>
				<TabsContent value="a">Content A</TabsContent>
			</Tabs>
		));
		let trigger=screen.getByRole("tab");
		let panel=screen.getByRole("tabpanel");
		expect(trigger).toHaveAttribute("aria-controls", panel.id);
		expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
	});
});
