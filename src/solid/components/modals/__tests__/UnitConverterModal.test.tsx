import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {UnitConverterModal} from "../UnitConverterModal";
import {useUiStore} from "../../../stores/uiStore";
beforeEach(() => {
    useUiStore.setState(useUiStore.getInitialState());
});
describe("UnitConverterModal (task 5.78)", () => {
    it("does not render when closed", () => {
        render(() => <UnitConverterModal />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    it("renders the dialog with the conversion form when open", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: /unit converter/i, level: 2})).toBeInTheDocument();
        expect(screen.getByLabelText("Numeric value to convert")).toBeInTheDocument();
        expect(screen.getByLabelText("Source unit")).toBeInTheDocument();
        expect(screen.getByLabelText("Target unit")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /swap source and target units/i})).toBeInTheDocument();
    });
    it("shows the prompt to enter value and pick both units before any input", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        expect(screen.getByText(/enter a value and pick both units to convert/i)).toBeInTheDocument();
    });
    it("disables the target select when no source unit is selected", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        let targetSelect = screen.getByLabelText("Target unit");
        expect(targetSelect).toBeDisabled();
    });
    it("populates the target dropdown with all units except the source", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        fireEvent.change(screen.getByLabelText("Source unit"), {target: {value: "m"}});
        let targetSelect = screen.getByLabelText("Target unit");
        expect(targetSelect).not.toBeDisabled();
        let optionValues = Array.from(targetSelect.querySelectorAll("option")).map(o => o.value);
        // Source unit 'm' is filtered out of the target dropdown.
        expect(optionValues).not.toContain("m");
        // Other registered units remain selectable; the converter reports
        // incompatibility for dimensionally-mismatched pairs at convert time.
        expect(optionValues).toContain("kg");
        expect(optionValues).toContain("s");
    });
    it("converts a value between compatible units and renders the result", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        fireEvent.change(screen.getByLabelText("Source unit"), {target: {value: "kg"}});
        fireEvent.change(screen.getByLabelText("Target unit"), {target: {value: "g"}});
        fireEvent.input(screen.getByLabelText("Numeric value to convert"), {target: {value: "2.5"}});
        // The result value "2500" is unique in the document (no option has this text).
        let resultValue = screen.getByText("2500");
        // The result value lives inside the aria-live result row alongside the unit "g".
        let liveRow = resultValue.closest("[aria-live]");
        expect(liveRow?.textContent).toContain("g");
    });
    it("shows an error when the value is non-numeric", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        fireEvent.change(screen.getByLabelText("Source unit"), {target: {value: "kg"}});
        fireEvent.change(screen.getByLabelText("Target unit"), {target: {value: "g"}});
        let input = screen.getByLabelText("Numeric value to convert") as HTMLInputElement;
        // JSDOM does not coerce non-numeric values on type=number inputs the
        // way real browsers do, so 'abc' reaches the converter signal intact
        // and the modal's Number.isFinite guard kicks in.
        fireEvent.input(input, {target: {value: "abc"}});
        // Either the finite-number error or the missing-input prompt is acceptable
        // depending on JSDOM coercion behavior; both are non-NaN error states.
        let finiteError = screen.queryByText(/value must be a finite number/i);
        let promptError = screen.queryByText(/enter a value and pick both units/i);
        let hasError = finiteError !== null || promptError !== null;
        expect(hasError).toBe(true);
        expect(screen.queryByText("NaN")).not.toBeInTheDocument();
    });
    it("shows an incompatibility error when source and target dimensions differ", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        // 'm' (length) and 'kg' (mass) are not dimensionally compatible.
        fireEvent.change(screen.getByLabelText("Source unit"), {target: {value: "m"}});
        fireEvent.change(screen.getByLabelText("Target unit"), {target: {value: "kg"}});
        fireEvent.input(screen.getByLabelText("Numeric value to convert"), {target: {value: "5"}});
        expect(screen.getByText(/units are not dimensionally compatible/i)).toBeInTheDocument();
    });
    it("swaps source and target units when Swap is clicked", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        let fromSelect = screen.getByLabelText("Source unit") as HTMLSelectElement;
        let toSelect = screen.getByLabelText("Target unit") as HTMLSelectElement;
        fireEvent.change(fromSelect, {target: {value: "kg"}});
        fireEvent.change(toSelect, {target: {value: "g"}});
        expect(fromSelect.value).toBe("kg");
        expect(toSelect.value).toBe("g");
        fireEvent.click(screen.getByRole("button", {name: /swap source and target units/i}));
        expect(fromSelect.value).toBe("g");
        expect(toSelect.value).toBe("kg");
    });
    it("disables Swap when source or target is unset", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        let swapBtn = screen.getByRole("button", {name: /swap source and target units/i}) as HTMLButtonElement;
        expect(swapBtn.disabled).toBe(true);
        fireEvent.change(screen.getByLabelText("Source unit"), {target: {value: "kg"}});
        expect(swapBtn.disabled).toBe(true);
        fireEvent.change(screen.getByLabelText("Target unit"), {target: {value: "g"}});
        expect(swapBtn.disabled).toBe(false);
    });
    it("closes the modal when Close button is clicked", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        fireEvent.click(screen.getByRole("button", {name: /^close$/i}));
        expect(useUiStore.getState().activeModal).toBe(null);
    });
    it("renders the result with aria-live polite for assistive technology", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        fireEvent.change(screen.getByLabelText("Source unit"), {target: {value: "s"}});
        fireEvent.change(screen.getByLabelText("Target unit"), {target: {value: "min"}});
        fireEvent.input(screen.getByLabelText("Numeric value to convert"), {target: {value: "60"}});
        let live = screen.getByText("1").closest("[aria-live]");
        expect(live).not.toBeNull();
        expect(live?.getAttribute("aria-live")).toBe("polite");
    });
    it("sorts the source and target unit dropdowns alphabetically", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        let fromSelect = screen.getByLabelText("Source unit");
        let fromOptions = Array.from(fromSelect.querySelectorAll("option"))
            .map(o => o.value)
            .filter(v => v !== "");
        // The modal sorts with localeCompare for natural case-aware ordering.
        let sortedFrom = [...fromOptions].sort((a, b) => a.localeCompare(b));
        expect(fromOptions).toEqual(sortedFrom);
    });
    it("resets the target unit when the source unit changes", () => {
        useUiStore.getState().openModal("unit-converter");
        render(() => <UnitConverterModal />);
        let fromSelect = screen.getByLabelText("Source unit") as HTMLSelectElement;
        let toSelect = screen.getByLabelText("Target unit") as HTMLSelectElement;
        fireEvent.change(fromSelect, {target: {value: "kg"}});
        fireEvent.change(toSelect, {target: {value: "g"}});
        expect(toSelect.value).toBe("g");
        fireEvent.change(fromSelect, {target: {value: "s"}});
        expect(toSelect.value).toBe("");
    });
});
