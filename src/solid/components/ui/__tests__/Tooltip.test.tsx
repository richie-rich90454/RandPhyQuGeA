import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Tooltip} from "../Tooltip";
import {TooltipTrigger} from "../Tooltip";
import {TooltipContent} from "../Tooltip";
describe("Tooltip", () => {
	it("does not render content when closed", () => {
		render(() => (
			<Tooltip>
				<TooltipTrigger>Hover me</TooltipTrigger>
				<TooltipContent>Tip text</TooltipContent>
			</Tooltip>
		));
		expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
	});
	it("renders content when controlled open is true", () => {
		render(() => (
			<Tooltip open={true}>
				<TooltipTrigger>Hover me</TooltipTrigger>
				<TooltipContent>Tip text</TooltipContent>
			</Tooltip>
		));
		expect(screen.getByRole("tooltip")).toBeInTheDocument();
		expect(screen.getByText("Tip text")).toBeInTheDocument();
	});
	it("shows on trigger focus", () => {
		render(() => (
			<Tooltip delay={0}>
				<TooltipTrigger>Hover me</TooltipTrigger>
				<TooltipContent>Tip text</TooltipContent>
			</Tooltip>
		));
		fireEvent.focus(screen.getByText("Hover me"));
		expect(screen.getByRole("tooltip")).toBeInTheDocument();
	});
	it("hides on trigger blur", () => {
		render(() => (
			<Tooltip delay={0} defaultOpen={true}>
				<TooltipTrigger>Hover me</TooltipTrigger>
				<TooltipContent>Tip text</TooltipContent>
			</Tooltip>
		));
		expect(screen.getByRole("tooltip")).toBeInTheDocument();
		fireEvent.blur(screen.getByText("Hover me"));
		expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
	});
	it("calls onOpenChange when open changes", () => {
		let handler = vi.fn<(open: boolean) => void>();
		render(() => (
			<Tooltip delay={0} onOpenChange={handler}>
				<TooltipTrigger>Hover me</TooltipTrigger>
				<TooltipContent>Tip text</TooltipContent>
			</Tooltip>
		));
		fireEvent.focus(screen.getByText("Hover me"));
		expect(handler).toHaveBeenCalledWith(true);
		fireEvent.blur(screen.getByText("Hover me"));
		expect(handler).toHaveBeenCalledWith(false);
	});
	it("links trigger via aria-describedby when open", () => {
		render(() => (
			<Tooltip open={true}>
				<TooltipTrigger>Hover me</TooltipTrigger>
				<TooltipContent>Tip text</TooltipContent>
			</Tooltip>
		));
		let trigger = screen.getByText("Hover me");
		let tooltip = screen.getByRole("tooltip");
		expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
	});
	it("supports defaultOpen for uncontrolled initial state", () => {
		render(() => (
			<Tooltip defaultOpen={true}>
				<TooltipTrigger>Hover me</TooltipTrigger>
				<TooltipContent>Tip text</TooltipContent>
			</Tooltip>
		));
		expect(screen.getByRole("tooltip")).toBeInTheDocument();
	});
});
