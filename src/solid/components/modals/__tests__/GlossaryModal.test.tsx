import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {GlossaryModal} from "../GlossaryModal";
import {useUiStore} from "../../../stores/uiStore";
import {Glossary} from "../../../../lib/physics/reference/Glossary";
import type {GlossaryEntry} from "../../../../lib/physics/reference/Glossary";
const ALL_CATEGORIES_SENTINEL = "__all__";
function makeGlossary(): Glossary {
    let entries: GlossaryEntry[] = [
        {term: "Velocity", definition: "Rate of change of displacement with respect to time", category: "mechanics", related: ["Speed", "Displacement"], latex: "\\vec{v}"},
        {term: "Wavelength", definition: "Distance between successive crests of a wave", category: "waves", latex: "\\lambda"},
        {term: "Photon", definition: "A quantum of electromagnetic radiation", category: "quantum", related: ["Energy"]},
    ];
    return new Glossary(entries);
}
beforeEach(() => {
    useUiStore.setState(useUiStore.getInitialState());
});
describe("GlossaryModal (task 5.79)", () => {
    it("does not render when closed", () => {
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    it("renders the dialog with term list when open", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: /glossary/i, level: 2})).toBeInTheDocument();
        expect(screen.getByText("Velocity")).toBeInTheDocument();
        expect(screen.getByText("Wavelength")).toBeInTheDocument();
        expect(screen.getByText("Photon")).toBeInTheDocument();
    });
    it("renders the result count via aria-live polite region", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        let live = screen.getByText(/3 terms/i);
        expect(live).toHaveAttribute("aria-live", "polite");
    });
    it("filters terms by search query on term name", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        let input = screen.getByLabelText("Search glossary by term or definition");
        fireEvent.input(input, {target: {value: "photo"}});
        expect(screen.getByText("Photon")).toBeInTheDocument();
        expect(screen.queryByText("Velocity")).not.toBeInTheDocument();
        expect(screen.queryByText("Wavelength")).not.toBeInTheDocument();
        expect(screen.getByText(/1 term/i)).toBeInTheDocument();
    });
    it("filters terms by search query on definition", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        let input = screen.getByLabelText("Search glossary by term or definition");
        fireEvent.input(input, {target: {value: "electromagnetic"}});
        expect(screen.getByText("Photon")).toBeInTheDocument();
        expect(screen.queryByText("Velocity")).not.toBeInTheDocument();
        expect(screen.queryByText("Wavelength")).not.toBeInTheDocument();
    });
    it("filters terms by category select", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        let select = screen.getByLabelText("Filter glossary by category");
        fireEvent.change(select, {target: {value: "waves"}});
        expect(screen.getByText("Wavelength")).toBeInTheDocument();
        expect(screen.queryByText("Velocity")).not.toBeInTheDocument();
        expect(screen.queryByText("Photon")).not.toBeInTheDocument();
    });
    it("renders the empty state when no term matches the search", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        let input = screen.getByLabelText("Search glossary by term or definition");
        fireEvent.input(input, {target: {value: "zzzzznomatch"}});
        expect(screen.getByRole("heading", {name: /no terms match your search/i, level: 3})).toBeInTheDocument();
        expect(screen.getByText(/try a different keyword or category/i)).toBeInTheDocument();
    });
    it("renders LaTeX symbols via MathRenderer for entries that have latex", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        // Two entries have latex: Velocity (\vec{v}) and Wavelength (\lambda).
        // KaTeX wraps rendered output in <span class="katex">.
        let rendered = document.querySelectorAll(".katex");
        expect(rendered.length).toBe(2);
    });
    it("renders prettified category labels in the category select", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        let select = screen.getByLabelText("Filter glossary by category");
        let options = Array.from(select.querySelectorAll("option"));
        expect(options.some(o => o.textContent === "All categories")).toBe(true);
        expect(options.some(o => o.textContent === "Mechanics")).toBe(true);
        expect(options.some(o => o.textContent === "Waves")).toBe(true);
        expect(options.some(o => o.textContent === "Quantum")).toBe(true);
    });
    it("renders the category pill on each term card", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        // Each prettified category appears twice: once as an <option> and once as a pill.
        expect(screen.getAllByText("Mechanics").length).toBe(2);
        expect(screen.getAllByText("Waves").length).toBe(2);
        expect(screen.getAllByText("Quantum").length).toBe(2);
    });
    it("renders related terms as cross-reference chips", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        expect(screen.getByText("Speed")).toBeInTheDocument();
        expect(screen.getByText("Displacement")).toBeInTheDocument();
        expect(screen.getAllByText("Related:").length).toBe(2);
    });
    it("closes the modal when Close button is clicked", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        fireEvent.click(screen.getByRole("button", {name: /^close$/i}));
        expect(useUiStore.getState().activeModal).toBe(null);
    });
    it("uses the default Glossary when no glossary prop is supplied", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal />);
        let live = screen.getByText(/\d+ terms/i);
        expect(live).toBeInTheDocument();
    });
    it("does not duplicate category options when multiple terms share a category", () => {
        let entries: GlossaryEntry[] = [
            {term: "Velocity", definition: "v", category: "mechanics"},
            {term: "Force", definition: "f", category: "mechanics"},
            {term: "Wavelength", definition: "w", category: "waves"},
        ];
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={new Glossary(entries)} />);
        let select = screen.getByLabelText("Filter glossary by category");
        let mechanicsOptions = Array.from(select.querySelectorAll("option")).filter(o => o.value === "mechanics");
        expect(mechanicsOptions.length).toBe(1);
    });
    it("shows plural 'terms' for counts other than 1 and singular 'term' for 1", () => {
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={makeGlossary()} />);
        expect(screen.getByText(/3 terms/i)).toBeInTheDocument();
        let input = screen.getByLabelText("Search glossary by term or definition");
        fireEvent.input(input, {target: {value: "photo"}});
        expect(screen.getByText(/1 term/i)).toBeInTheDocument();
    });
    it("sorts categories alphabetically in the category select", () => {
        let entries: GlossaryEntry[] = [
            {term: "A", definition: "a", category: "waves"},
            {term: "B", definition: "b", category: "mechanics"},
            {term: "C", definition: "c", category: "quantum"},
        ];
        useUiStore.getState().openModal("glossary");
        render(() => <GlossaryModal glossary={new Glossary(entries)} />);
        let select = screen.getByLabelText("Filter glossary by category");
        let optionValues = Array.from(select.querySelectorAll("option"))
            .map(o => o.value)
            .filter(v => v !== ALL_CATEGORIES_SENTINEL);
        let sorted = [...optionValues].sort((a, b) => a.localeCompare(b));
        expect(optionValues).toEqual(sorted);
    });
});
