import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {FormulaCheatSheetModal} from "../FormulaCheatSheetModal";
import {useUiStore} from "../../../stores/uiStore";
import {FormulaLibrary} from "../../../../lib/physics/FormulaLibrary";
import type {FormulaEntry} from "../../../../types/models";
function makeLibrary(): FormulaLibrary {
    let entries: FormulaEntry[] = [
        {name: "Newton's Second Law", latex: "F = m a", description: "Net force equals mass times acceleration", variables: ["F", "m", "a"], topic_id: "dynamics"},
        {name: "Kinetic Energy", latex: "E_k = \\frac{1}{2} m v^2", description: "Kinetic energy of a moving object", variables: ["E_k", "m", "v"], topic_id: "energy"},
        {name: "Ohm's Law", latex: "V = I R", description: "Voltage equals current times resistance", variables: ["V", "I", "R"], topic_id: "dc-circuits"},
    ];
    return new FormulaLibrary(entries);
}
beforeEach(() => {
    useUiStore.setState(useUiStore.getInitialState());
});
describe("FormulaCheatSheetModal (task 5.77)", () => {
    it("does not render when closed", () => {
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    it("renders the dialog with formula list when open", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: /formula cheat sheet/i, level: 2})).toBeInTheDocument();
        expect(screen.getByText("Newton's Second Law")).toBeInTheDocument();
        expect(screen.getByText("Kinetic Energy")).toBeInTheDocument();
        expect(screen.getByText("Ohm's Law")).toBeInTheDocument();
    });
    it("renders the result count via aria-live polite region", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        let live = screen.getByText(/3 formula/i);
        expect(live).toHaveAttribute("aria-live", "polite");
    });
    it("filters formulas by search query on name", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        let input = screen.getByLabelText("Search formulas by name or description");
        fireEvent.input(input, {target: {value: "ohm"}});
        expect(screen.getByText("Ohm's Law")).toBeInTheDocument();
        expect(screen.queryByText("Newton's Second Law")).not.toBeInTheDocument();
        expect(screen.queryByText("Kinetic Energy")).not.toBeInTheDocument();
        expect(screen.getByText(/1 formula/i)).toBeInTheDocument();
    });
    it("filters formulas by search query on description", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        let input = screen.getByLabelText("Search formulas by name or description");
        fireEvent.input(input, {target: {value: "kinetic"}});
        expect(screen.getByText("Kinetic Energy")).toBeInTheDocument();
        expect(screen.queryByText("Newton's Second Law")).not.toBeInTheDocument();
    });
    it("filters formulas by topic select", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        let select = screen.getByLabelText("Filter formulas by topic");
        fireEvent.change(select, {target: {value: "energy"}});
        expect(screen.getByText("Kinetic Energy")).toBeInTheDocument();
        expect(screen.queryByText("Newton's Second Law")).not.toBeInTheDocument();
        expect(screen.queryByText("Ohm's Law")).not.toBeInTheDocument();
    });
    it("renders the empty state when no formula matches the search", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        let input = screen.getByLabelText("Search formulas by name or description");
        fireEvent.input(input, {target: {value: "zzzzznomatch"}});
        expect(screen.getByRole("heading", {name: /no formulas match your search/i, level: 3})).toBeInTheDocument();
        expect(screen.getByText(/try a different keyword or topic/i)).toBeInTheDocument();
    });
    it("renders variable list as a definition list with code elements", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        expect(screen.getAllByText("Variables:").length).toBe(3);
        let codeElements = screen.getAllByText((content, element) => element?.tagName === "CODE");
        let codeTexts = codeElements.map(e => e.textContent);
        expect(codeTexts).toContain("F");
        expect(codeTexts).toContain("m");
        expect(codeTexts).toContain("a");
    });
    it("renders each formula expression via MathRenderer with display mode", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        // KaTeX display mode wraps rendered output in <span class="katex-display">.
        let displays = document.querySelectorAll(".katex-display");
        expect(displays.length).toBe(3);
    });
    it("renders prettified topic labels in the topic select", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        let select = screen.getByLabelText("Filter formulas by topic");
        let options = Array.from(select.querySelectorAll("option"));
        expect(options.some(o => o.textContent === "All topics")).toBe(true);
        expect(options.some(o => o.textContent === "Dynamics")).toBe(true);
        expect(options.some(o => o.textContent === "Energy")).toBe(true);
        expect(options.some(o => o.textContent === "Dc Circuits")).toBe(true);
    });
    it("closes the modal when Close button is clicked", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        fireEvent.click(screen.getByRole("button", {name: /^close$/i}));
        expect(useUiStore.getState().activeModal).toBe(null);
    });
    it("uses the default FormulaLibrary when no library prop is supplied", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal />);
        let live = screen.getByText(/\d+ formula/i);
        expect(live).toBeInTheDocument();
    });
    it("does not duplicate topic options when multiple formulas share a topic_id", () => {
        let entries: FormulaEntry[] = [
            {name: "A", latex: "a", description: "a", variables: [], topic_id: "kinematics"},
            {name: "B", latex: "b", description: "b", variables: [], topic_id: "kinematics"},
            {name: "C", latex: "c", description: "c", variables: [], topic_id: "energy"},
        ];
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={new FormulaLibrary(entries)} />);
        let select = screen.getByLabelText("Filter formulas by topic");
        let kinematicsOptions = Array.from(select.querySelectorAll("option")).filter(o => o.value === "kinematics");
        expect(kinematicsOptions.length).toBe(1);
    });
    it("renders the topic pill on each formula card", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        // Each prettified topic appears twice: once as an <option> in the topic
        // <select> and once as a pill in the formula card header.
        expect(screen.getAllByText("Dynamics").length).toBe(2);
        expect(screen.getAllByText("Energy").length).toBe(2);
        expect(screen.getAllByText("Dc Circuits").length).toBe(2);
    });
    it("shows plural 'formulas' for counts other than 1 and singular 'formula' for 1", () => {
        useUiStore.getState().openModal("formulas");
        render(() => <FormulaCheatSheetModal library={makeLibrary()} />);
        expect(screen.getByText(/3 formulas/i)).toBeInTheDocument();
        let input = screen.getByLabelText("Search formulas by name or description");
        fireEvent.input(input, {target: {value: "ohm"}});
        expect(screen.getByText(/1 formula/i)).toBeInTheDocument();
    });
});
