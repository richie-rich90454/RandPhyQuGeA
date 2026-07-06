import {describe, it, expect, vi} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import {Toolbar} from "../Toolbar";
function getItem(index: number): HTMLButtonElement {
	const items = screen.getAllByRole<HTMLButtonElement>("button");
	const item = items[index];
	expect(item).toBeDefined();
	return item!;
}
describe("Toolbar", () => {
	it("renders toolbar with accessible label", () => {
		render(<Toolbar label="Main toolbar"><Toolbar.Item>One</Toolbar.Item></Toolbar>);
		const toolbar = screen.getByRole("toolbar");
		expect(toolbar.getAttribute("aria-label")).toBe("Main toolbar");
	});
	it("renders group with accessible label", () => {
		render(
			<Toolbar>
				<Toolbar.Group label="Actions">
					<Toolbar.Item>Cut</Toolbar.Item>
					<Toolbar.Item>Copy</Toolbar.Item>
				</Toolbar.Group>
			</Toolbar>
		);
		const group = screen.getByRole("group");
		expect(group.getAttribute("aria-label")).toBe("Actions");
	});
	it("renders separator with vertical orientation", () => {
		render(
			<Toolbar>
				<Toolbar.Item>A</Toolbar.Item>
				<Toolbar.Separator />
				<Toolbar.Item>B</Toolbar.Item>
			</Toolbar>
		);
		const separators = screen.getAllByRole("separator");
		expect(separators.length).toBe(1);
		const separator = separators[0];
		expect(separator).toBeDefined();
		expect(separator!.getAttribute("aria-orientation")).toBe("vertical");
	});
	it("uses roving tabIndex: only first item is tabbable by default", () => {
		render(
			<Toolbar>
				<Toolbar.Item>One</Toolbar.Item>
				<Toolbar.Item>Two</Toolbar.Item>
				<Toolbar.Item>Three</Toolbar.Item>
			</Toolbar>
		);
		expect(getItem(0).tabIndex).toBe(0);
		expect(getItem(1).tabIndex).toBe(-1);
		expect(getItem(2).tabIndex).toBe(-1);
	});
	it("arrow right moves focus and roving tabIndex to next item", () => {
		render(
			<Toolbar>
				<Toolbar.Item>One</Toolbar.Item>
				<Toolbar.Item>Two</Toolbar.Item>
				<Toolbar.Item>Three</Toolbar.Item>
			</Toolbar>
		);
		getItem(0).focus();
		fireEvent.keyDown(getItem(0), {key: "ArrowRight"});
		expect(document.activeElement).toBe(getItem(1));
		expect(getItem(0).tabIndex).toBe(-1);
		expect(getItem(1).tabIndex).toBe(0);
	});
	it("arrow left wraps focus to last item", () => {
		render(
			<Toolbar>
				<Toolbar.Item>One</Toolbar.Item>
				<Toolbar.Item>Two</Toolbar.Item>
				<Toolbar.Item>Three</Toolbar.Item>
			</Toolbar>
		);
		getItem(0).focus();
		fireEvent.keyDown(getItem(0), {key: "ArrowLeft"});
		expect(document.activeElement).toBe(getItem(2));
	});
	it("Home moves focus to first item", () => {
		render(
			<Toolbar>
				<Toolbar.Item>One</Toolbar.Item>
				<Toolbar.Item>Two</Toolbar.Item>
				<Toolbar.Item>Three</Toolbar.Item>
			</Toolbar>
		);
		getItem(2).focus();
		fireEvent.keyDown(getItem(2), {key: "Home"});
		expect(document.activeElement).toBe(getItem(0));
	});
	it("End moves focus to last item", () => {
		render(
			<Toolbar>
				<Toolbar.Item>One</Toolbar.Item>
				<Toolbar.Item>Two</Toolbar.Item>
				<Toolbar.Item>Three</Toolbar.Item>
			</Toolbar>
		);
		getItem(0).focus();
		fireEvent.keyDown(getItem(0), {key: "End"});
		expect(document.activeElement).toBe(getItem(2));
	});
	it("fires item onClick", () => {
		const handleClick = vi.fn<() => void>();
		render(
			<Toolbar>
				<Toolbar.Item onClick={handleClick}>Action</Toolbar.Item>
			</Toolbar>
		);
		getItem(0).click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});
	it("respects active state via aria-pressed", () => {
		render(
			<Toolbar>
				<Toolbar.Item active>Bold</Toolbar.Item>
			</Toolbar>
		);
		const item = getItem(0);
		expect(item.getAttribute("aria-pressed")).toBe("true");
		expect(item.classList.contains("bg-accent-600")).toBe(true);
	});
});
