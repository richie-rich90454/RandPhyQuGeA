import {describe, it, expect, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {Switch} from "../Switch";
function getSwitch(): HTMLInputElement {
	const element=screen.getByRole("switch");
	expect(element).toBeDefined();
	return element as HTMLInputElement;
}
describe("Switch", () => {
	it("renders a switch with accessible label", () => {
		render(<Switch label="Airplane mode" />);
		const switchElement=getSwitch();
		expect(switchElement.getAttribute("aria-checked")).toBe("false");
		const label=screen.getByText("Airplane mode");
		expect(label.tagName).toBe("SPAN");
	});
	it("associates label with input via htmlFor/id", () => {
		render(<Switch id="plane-switch" label="Airplane mode" />);
		const switchElement=getSwitch();
		expect(switchElement.id).toBe("plane-switch");
	});
	it("toggles checked state when clicked", () => {
		render(<Switch label="Airplane mode" />);
		const switchElement=getSwitch();
		expect(switchElement.checked).toBe(false);
		fireEvent.click(switchElement);
		expect(switchElement.checked).toBe(true);
		expect(switchElement.getAttribute("aria-checked")).toBe("true");
		fireEvent.click(switchElement);
		expect(switchElement.checked).toBe(false);
		expect(switchElement.getAttribute("aria-checked")).toBe("false");
	});
	it("calls onCheckedChange with the new state", () => {
		const handleChange=vi.fn<(checked: boolean) => void>();
		render(<Switch label="Airplane mode" onCheckedChange={handleChange} />);
		const switchElement=getSwitch();
		fireEvent.click(switchElement);
		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenLastCalledWith(true);
		fireEvent.click(switchElement);
		expect(handleChange).toHaveBeenCalledTimes(2);
		expect(handleChange).toHaveBeenLastCalledWith(false);
	});
	it("supports controlled checked state", () => {
		const {rerender}=render(<Switch label="Airplane mode" checked={false} onCheckedChange={() => {}} />);
		expect(getSwitch().checked).toBe(false);
		rerender(<Switch label="Airplane mode" checked={true} onCheckedChange={() => {}} />);
		expect(getSwitch().checked).toBe(true);
	});
	it("respects defaultChecked", () => {
		render(<Switch label="Airplane mode" defaultChecked />);
		expect(getSwitch().checked).toBe(true);
	});
	it("does not toggle when disabled", () => {
		const handleChange=vi.fn<(checked: boolean) => void>();
		render(<Switch label="Airplane mode" disabled onCheckedChange={handleChange} />);
		const switchElement=getSwitch();
		expect(switchElement.disabled).toBe(true);
		fireEvent.click(switchElement);
		expect(handleChange).not.toHaveBeenCalled();
	});
	it("renders hint with aria-describedby", () => {
		render(<Switch id="plane-switch" label="Airplane mode" hint="Disables all radios" />);
		const switchElement=getSwitch();
		const hintId=switchElement.getAttribute("aria-describedby");
		expect(hintId).toBe("plane-switch-hint");
		const hint=document.getElementById(hintId!);
		expect(hint).toBeDefined();
		expect(hint?.textContent).toBe("Disables all radios");
	});
});
