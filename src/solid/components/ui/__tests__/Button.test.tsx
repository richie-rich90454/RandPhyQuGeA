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
