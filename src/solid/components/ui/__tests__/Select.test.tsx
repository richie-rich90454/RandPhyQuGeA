import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Select} from "../Select";
describe("Select", () => {
    it("renders options", () => {
        render(() => (
            <Select
                options={[
                    {value: "a", label: "Alpha"},
                    {value: "b", label: "Beta"},
                ]}
            />
        ));
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Alpha")).toBeInTheDocument();
        expect(screen.getByText("Beta")).toBeInTheDocument();
    });
    it("renders a label associated with the select", () => {
        render(() => <Select label="Scope" options={[{value: "a", label: "Alpha"}]} />);
        expect(screen.getByLabelText("Scope")).toBeInTheDocument();
    });
    it("renders error message and marks invalid", () => {
        render(() => <Select label="Scope" error="Required" options={[]} />);
        expect(screen.getByLabelText("Scope")).toBeInvalid();
        expect(screen.getByText("Required")).toBeInTheDocument();
    });
    it("calls onChange and updates value", () => {
        let handler = vi.fn<() => void>();
        render(() => (
            <Select
                options={[
                    {value: "a", label: "Alpha"},
                    {value: "b", label: "Beta"},
                ]}
                onChange={handler}
            />
        ));
        let select = screen.getByRole("combobox") as HTMLSelectElement;
        fireEvent.change(select, {target: {value: "b"}});
        expect(handler).toHaveBeenCalledTimes(1);
        expect(select.value).toBe("b");
    });
    it("renders hint text", () => {
        render(() => <Select label="Scope" hint="Pick one" options={[]} />);
        expect(screen.getByText("Pick one")).toBeInTheDocument();
    });
});
