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
        let tabs = screen.getAllByRole("tab");
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
        let handler = vi.fn<(value: string) => void>();
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
        let trigger = screen.getByRole("tab");
        let panel = screen.getByRole("tabpanel");
        expect(trigger).toHaveAttribute("aria-controls", panel.id);
        expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
    });
    it("has role=tablist on the container (task 5.13 bug 1)", () => {
        render(() => (
            <Tabs defaultValue="a">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b">B</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
            </Tabs>
        ));
        expect(screen.getByRole("tablist")).toBeInTheDocument();
    });
    it("has role=tab on each trigger (task 5.13 bug 1)", () => {
        render(() => (
            <Tabs defaultValue="a">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b">B</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
            </Tabs>
        ));
        expect(screen.getAllByRole("tab")).toHaveLength(2);
    });
    it("sets aria-selected=true on the active tab and false on others (task 5.13 bug 1)", () => {
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
        let tabs = screen.getAllByRole("tab");
        expect(tabs[0]).toHaveAttribute("aria-selected", "true");
        expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });
    it("sets aria-controls on each trigger pointing to its panel (task 5.13 bug 1)", () => {
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
        let tabs = screen.getAllByRole("tab");
        expect(tabs[0]).toHaveAttribute("aria-controls");
        expect(tabs[1]).toHaveAttribute("aria-controls");
        expect(tabs[0]!.getAttribute("aria-controls")).not.toBe(tabs[1]!.getAttribute("aria-controls"));
    });
    it("ArrowRight moves focus and activation to the next tab (task 5.13 bug 2)", async () => {
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
        let tabs = screen.getAllByRole("tab");
        tabs[0]!.focus();
        expect(document.activeElement).toBe(tabs[0]);
        fireEvent.keyDown(screen.getByRole("tablist"), {key: "ArrowRight"});
        expect(document.activeElement).toBe(tabs[1]);
        expect(tabs[1]).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("Content B")).toBeInTheDocument();
    });
    it("ArrowLeft moves focus and activation to the previous tab (task 5.13 bug 2)", async () => {
        render(() => (
            <Tabs defaultValue="b">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b">B</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
                <TabsContent value="b">Content B</TabsContent>
            </Tabs>
        ));
        let tabs = screen.getAllByRole("tab");
        tabs[1]!.focus();
        expect(document.activeElement).toBe(tabs[1]);
        fireEvent.keyDown(screen.getByRole("tablist"), {key: "ArrowLeft"});
        expect(document.activeElement).toBe(tabs[0]);
        expect(tabs[0]).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("Content A")).toBeInTheDocument();
    });
    it("ArrowRight wraps from last to first (task 5.13 bug 2)", async () => {
        render(() => (
            <Tabs defaultValue="b">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b">B</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
                <TabsContent value="b">Content B</TabsContent>
            </Tabs>
        ));
        let tabs = screen.getAllByRole("tab");
        tabs[1]!.focus();
        fireEvent.keyDown(screen.getByRole("tablist"), {key: "ArrowRight"});
        expect(document.activeElement).toBe(tabs[0]);
        expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });
    it("ArrowLeft wraps from first to last (task 5.13 bug 2)", async () => {
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
        let tabs = screen.getAllByRole("tab");
        tabs[0]!.focus();
        fireEvent.keyDown(screen.getByRole("tablist"), {key: "ArrowLeft"});
        expect(document.activeElement).toBe(tabs[1]);
        expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });
    it("ArrowDown works like ArrowRight (task 5.13 bug 2)", async () => {
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
        let tabs = screen.getAllByRole("tab");
        tabs[0]!.focus();
        fireEvent.keyDown(screen.getByRole("tablist"), {key: "ArrowDown"});
        expect(document.activeElement).toBe(tabs[1]);
    });
    it("ArrowUp works like ArrowLeft (task 5.13 bug 2)", async () => {
        render(() => (
            <Tabs defaultValue="b">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b">B</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
                <TabsContent value="b">Content B</TabsContent>
            </Tabs>
        ));
        let tabs = screen.getAllByRole("tab");
        tabs[1]!.focus();
        fireEvent.keyDown(screen.getByRole("tablist"), {key: "ArrowUp"});
        expect(document.activeElement).toBe(tabs[0]);
    });
    it("Home moves to the first tab (task 5.13 bug 2)", async () => {
        render(() => (
            <Tabs defaultValue="b">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b">B</TabsTrigger>
                    <TabsTrigger value="c">C</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
                <TabsContent value="b">Content B</TabsContent>
                <TabsContent value="c">Content C</TabsContent>
            </Tabs>
        ));
        let tabs = screen.getAllByRole("tab");
        tabs[1]!.focus();
        fireEvent.keyDown(screen.getByRole("tablist"), {key: "Home"});
        expect(document.activeElement).toBe(tabs[0]);
        expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });
    it("End moves to the last tab (task 5.13 bug 2)", async () => {
        render(() => (
            <Tabs defaultValue="a">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b">B</TabsTrigger>
                    <TabsTrigger value="c">C</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
                <TabsContent value="b">Content B</TabsContent>
                <TabsContent value="c">Content C</TabsContent>
            </Tabs>
        ));
        let tabs = screen.getAllByRole("tab");
        tabs[0]!.focus();
        fireEvent.keyDown(screen.getByRole("tablist"), {key: "End"});
        expect(document.activeElement).toBe(tabs[2]);
        expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    });
    it("active tab has tabIndex=0 and inactive tabs have tabIndex=-1 (task 5.13 bug 1)", () => {
        render(() => (
            <Tabs defaultValue="a">
                <TabsList>
                    <TabsTrigger value="a">A</TabsTrigger>
                    <TabsTrigger value="b">B</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
            </Tabs>
        ));
        let tabs = screen.getAllByRole("tab");
        expect(tabs[0]).toHaveAttribute("tabindex", "0");
        expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    });
});
