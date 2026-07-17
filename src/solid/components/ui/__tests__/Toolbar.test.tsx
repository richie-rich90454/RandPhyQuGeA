import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Toolbar} from "../Toolbar";
import {ToolbarItem} from "../Toolbar";
import {ToolbarGroup} from "../Toolbar";
import {ToolbarSeparator} from "../Toolbar";
import {ToolbarTitle} from "../Toolbar";
describe("Toolbar", () => {
    it("renders a toolbar with role", () => {
        render(() => (
            <Toolbar label="Format">
                <ToolbarItem>Bold</ToolbarItem>
            </Toolbar>
        ));
        expect(screen.getByRole("toolbar")).toBeInTheDocument();
        expect(screen.getByRole("toolbar")).toHaveAttribute("aria-label", "Format");
    });
    it("renders toolbar items as buttons", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem>Bold</ToolbarItem>
                <ToolbarItem>Italic</ToolbarItem>
            </Toolbar>
        ));
        expect(screen.getAllByRole("button")).toHaveLength(2);
    });
    it("applies aria-pressed when active", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem active={true}>Bold</ToolbarItem>
            </Toolbar>
        ));
        expect(screen.getByText("Bold")).toHaveAttribute("aria-pressed", "true");
    });
    it("first item has tabindex 0 (roving tabindex)", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem>Bold</ToolbarItem>
                <ToolbarItem>Italic</ToolbarItem>
            </Toolbar>
        ));
        let buttons = screen.getAllByRole("button");
        expect(buttons[0]).toHaveAttribute("tabindex", "0");
        expect(buttons[1]).toHaveAttribute("tabindex", "-1");
    });
    it("moves focus on ArrowRight", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem>Bold</ToolbarItem>
                <ToolbarItem>Italic</ToolbarItem>
            </Toolbar>
        ));
        let buttons = screen.getAllByRole("button");
        buttons[0]!.focus();
        expect(buttons[0]).toHaveFocus();
        fireEvent.keyDown(screen.getByRole("toolbar"), {key: "ArrowRight"});
        expect(buttons[1]).toHaveFocus();
    });
    it("wraps focus on ArrowRight from last to first", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem>Bold</ToolbarItem>
                <ToolbarItem>Italic</ToolbarItem>
            </Toolbar>
        ));
        let buttons = screen.getAllByRole("button");
        buttons[1]!.focus();
        fireEvent.keyDown(screen.getByRole("toolbar"), {key: "ArrowRight"});
        expect(buttons[0]).toHaveFocus();
    });
    it("moves focus on ArrowLeft", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem>Bold</ToolbarItem>
                <ToolbarItem>Italic</ToolbarItem>
            </Toolbar>
        ));
        let buttons = screen.getAllByRole("button");
        buttons[1]!.focus();
        fireEvent.keyDown(screen.getByRole("toolbar"), {key: "ArrowLeft"});
        expect(buttons[0]).toHaveFocus();
    });
    it("moves focus to first on Home", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem>Bold</ToolbarItem>
                <ToolbarItem>Italic</ToolbarItem>
                <ToolbarItem>Underline</ToolbarItem>
            </Toolbar>
        ));
        let buttons = screen.getAllByRole("button");
        buttons[2]!.focus();
        fireEvent.keyDown(screen.getByRole("toolbar"), {key: "Home"});
        expect(buttons[0]).toHaveFocus();
    });
    it("moves focus to last on End", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem>Bold</ToolbarItem>
                <ToolbarItem>Italic</ToolbarItem>
                <ToolbarItem>Underline</ToolbarItem>
            </Toolbar>
        ));
        let buttons = screen.getAllByRole("button");
        buttons[0]!.focus();
        fireEvent.keyDown(screen.getByRole("toolbar"), {key: "End"});
        expect(buttons[2]).toHaveFocus();
    });
    it("calls onClick when item is clicked", () => {
        let handler = vi.fn<() => void>();
        render(() => (
            <Toolbar>
                <ToolbarItem onClick={handler}>Bold</ToolbarItem>
            </Toolbar>
        ));
        fireEvent.click(screen.getByText("Bold"));
        expect(handler).toHaveBeenCalledOnce();
    });
    it("renders ToolbarGroup with role group", () => {
        render(() => (
            <Toolbar>
                <ToolbarGroup label="Text">
                    <ToolbarItem>Bold</ToolbarItem>
                </ToolbarGroup>
            </Toolbar>
        ));
        expect(screen.getByRole("group")).toBeInTheDocument();
        expect(screen.getByRole("group")).toHaveAttribute("aria-label", "Text");
    });
    it("renders ToolbarSeparator with role separator", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem>Bold</ToolbarItem>
                <ToolbarSeparator />
                <ToolbarItem>Italic</ToolbarItem>
            </Toolbar>
        ));
        expect(screen.getByRole("separator")).toBeInTheDocument();
    });
    it("renders ToolbarTitle as h2", () => {
        render(() => (
            <Toolbar>
                <ToolbarTitle>Formatting</ToolbarTitle>
                <ToolbarItem>Bold</ToolbarItem>
            </Toolbar>
        ));
        expect(screen.getByText("Formatting").tagName).toBe("H2");
    });
    it("disables item when disabled prop is set", () => {
        render(() => (
            <Toolbar>
                <ToolbarItem disabled={true}>Bold</ToolbarItem>
            </Toolbar>
        ));
        expect(screen.getByText("Bold")).toBeDisabled();
    });
});
