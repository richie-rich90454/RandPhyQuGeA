import {render, screen, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {Wizard} from "../Wizard";
import {QUESTION_TYPE_ALIASES} from "../../../types/models";
beforeEach(() => {
    window.location.hash = "";
});
describe("Wizard page", () => {
    it("renders the page heading and subtitle", () => {
        render(() => <Wizard />);
        expect(screen.getByText("Template Authoring Wizard")).toBeInTheDocument();
        expect(screen.getByText(/Build a question template step by step/)).toBeInTheDocument();
    });
    it("renders the back-to-app link", () => {
        render(() => <Wizard />);
        expect(screen.getByRole("button", {name: /back to app/i})).toBeInTheDocument();
    });
    it("renders the stepper with all 4 step labels", () => {
        render(() => <Wizard />);
        expect(screen.getAllByText("Type & Difficulty").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Identifiers & Text")).toBeInTheDocument();
        expect(screen.getByText("Answer & Variables")).toBeInTheDocument();
        expect(screen.getByText("Preview & Export")).toBeInTheDocument();
    });
    it("shows step 1 of 4 initially", () => {
        render(() => <Wizard />);
        expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    });
    it("disables the Back button on step 1", () => {
        render(() => <Wizard />);
        expect(screen.getByRole("button", {name: /^back$/i})).toBeDisabled();
    });
    it("navigates to step 2 when Next is clicked", () => {
        render(() => <Wizard />);
        fireEvent.click(screen.getByRole("button", {name: /^next$/i}));
        expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    });
    it("navigates back to step 1 when Back is clicked", () => {
        render(() => <Wizard />);
        fireEvent.click(screen.getByRole("button", {name: /^next$/i}));
        expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: /^back$/i}));
        expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    });
    it("disables the Next button on the last step", () => {
        render(() => <Wizard />);
        let nextButton = screen.getByRole("button", {name: /^next$/i});
        fireEvent.click(nextButton);
        fireEvent.click(nextButton);
        fireEvent.click(nextButton);
        expect(nextButton).toBeDisabled();
    });
    it("renders the question type select on step 1", () => {
        render(() => <Wizard />);
        expect(screen.getByRole("combobox", {name: /question type/i})).toBeInTheDocument();
    });
    it("derives question-type options from the canonical QUESTION_TYPE_ALIASES (regression 5.42)", () => {
        render(() => <Wizard />);
        let typeSelect = screen.getByRole("combobox", {name: /question type/i});
        if (!(typeSelect instanceof HTMLSelectElement)) throw new Error("Expected select element");
        let optionValues = Array.from(typeSelect.options).map(o => o.value);
        let expected = Object.keys(QUESTION_TYPE_ALIASES).filter(k => k !== QUESTION_TYPE_ALIASES[k]);
        expect(optionValues).toEqual(expected);
    });
    it("updates the question type when the select changes", () => {
        render(() => <Wizard />);
        let typeSelect = screen.getByRole("combobox", {name: /question type/i});
        if (!(typeSelect instanceof HTMLSelectElement)) throw new Error("Expected select element");
        fireEvent.change(typeSelect, {target: {value: "ShortAnswer"}});
        expect(typeSelect.value).toBe("ShortAnswer");
    });
    it("shows the Distractors field when the question type is MultipleChoice", () => {
        render(() => <Wizard />);
        fireEvent.click(screen.getByRole("button", {name: /^next$/i}));
        fireEvent.click(screen.getByRole("button", {name: /^next$/i}));
        expect(screen.getByLabelText(/distractors/i)).toBeInTheDocument();
    });
    it("hides the Distractors field when the question type is not MultipleChoice", () => {
        render(() => <Wizard />);
        let typeSelect = screen.getByRole("combobox", {name: /question type/i});
        fireEvent.change(typeSelect, {target: {value: "ShortAnswer"}});
        fireEvent.click(screen.getByRole("button", {name: /^next$/i}));
        fireEvent.click(screen.getByRole("button", {name: /^next$/i}));
        expect(screen.queryByLabelText(/distractors/i)).not.toBeInTheDocument();
    });
    it("shows the spec preview and generates a sample question on step 4", async () => {
        let {container} = render(() => <Wizard />);
        let nextButton = screen.getByRole("button", {name: /^next$/i});
        fireEvent.click(nextButton);
        fireEvent.click(nextButton);
        fireEvent.click(nextButton);
        expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
        let pre = container.querySelector("pre");
        expect(pre?.textContent ?? "").toContain("[UNIT]");
        fireEvent.click(screen.getByRole("button", {name: /generate sample question/i}));
        await waitFor(() => expect(screen.getByText("Answer:")).toBeInTheDocument(), {timeout: 3000});
    });
    it("clears the hash when the back link is clicked", () => {
        window.location.hash = "/wizard";
        render(() => <Wizard />);
        fireEvent.click(screen.getByRole("button", {name: /back to app/i}));
        expect(window.location.hash).toBe("");
    });
});
