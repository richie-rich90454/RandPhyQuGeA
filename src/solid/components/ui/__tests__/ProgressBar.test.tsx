import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {ProgressBar} from "../ProgressBar";
describe("ProgressBar", () => {
	it("renders a progressbar role", () => {
		render(() => <ProgressBar value={50} />);
		expect(screen.getByRole("progressbar")).toBeInTheDocument();
	});
	it("sets aria-valuenow to the rounded value", () => {
		render(() => <ProgressBar value={50} />);
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
	});
	it("sets aria-valuetext with percentage", () => {
		render(() => <ProgressBar value={33} />);
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "33%");
	});
	it("clamps value above 100 to 100", () => {
		render(() => <ProgressBar value={150} />);
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
	});
	it("clamps value below 0 to 0", () => {
		render(() => <ProgressBar value={-10} />);
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
	});
	it("omits aria-valuenow when indeterminate", () => {
		render(() => <ProgressBar indeterminate={true} />);
		expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
	});
	it("omits aria-valuetext when indeterminate", () => {
		render(() => <ProgressBar indeterminate={true} />);
		expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuetext");
	});
	it("uses custom aria-label", () => {
		render(() => <ProgressBar value={50} ariaLabel="Loading" />);
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Loading");
	});
	it("defaults aria-label to Progress", () => {
		render(() => <ProgressBar value={50} />);
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Progress");
	});
	it("has aria-valuemin=0 and aria-valuemax=100 (task 5.50)", () => {
		render(() => <ProgressBar value={50} />);
		let bar = screen.getByRole("progressbar");
		expect(bar).toHaveAttribute("aria-valuemin", "0");
		expect(bar).toHaveAttribute("aria-valuemax", "100");
	});
	it("defaults value to 0 when undefined with aria-valuenow=0 and aria-valuetext=0% (task 5.50)", () => {
		render(() => <ProgressBar />);
		let bar = screen.getByRole("progressbar");
		expect(bar).toHaveAttribute("aria-valuenow", "0");
		expect(bar).toHaveAttribute("aria-valuetext", "0%");
	});
	it("rounds fractional value for aria-valuenow and aria-valuetext (task 5.50)", () => {
		render(() => <ProgressBar value={33.7} />);
		let bar = screen.getByRole("progressbar");
		expect(bar).toHaveAttribute("aria-valuenow", "34");
		expect(bar).toHaveAttribute("aria-valuetext", "34%");
	});
});
