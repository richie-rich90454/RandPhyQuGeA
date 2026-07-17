import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Input} from "../Input";
describe("Input", () => {
    it("renders an input with placeholder", () => {
        render(() => <Input placeholder="Type here" />);
        expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
    });
    it("renders a label associated with the input", () => {
        render(() => <Input label="Username" />);
        expect(screen.getByLabelText("Username")).toBeInTheDocument();
    });
    it("renders error message and marks invalid", () => {
        render(() => <Input label="Email" error="Invalid email" />);
        expect(screen.getByLabelText("Email")).toBeInvalid();
        expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });
    it("renders hint text", () => {
        render(() => <Input label="Age" hint="Must be a number" />);
        expect(screen.getByText("Must be a number")).toBeInTheDocument();
    });
    it("calls onInput handler", () => {
        let handler = vi.fn<() => void>();
        render(() => <Input onInput={handler} />);
        fireEvent.input(screen.getByRole("textbox"), {target: {value: "hello"}});
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it("uses provided id", () => {
        render(() => <Input id="custom-id" label="Name" />);
        expect(screen.getByLabelText("Name")).toHaveAttribute("id", "custom-id");
    });
});
