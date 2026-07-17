import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Pill} from "../Pill";
describe("Pill", () => {
    it("renders the name text", () => {
        render(() => <Pill name="Physics" />);
        expect(screen.getByText("Physics")).toBeInTheDocument();
    });
    it("renders as a button element", () => {
        render(() => <Pill name="Physics" />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });
    it("applies default variant when not active", () => {
        render(() => <Pill name="Physics" />);
        expect(screen.getByRole("button")).toHaveClass(/default/);
    });
    it("applies active variant when active prop is true", () => {
        render(() => <Pill name="Physics" active={true} />);
        expect(screen.getByRole("button")).toHaveClass(/active/);
    });
    it("applies active variant when variant is active", () => {
        render(() => <Pill name="Physics" variant="active" />);
        expect(screen.getByRole("button")).toHaveClass(/active/);
    });
    it("applies outline variant", () => {
        render(() => <Pill name="Physics" variant="outline" />);
        expect(screen.getByRole("button")).toHaveClass(/outline/);
    });
    it("sets aria-pressed to true when active", () => {
        render(() => <Pill name="Physics" active={true} />);
        expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });
    it("sets aria-pressed to false when not active", () => {
        render(() => <Pill name="Physics" />);
        expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    });
    it("calls onClick when clicked", () => {
        let handler = vi.fn<() => void>();
        render(() => <Pill name="Physics" onClick={handler} />);
        fireEvent.click(screen.getByRole("button"));
        expect(handler).toHaveBeenCalledOnce();
    });
    it("renders the icon when provided", () => {
        render(() => <Pill name="Physics" icon={<span data-testid="icon">I</span>} />);
        expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
    it("is disabled when disabled prop is true", () => {
        render(() => <Pill name="Physics" disabled={true} />);
        expect(screen.getByRole("button")).toBeDisabled();
    });
});
