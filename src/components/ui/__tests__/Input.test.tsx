import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {Input} from "../Input";
function getInput(): HTMLInputElement {
	return screen.getByRole<HTMLInputElement>("textbox");
}
describe("Input", () => {
	it("renders input with label and associates via htmlFor/id", () => {
		render(<Input label="Username" />);
		const input=getInput();
		expect(input).toBeDefined();
		const label=screen.getByText("Username") as HTMLLabelElement;
		expect(label.tagName).toBe("LABEL");
		expect(label.htmlFor).toBe(input.id);
	});
	it("renders error message and sets aria-invalid", () => {
		render(<Input label="Username" error="Required" />);
		const input=getInput();
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(screen.getByText("Required")).toBeDefined();
	});
	it("aria-describedby points to error message", () => {
		render(<Input label="Username" error="Required" />);
		const input=getInput();
		const errorId=input.getAttribute("aria-describedby");
		expect(errorId).toBeTruthy();
		expect(screen.getByText("Required").id).toBe(errorId);
	});
	it("renders hint and sets aria-describedby", () => {
		render(<Input label="Username" hint="At least 3 characters" />);
		const input=getInput();
		const hintId=input.getAttribute("aria-describedby");
		expect(hintId).toBeTruthy();
		expect(screen.getByText("At least 3 characters").id).toBe(hintId);
	});
	it("error and hint both present: aria-describedby contains both ids", () => {
		render(<Input label="Username" error="Required" hint="At least 3 characters" />);
		const input=getInput();
		const describedBy=input.getAttribute("aria-describedby");
		const error=screen.getByText("Required");
		const hint=screen.getByText("At least 3 characters");
		expect(describedBy).toContain(error.id);
		expect(describedBy).toContain(hint.id);
	});
	it("custom id overrides generated id", () => {
		render(<Input label="Username" id="custom-id" />);
		const input=getInput();
		expect(input.id).toBe("custom-id");
		const label=screen.getByText("Username") as HTMLLabelElement;
		expect(label.htmlFor).toBe("custom-id");
	});
	it("disabled state", () => {
		render(<Input label="Username" disabled />);
		const input=getInput();
		expect(input.disabled).toBe(true);
		expect(input.classList.contains("disabled:cursor-not-allowed")).toBe(true);
		expect(input.classList.contains("disabled:opacity-50")).toBe(true);
	});
	it("focus ring changes with error", () => {
		render(<Input label="Username" error="Required" />);
		const input=getInput();
		expect(input.classList.contains("border-[var(--danger)]")).toBe(true);
		expect(input.classList.contains("focus:border-[var(--danger)]")).toBe(true);
		expect(input.classList.contains("focus:ring-[var(--danger)]")).toBe(true);
	});
});
