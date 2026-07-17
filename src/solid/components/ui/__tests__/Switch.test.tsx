import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Switch} from "../Switch";
describe("Switch", () => {
    it("renders a switch input with role", () => {
        render(() => <Switch checked={false} onCheckedChange={() => {}} label="Toggle" />);
        expect(screen.getByRole("switch")).toBeInTheDocument();
    });
    it("reflects checked state via aria-checked", () => {
        render(() => <Switch checked={true} onCheckedChange={() => {}} />);
        expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });
    it("calls onCheckedChange with next value when toggled", () => {
        let handler = vi.fn<(checked: boolean) => void>();
        render(() => <Switch checked={false} onCheckedChange={handler} />);
        let input = screen.getByRole("switch") as HTMLInputElement;
        fireEvent.click(input);
        expect(handler).toHaveBeenCalledWith(true);
    });
    it("supports uncontrolled defaultChecked", () => {
        render(() => <Switch defaultChecked={true} onCheckedChange={() => {}} />);
        expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });
    it("updates internal state in uncontrolled mode", () => {
        let handler = vi.fn<(checked: boolean) => void>();
        render(() => <Switch defaultChecked={false} onCheckedChange={handler} />);
        let input = screen.getByRole("switch") as HTMLInputElement;
        fireEvent.click(input);
        expect(handler).toHaveBeenCalledWith(true);
        expect(input).toHaveAttribute("aria-checked", "true");
    });
    it("renders label and hint", () => {
        render(() => <Switch checked={false} onCheckedChange={() => {}} label="Dark mode" hint="Saves battery" />);
        expect(screen.getByText("Dark mode")).toBeInTheDocument();
        expect(screen.getByText("Saves battery")).toBeInTheDocument();
    });
    it("disables the input when disabled prop is set", () => {
        render(() => <Switch checked={false} onCheckedChange={() => {}} disabled={true} />);
        expect(screen.getByRole("switch")).toBeDisabled();
    });
    it("does not fire onCheckedChange when disabled", () => {
        let handler = vi.fn<(checked: boolean) => void>();
        render(() => <Switch checked={false} onCheckedChange={handler} disabled={true} />);
        let input = screen.getByRole("switch") as HTMLInputElement;
        fireEvent.click(input);
        expect(handler).not.toHaveBeenCalled();
    });
});
