import {describe, it, expect, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {Button} from "../Button";
function getButton(): HTMLButtonElement {
	return screen.getByRole<HTMLButtonElement>("button");
}
describe("Button", () => {
	it("renders with default variant", () => {
		render(<Button>Save</Button>);
		const button=getButton();
		expect(button.tagName).toBe("BUTTON");
		expect(button.classList.contains("primary-button")).toBe(true);
		expect(button.classList.contains("bg-accent-600")).toBe(true);
		expect(button.classList.contains("h-9")).toBe(true);
	});
	it("applies primary variant classes", () => {
		render(<Button variant="primary">Primary</Button>);
		const button=getButton();
		expect(button.classList.contains("primary-button")).toBe(true);
		expect(button.classList.contains("bg-accent-600")).toBe(true);
		expect(button.classList.contains("!active:scale-[0.98]")).toBe(true);
	});
	it("applies secondary variant classes", () => {
		render(<Button variant="secondary">Secondary</Button>);
		const button=getButton();
		expect(button.classList.contains("secondary-button")).toBe(true);
		expect(button.classList.contains("bg-surface")).toBe(true);
		expect(button.classList.contains("text-text-primary")).toBe(true);
	});
	it("applies ghost variant classes", () => {
		render(<Button variant="ghost">Ghost</Button>);
		const button=getButton();
		expect(button.classList.contains("bg-transparent")).toBe(true);
		expect(button.classList.contains("text-text-secondary")).toBe(true);
	});
	it("applies danger variant classes", () => {
		render(<Button variant="danger">Danger</Button>);
		const button=getButton();
		expect(button.classList.contains("bg-danger")).toBe(true);
		expect(button.classList.contains("text-white")).toBe(true);
		expect(button.classList.contains("!active:scale-[0.98]")).toBe(true);
	});
	it("applies icon variant classes", () => {
		render(<Button variant="icon" aria-label="Close">X</Button>);
		const button=getButton();
		expect(button.classList.contains("icon-button")).toBe(true);
		expect(button.classList.contains("!active:scale-95")).toBe(true);
		expect(button.classList.contains("h-8")).toBe(true);
		expect(button.classList.contains("w-8")).toBe(true);
	});
	it("applies xs size classes", () => {
		render(<Button size="xs">Tiny</Button>);
		const button=getButton();
		expect(button.classList.contains("h-7")).toBe(true);
		expect(button.classList.contains("text-xs")).toBe(true);
	});
	it("applies sm size classes", () => {
		render(<Button size="sm">Small</Button>);
		const button=getButton();
		expect(button.classList.contains("h-8")).toBe(true);
		expect(button.classList.contains("text-sm")).toBe(true);
	});
	it("applies md size classes by default", () => {
		render(<Button>Default</Button>);
		const button=getButton();
		expect(button.classList.contains("h-9")).toBe(true);
		expect(button.classList.contains("px-3")).toBe(true);
	});
	it("applies lg size classes", () => {
		render(<Button size="lg">Large</Button>);
		const button=getButton();
		expect(button.classList.contains("h-10")).toBe(true);
		expect(button.classList.contains("text-base")).toBe(true);
	});
	it("shows spinner and disables button when loading", () => {
		render(<Button loading>Save</Button>);
		const button=getButton();
		expect(button.disabled).toBe(true);
		expect(document.querySelector("svg")).not.toBeNull();
	});
	it("preserves width in loading state by keeping children in flow", () => {
		render(<Button loading>Save</Button>);
		const content=screen.getByText("Save");
		expect(content.classList.contains("invisible")).toBe(true);
		expect(document.querySelector("svg")).not.toBeNull();
	});
	it("renders leftIcon", () => {
		render(<Button leftIcon={<span data-testid="left-icon">L</span>}>Label</Button>);
		expect(screen.getByTestId("left-icon")).toBeDefined();
	});
	it("renders rightIcon", () => {
		render(<Button rightIcon={<span data-testid="right-icon">R</span>}>Label</Button>);
		expect(screen.getByTestId("right-icon")).toBeDefined();
	});
	it("fires onClick when not disabled or loading", () => {
		const handleClick=vi.fn<() => void>();
		render(<Button onClick={handleClick}>Click</Button>);
		getButton().click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});
	it("prevents onClick when disabled", () => {
		const handleClick=vi.fn<() => void>();
		render(<Button disabled onClick={handleClick}>Click</Button>);
		getButton().click();
		expect(handleClick).not.toHaveBeenCalled();
	});
	it("prevents onClick when loading", () => {
		const handleClick=vi.fn<() => void>();
		render(<Button loading onClick={handleClick}>Click</Button>);
		getButton().click();
		expect(handleClick).not.toHaveBeenCalled();
	});
	it("supports isLoading as a backwards-compatible alias", () => {
		render(<Button isLoading>Save</Button>);
		const button=getButton();
		expect(button.disabled).toBe(true);
		expect(document.querySelector("svg")).not.toBeNull();
	});
	it("prefers loading over isLoading when both are provided", () => {
		render(<Button loading={false} isLoading={true}>Save</Button>);
		const button=getButton();
		expect(button.disabled).toBe(false);
		expect(document.querySelector("svg")).toBeNull();
	});
});
