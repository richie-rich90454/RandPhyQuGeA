import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Button} from "../Button";
describe("Button", () => {
	it("renders children as the accessible name", () => {
		render(() => <Button>Click me</Button>);
		expect(screen.getByRole("button", {name: /click me/i})).toBeInTheDocument();
	});
	it("defaults to type button", () => {
		render(() => <Button>Save</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("type", "button");
	});
	it("calls onClick handler when clicked", () => {
		let handler=vi.fn();
		render(() => <Button onClick={handler}>Click</Button>);
		fireEvent.click(screen.getByRole("button"));
		expect(handler).toHaveBeenCalledTimes(1);
	});
	it("is disabled and shows spinner when loading", () => {
		render(() => <Button loading={true}>Loading</Button>);
		let button=screen.getByRole("button");
		expect(button).toBeDisabled();
		expect(button.querySelector("[aria-hidden='true']")).toBeInTheDocument();
	});
	it("is disabled when isLoading is true", () => {
		render(() => <Button isLoading={true}>Loading</Button>);
		expect(screen.getByRole("button")).toBeDisabled();
	});
	it("is disabled when disabled prop is set", () => {
		render(() => <Button disabled={true}>Nope</Button>);
		expect(screen.getByRole("button")).toBeDisabled();
	});
	it("renders left and right icons when provided", () => {
		render(() => <Button leftIcon={<span data-testid="left">L</span>} rightIcon={<span data-testid="right">R</span>}>Text</Button>);
		expect(screen.getByTestId("left")).toBeInTheDocument();
		expect(screen.getByTestId("right")).toBeInTheDocument();
	});
	it("does not render icons while loading", () => {
		render(() => <Button loading={true} leftIcon={<span data-testid="left">L</span>}>Text</Button>);
		expect(screen.queryByTestId("left")).not.toBeInTheDocument();
	});
});
describe("Button aria-busy (task 5.32)", () => {
	it("sets aria-busy to true when loading is true", () => {
		render(() => <Button loading={true}>Saving</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
	});
	it("sets aria-busy to false when not loading", () => {
		render(() => <Button loading={false}>Save</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "false");
	});
	it("sets aria-busy to true when deprecated isLoading is true", () => {
		render(() => <Button isLoading={true}>Saving</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
	});
	it("respects a consumer-passed aria-busy over the loading-derived value", () => {
		render(() => <Button loading={true} aria-busy={false}>Custom</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "false");
	});
	it("does not set aria-busy when no loading state is provided", () => {
		render(() => <Button>Idle</Button>);
		expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "false");
	});
});
