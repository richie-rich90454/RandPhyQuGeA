import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {Badge} from "../Badge";
function getBadge(): HTMLSpanElement {
	return screen.getByText<HTMLSpanElement>("Badge");
}
describe("Badge", () => {
	it("renders with default variant and size", () => {
		render(<Badge>Badge</Badge>);
		let badge = getBadge();
		expect(badge.tagName).toBe("SPAN");
		expect(badge.classList.contains("bg-neutral-100")).toBe(true);
		expect(badge.classList.contains("text-neutral-800")).toBe(true);
		expect(badge.classList.contains("text-xs")).toBe(true);
		expect(badge.classList.contains("px-2.5")).toBe(true);
	});
	it("applies success variant classes", () => {
		render(<Badge variant="success">Badge</Badge>);
		let badge = getBadge();
		expect(badge.classList.contains("bg-success-100")).toBe(true);
		expect(badge.classList.contains("text-success-800")).toBe(true);
	});
	it("applies warning variant classes", () => {
		render(<Badge variant="warning">Badge</Badge>);
		let badge = getBadge();
		expect(badge.classList.contains("bg-warning-100")).toBe(true);
		expect(badge.classList.contains("text-warning-800")).toBe(true);
	});
	it("applies error variant classes", () => {
		render(<Badge variant="error">Badge</Badge>);
		let badge = getBadge();
		expect(badge.classList.contains("bg-error-100")).toBe(true);
		expect(badge.classList.contains("text-error-800")).toBe(true);
	});
	it("applies info variant classes", () => {
		render(<Badge variant="info">Badge</Badge>);
		let badge = getBadge();
		expect(badge.classList.contains("bg-accent-100")).toBe(true);
		expect(badge.classList.contains("text-accent-800")).toBe(true);
	});
	it("applies sm size classes", () => {
		render(<Badge size="sm">Badge</Badge>);
		let badge = getBadge();
		expect(badge.classList.contains("px-2")).toBe(true);
		expect(badge.classList.contains("py-0.5")).toBe(true);
	});
	it("applies md size classes by default", () => {
		render(<Badge>Badge</Badge>);
		let badge = getBadge();
		expect(badge.classList.contains("px-2.5")).toBe(true);
		expect(badge.classList.contains("py-0.5")).toBe(true);
	});
	it("applies lg size classes", () => {
		render(<Badge size="lg">Badge</Badge>);
		let badge = getBadge();
		expect(badge.classList.contains("text-sm")).toBe(true);
		expect(badge.classList.contains("px-3")).toBe(true);
		expect(badge.classList.contains("py-1")).toBe(true);
	});
	it("appends custom className", () => {
		render(<Badge className="custom-badge">Badge</Badge>);
		let badge = getBadge();
		expect(badge.classList.contains("custom-badge")).toBe(true);
	});
});
