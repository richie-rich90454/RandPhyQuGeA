import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {ProgressBar} from "../ProgressBar";
function getProgressbar(): HTMLDivElement {
	return screen.getByRole<HTMLDivElement>("progressbar");
}
function getFill(): HTMLDivElement {
	return document.querySelector(".progress-bar") as HTMLDivElement;
}
describe("ProgressBar", () => {
	it("renders with correct width based on value", () => {
		render(<ProgressBar value={42} />);
		expect(getFill().style.width).toBe("42%");
	});
	it("clamps value to 0-100", () => {
		const {rerender}=render(<ProgressBar value={-10} />);
		expect(getFill().style.width).toBe("0%");
		rerender(<ProgressBar value={150} />);
		expect(getFill().style.width).toBe("100%");
	});
	it("sets aria-valuemin/max/now/text", () => {
		render(<ProgressBar value={37} />);
		const pb=getProgressbar();
		expect(pb.getAttribute("aria-valuemin")).toBe("0");
		expect(pb.getAttribute("aria-valuemax")).toBe("100");
		expect(pb.getAttribute("aria-valuenow")).toBe("37");
		expect(pb.getAttribute("aria-valuetext")).toBe("37%");
	});
	it("indeterminate mode renders indeterminate element and omits aria-valuenow", () => {
		render(<ProgressBar indeterminate />);
		const pb=getProgressbar();
		expect(pb.getAttribute("aria-valuenow")).toBeNull();
		expect(pb.getAttribute("aria-valuetext")).toBeNull();
		expect(pb.getAttribute("aria-valuemin")).toBe("0");
		expect(pb.getAttribute("aria-valuemax")).toBe("100");
		const fill=getFill();
		expect(fill.classList.contains("progress-bar-indeterminate")).toBe(true);
	});
	it("custom aria-label applies", () => {
		render(<ProgressBar value={10} ariaLabel="Uploading" />);
		expect(getProgressbar().getAttribute("aria-label")).toBe("Uploading");
	});
	it("custom className applies", () => {
		render(<ProgressBar value={10} className="my-progress" />);
		expect(getProgressbar().classList.contains("my-progress")).toBe(true);
	});
});
