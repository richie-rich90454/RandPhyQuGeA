import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Slider} from "../Slider";
describe("Slider", () => {
    it("renders two range inputs with given value", () => {
        render(() => <Slider min={0} max={100} value={[20, 80]} onChange={() => {}} label="Range" />);
        let inputs = screen.getAllByRole("slider");
        expect(inputs).toHaveLength(2);
        expect(inputs[0]).toHaveAttribute("aria-valuenow", "20");
        expect(inputs[1]).toHaveAttribute("aria-valuenow", "80");
    });
    it("renders the filled track", () => {
        render(() => <Slider min={0} max={100} value={[20, 80]} onChange={() => {}} />);
        expect(screen.getByTestId("slider-filled-track")).toBeInTheDocument();
    });
    it("calls onChange when min thumb changes", () => {
        let handler = vi.fn<(value: [number, number]) => void>();
        render(() => <Slider min={0} max={100} value={[20, 80]} onChange={handler} />);
        let inputs = screen.getAllByRole("slider");
        let input = inputs[0];
        if (!input) throw new Error("min input not found");
        fireEvent.input(input, {target: {value: "30"}});
        expect(handler).toHaveBeenCalledWith([30, 80]);
    });
    it("calls onChange when max thumb changes", () => {
        let handler = vi.fn<(value: [number, number]) => void>();
        render(() => <Slider min={0} max={100} value={[20, 80]} onChange={handler} />);
        let inputs = screen.getAllByRole("slider");
        let input = inputs[1];
        if (!input) throw new Error("max input not found");
        fireEvent.input(input, {target: {value: "70"}});
        expect(handler).toHaveBeenCalledWith([20, 70]);
    });
    it("clamps min so it stays below max", () => {
        let handler = vi.fn<(value: [number, number]) => void>();
        render(() => <Slider min={0} max={100} value={[20, 80]} onChange={handler} />);
        let inputs = screen.getAllByRole("slider");
        let input = inputs[0];
        if (!input) throw new Error("min input not found");
        fireEvent.input(input, {target: {value: "90"}});
        expect(handler).toHaveBeenCalledWith([79, 80]);
    });
    it("clamps max so it stays above min", () => {
        let handler = vi.fn<(value: [number, number]) => void>();
        render(() => <Slider min={0} max={100} value={[20, 80]} onChange={handler} />);
        let inputs = screen.getAllByRole("slider");
        let input = inputs[1];
        if (!input) throw new Error("max input not found");
        fireEvent.input(input, {target: {value: "10"}});
        expect(handler).toHaveBeenCalledWith([20, 21]);
    });
    it("renders error and hint", () => {
        render(() => <Slider min={0} max={100} value={[20, 80]} onChange={() => {}} error="Bad" hint="Hint" />);
        expect(screen.getByText("Bad")).toBeInTheDocument();
        expect(screen.getByText("Hint")).toBeInTheDocument();
    });
    it("is collapsed when min equals max", () => {
        render(() => <Slider min={50} max={50} value={[50, 50]} onChange={() => {}} />);
        let inputs = screen.getAllByRole("slider");
        expect(inputs[0]).toHaveAttribute("aria-valuenow", "50");
    });
});
