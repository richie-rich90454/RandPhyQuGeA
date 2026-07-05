import {describe, it, expect, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {Pill} from "../Pill";
function getPill(): HTMLButtonElement {
	return screen.getByRole<HTMLButtonElement>("button");
}
describe("Pill", () => {
	it("renders with name and default variant", () => {
		render(<Pill name="Kinematics" />);
		let pill = getPill();
		expect(pill.tagName).toBe("BUTTON");
		expect(pill.textContent).toBe("Kinematics");
		expect(pill.classList.contains("topic-pill")).toBe(true);
		expect(pill.classList.contains("bg-surface")).toBe(true);
		expect(pill.classList.contains("text-text-primary")).toBe(true);
	});
	it("applies active variant via prop", () => {
		render(<Pill name="Kinematics" variant="active" />);
		let pill = getPill();
		expect(pill.classList.contains("bg-accent-600")).toBe(true);
		expect(pill.classList.contains("text-text-inverse")).toBe(true);
		expect(pill.getAttribute("aria-pressed")).toBe("true");
	});
	it("maps active boolean to active variant", () => {
		render(<Pill name="Kinematics" active />);
		let pill = getPill();
		expect(pill.classList.contains("bg-accent-600")).toBe(true);
		expect(pill.classList.contains("text-text-inverse")).toBe(true);
		expect(pill.getAttribute("aria-pressed")).toBe("true");
	});
	it("applies outline variant classes", () => {
		render(<Pill name="Kinematics" variant="outline" />);
		let pill = getPill();
		expect(pill.classList.contains("bg-transparent")).toBe(true);
		expect(pill.classList.contains("border-border")).toBe(true);
		expect(pill.getAttribute("aria-pressed")).toBe("false");
	});
	it("applies sm size classes", () => {
		render(<Pill name="Kinematics" size="sm" />);
		let pill = getPill();
		expect(pill.classList.contains("px-2")).toBe(true);
		expect(pill.classList.contains("py-0.5")).toBe(true);
		expect(pill.classList.contains("text-xs")).toBe(true);
	});
	it("applies md size classes by default", () => {
		render(<Pill name="Kinematics" />);
		let pill = getPill();
		expect(pill.classList.contains("px-2.5")).toBe(true);
		expect(pill.classList.contains("py-1")).toBe(true);
	});
	it("applies lg size classes", () => {
		render(<Pill name="Kinematics" size="lg" />);
		let pill = getPill();
		expect(pill.classList.contains("px-3")).toBe(true);
		expect(pill.classList.contains("py-1.5")).toBe(true);
		expect(pill.classList.contains("text-sm")).toBe(true);
	});
	it("fires onClick handler", () => {
		let handleClick = vi.fn<() => void>();
		render(<Pill name="Kinematics" onClick={handleClick} />);
		getPill().click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});
	it("renders icon", () => {
		render(<Pill name="Kinematics" icon={<span data-testid="pill-icon">K</span>} />);
		expect(screen.getByTestId("pill-icon")).toBeDefined();
	});
	it("uses ariaLabel when provided", () => {
		render(<Pill name="Kinematics" ariaLabel="Select Kinematics topic" />);
		let pill = getPill();
		expect(pill.getAttribute("aria-label")).toBe("Select Kinematics topic");
	});
	it("appends custom className", () => {
		render(<Pill name="Kinematics" className="custom-pill" />);
		let pill = getPill();
		expect(pill.classList.contains("custom-pill")).toBe(true);
	});
});
