import {describe, it, expect, vi} from "vitest";
import {render, screen, fireEvent} from "@testing-library/react";
import {Slider} from "../Slider";
function renderSlider(props = {}) {
	return render(<Slider min={1} max={7} value={[2, 5]} onChange={vi.fn<(value: [number, number]) => void>()} {...props} />);
}
function getSliders(): [HTMLInputElement, HTMLInputElement] {
	const sliders=screen.getAllByRole<HTMLInputElement>("slider");
	expect(sliders.length).toBe(2);
	return [sliders[0]!, sliders[1]!];
}
describe("Slider", () => {
	it("renders two range inputs", () => {
		renderSlider();
		const sliders=getSliders();
		expect(sliders.length).toBe(2);
		expect(sliders[0]?.getAttribute("type")).toBe("range");
		expect(sliders[1]?.getAttribute("type")).toBe("range");
	});
	it("prevents min from equaling or exceeding max when adjacent", () => {
		const handleChange=vi.fn<(value: [number, number]) => void>();
		renderSlider({min: 1, max: 2, value: [1, 2], onChange: handleChange});
		const sliders=getSliders();
		fireEvent.change(sliders[0], {target: {value: "2"}});
		expect(handleChange).toHaveBeenCalledWith([1, 2]);
	});
	it("prevents max from equaling or falling below min when adjacent", () => {
		const handleChange=vi.fn<(value: [number, number]) => void>();
		renderSlider({min: 1, max: 2, value: [1, 2], onChange: handleChange});
		const sliders=getSliders();
		fireEvent.change(sliders[1], {target: {value: "1"}});
		expect(handleChange).toHaveBeenCalledWith([1, 2]);
	});
	it("maintains at least one unit gap for wider ranges", () => {
		const handleChange=vi.fn<(value: [number, number]) => void>();
		renderSlider({min: 1, max: 10, value: [3, 7], onChange: handleChange});
		const sliders=getSliders();
		fireEvent.change(sliders[0], {target: {value: "8"}});
		expect(handleChange).toHaveBeenCalledWith([6, 7]);
		handleChange.mockClear();
		fireEvent.change(sliders[1], {target: {value: "2"}});
		expect(handleChange).toHaveBeenCalledWith([3, 4]);
	});
	it("calls onChange with new values", () => {
		const handleChange=vi.fn<(value: [number, number]) => void>();
		renderSlider({onChange: handleChange});
		const sliders=getSliders();
		fireEvent.change(sliders[0], {target: {value: "3"}});
		expect(handleChange).toHaveBeenCalledWith([3, 5]);
		handleChange.mockClear();
		fireEvent.change(sliders[1], {target: {value: "6"}});
		expect(handleChange).toHaveBeenCalledWith([2, 6]);
	});
	it("exposes aria-valuemin, aria-valuemax, aria-valuenow, and aria-valuetext", () => {
		renderSlider({min: 1, max: 7, value: [2, 5]});
		const sliders=getSliders();
		expect(sliders[0]?.getAttribute("aria-valuemin")).toBe("1");
		expect(sliders[0]?.getAttribute("aria-valuemax")).toBe("7");
		expect(sliders[0]?.getAttribute("aria-valuenow")).toBe("2");
		expect(sliders[0]?.getAttribute("aria-valuetext")).toBe("Minimum value 2");
		expect(sliders[1]?.getAttribute("aria-valuemin")).toBe("1");
		expect(sliders[1]?.getAttribute("aria-valuemax")).toBe("7");
		expect(sliders[1]?.getAttribute("aria-valuenow")).toBe("5");
		expect(sliders[1]?.getAttribute("aria-valuetext")).toBe("Maximum value 5");
	});
	it("renders label and associates it with the min input", () => {
		renderSlider({label: "Difficulty"});
		const input=screen.getByLabelText("Difficulty") as HTMLInputElement;
		expect(input).toBeDefined();
		const label=screen.getByText("Difficulty") as HTMLLabelElement;
		expect(label.htmlFor).toBe(input.id);
	});
	it("renders error message and sets aria-invalid", () => {
		renderSlider({error: "Invalid range", label: "Difficulty"});
		const sliders=getSliders();
		expect(sliders[0]?.getAttribute("aria-invalid")).toBe("true");
		expect(sliders[1]?.getAttribute("aria-invalid")).toBe("true");
		expect(screen.getByText("Invalid range")).toBeDefined();
	});
	it("renders hint and sets aria-describedby", () => {
		renderSlider({hint: "Select a range", label: "Difficulty"});
		const sliders=getSliders();
		const describedBy=sliders[0]?.getAttribute("aria-describedby");
		expect(describedBy).toBeTruthy();
		expect(screen.getByText("Select a range").id).toBe(describedBy);
	});
	it("error and hint both appear in aria-describedby", () => {
		renderSlider({error: "Invalid", hint: "Select a range", label: "Difficulty"});
		const sliders=getSliders();
		const describedBy=sliders[0]?.getAttribute("aria-describedby") as string;
		const error=screen.getByText("Invalid");
		const hint=screen.getByText("Select a range");
		expect(describedBy).toContain(error.id);
		expect(describedBy).toContain(hint.id);
	});
	it("renders filled track segment with correct style", () => {
		renderSlider({min: 1, max: 7, value: [2, 5]});
		const track=screen.getByTestId("slider-filled-track");
		expect(track.style.left).toBe("16.666666666666664%");
		expect(track.style.width).toBe("50%");
	});
	it("collapses both values when min equals max in props", () => {
		const handleChange=vi.fn<(value: [number, number]) => void>();
		renderSlider({min: 5, max: 5, value: [5, 5], onChange: handleChange});
		const sliders=getSliders();
		expect(sliders[0]?.getAttribute("aria-valuenow")).toBe("5");
		expect(sliders[1]?.getAttribute("aria-valuenow")).toBe("5");
		fireEvent.change(sliders[0], {target: {value: "6"}});
		expect(handleChange).not.toHaveBeenCalled();
	});
});
