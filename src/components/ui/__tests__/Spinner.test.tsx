import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {Spinner} from "../Spinner";
function getSpinner(): HTMLDivElement {
	return document.querySelector(".spinner") as HTMLDivElement;
}
describe("Spinner", () => {
	it("renders default spinner", () => {
		render(<Spinner />);
		const spinner=getSpinner();
		expect(spinner).not.toBeNull();
		expect(spinner.classList.contains("spinner")).toBe(true);
		expect(spinner.getAttribute("aria-hidden")).toBe("true");
	});
	it("renders sm size", () => {
		render(<Spinner size="sm" />);
		const spinner=getSpinner();
		expect(spinner.style.width).toBe("16px");
		expect(spinner.style.height).toBe("16px");
	});
	it("renders md size", () => {
		render(<Spinner size="md" />);
		const spinner=getSpinner();
		expect(spinner.style.width).toBe("24px");
		expect(spinner.style.height).toBe("24px");
	});
	it("renders lg size", () => {
		render(<Spinner size="lg" />);
		const spinner=getSpinner();
		expect(spinner.style.width).toBe("32px");
		expect(spinner.style.height).toBe("32px");
	});
	it("standalone spinner has role status and accessible label", () => {
		render(<Spinner standalone />);
		const spinner=screen.getByRole("status");
		expect(spinner.classList.contains("spinner")).toBe(true);
		expect(spinner.textContent).toBe("Loading");
	});
	it("non-standalone spinner is aria-hidden", () => {
		render(<Spinner />);
		const spinner=getSpinner();
		expect(spinner.getAttribute("aria-hidden")).toBe("true");
	});
	it("applies custom className", () => {
		render(<Spinner className="my-custom-class" />);
		const spinner=getSpinner();
		expect(spinner.classList.contains("my-custom-class")).toBe(true);
	});
});
