import {describe, it, expect, vi} from "vitest";
import {render, screen, fireEvent} from "@testing-library/react";
import {type ChangeEvent} from "react";
import {Select} from "../Select";
const options=[
	{value: "a", label: "Option A"},
	{value: "b", label: "Option B"},
	{value: "c", label: "Option C"},
];
function getSelect(): HTMLSelectElement {
	return screen.getByRole<HTMLSelectElement>("combobox");
}
describe("Select", () => {
	it("renders options", () => {
		render(<Select options={options} />);
		const select=getSelect();
		expect(select).toBeDefined();
		expect(screen.getByText("Option A")).toBeDefined();
		expect(screen.getByText("Option B")).toBeDefined();
		expect(screen.getByText("Option C")).toBeDefined();
	});
	it("associates label with select via htmlFor/id", () => {
		render(<Select label="Topic" options={options} />);
		const select=getSelect();
		const label=screen.getByText("Topic") as HTMLLabelElement;
		expect(label.tagName).toBe("LABEL");
		expect(label.htmlFor).toBe(select.id);
	});
	it("custom id overrides generated id", () => {
		render(<Select id="custom-select" label="Topic" options={options} />);
		const select=getSelect();
		expect(select.id).toBe("custom-select");
		const label=screen.getByText("Topic") as HTMLLabelElement;
		expect(label.htmlFor).toBe("custom-select");
	});
	it("error state sets aria-invalid and renders message", () => {
		render(<Select label="Topic" options={options} error="Required" />);
		const select=getSelect();
		expect(select.getAttribute("aria-invalid")).toBe("true");
		expect(screen.getByText("Required")).toBeDefined();
	});
	it("hint renders and sets aria-describedby", () => {
		render(<Select label="Topic" options={options} hint="Choose a topic" />);
		const select=getSelect();
		const hintId=select.getAttribute("aria-describedby");
		expect(hintId).toBeTruthy();
		expect(screen.getByText("Choose a topic").id).toBe(hintId);
	});
	it("error and hint both set aria-describedby", () => {
		render(<Select label="Topic" options={options} error="Required" hint="Choose a topic" />);
		const select=getSelect();
		const describedBy=select.getAttribute("aria-describedby");
		const error=screen.getByText("Required");
		const hint=screen.getByText("Choose a topic");
		expect(describedBy).toContain(error.id);
		expect(describedBy).toContain(hint.id);
	});
	it("chevron icon is present", () => {
		render(<Select options={options} />);
		const chevron=document.querySelector("svg");
		expect(chevron).toBeTruthy();
	});
	it("onChange fires", () => {
		const handleChange=vi.fn<(event: ChangeEvent<HTMLSelectElement>) => void>();
		render(<Select options={options} onChange={handleChange} />);
		const select=getSelect();
		fireEvent.change(select, {target: {value: "b"}});
		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(select.value).toBe("b");
	});
});
