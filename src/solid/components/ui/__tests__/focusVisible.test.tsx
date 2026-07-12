import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {Input} from "../Input";
import {Select} from "../Select";
import {Slider} from "../Slider";
let inputCss=readFileSync(join(process.cwd(), "src", "solid", "components", "ui", "Input.module.css"), "utf-8");
let selectCss=readFileSync(join(process.cwd(), "src", "solid", "components", "ui", "Select.module.css"), "utf-8");
let sliderCss=readFileSync(join(process.cwd(), "src", "solid", "components", "ui", "Slider.module.css"), "utf-8");
describe("focus-visible on primary controls (task 5.22)", () => {
	describe("Input uses :focus-visible instead of bare :focus", () => {
		it(".input rule uses :focus-visible", () => {
			expect(inputCss).toContain(".input:focus-visible");
			expect(inputCss).not.toMatch(/\.input:focus\s*\{/);
		});
		it(".errorInput rule uses :focus-visible", () => {
			expect(inputCss).toContain(".errorInput:focus-visible");
			expect(inputCss).not.toMatch(/\.errorInput:focus\s*\{/);
		});
		it("forced-colors override uses :focus-visible", () => {
			expect(inputCss).toContain(".input:focus-visible { border-color: Highlight; }");
		});
		it("input element is keyboard-focusable", () => {
			render(() => <Input label="Name" />);
			let input=screen.getByLabelText("Name");
			input.focus();
			expect(document.activeElement).toBe(input);
		});
	});
	describe("Select uses :focus-visible instead of bare :focus", () => {
		it(".select rule uses :focus-visible", () => {
			expect(selectCss).toContain(".select:focus-visible");
			expect(selectCss).not.toMatch(/\.select:focus\s*\{/);
		});
		it(".errorSelect rule uses :focus-visible", () => {
			expect(selectCss).toContain(".errorSelect:focus-visible");
			expect(selectCss).not.toMatch(/\.errorSelect:focus\s*\{/);
		});
		it("select element is keyboard-focusable", () => {
			render(() => <Select label="Scope" options={[{value: "a", label: "Alpha"}]} />);
			let select=screen.getByLabelText("Scope");
			select.focus();
			expect(document.activeElement).toBe(select);
		});
	});
	describe("Slider thumbs have :focus-visible indicator", () => {
		it("webkit slider thumb has :focus-visible", () => {
			expect(sliderCss).toContain(".thumb:focus-visible::-webkit-slider-thumb");
		});
		it("moz range thumb has :focus-visible", () => {
			expect(sliderCss).toContain(".thumb:focus-visible::-moz-range-thumb");
		});
		it("focus-visible thumb sets focus shadow token", () => {
			expect(sliderCss).toContain("box-shadow: var(--shadow-focus)");
		});
		it("slider inputs are keyboard-focusable", () => {
			render(() => <Slider min={0} max={100} value={[20, 80]} onChange={() => {}} label="Range" />);
			let inputs=screen.getAllByRole("slider");
			expect(inputs).toHaveLength(2);
			inputs[0]!.focus();
			expect(document.activeElement).toBe(inputs[0]);
			inputs[1]!.focus();
			expect(document.activeElement).toBe(inputs[1]);
		});
	});
});
