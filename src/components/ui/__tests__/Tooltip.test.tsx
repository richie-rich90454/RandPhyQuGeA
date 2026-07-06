import {describe, it, expect, vi} from "vitest";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {Tooltip} from "../Tooltip";
function renderTooltip(props: {defaultOpen?: boolean; delay?: number; controlledOpen?: boolean; onOpenChange?: (open: boolean) => void}={}) {
	const {defaultOpen, delay, controlledOpen, onOpenChange}=props;
	return render(
		<Tooltip open={controlledOpen} defaultOpen={defaultOpen} onOpenChange={onOpenChange} delay={delay ?? 0}>
			<Tooltip.Trigger>
				<button type="button">Hover me</button>
			</Tooltip.Trigger>
			<Tooltip.Content>Tooltip content</Tooltip.Content>
		</Tooltip>,
	);
}
describe("Tooltip", () => {
	it("renders trigger", () => {
		renderTooltip();
		expect(screen.getByRole("button", {name: "Hover me"})).toBeDefined();
	});
	it("shows content when defaultOpen is true", () => {
		renderTooltip({defaultOpen: true});
		expect(screen.getByRole("tooltip")).toBeDefined();
		expect(screen.getByText("Tooltip content")).toBeDefined();
	});
	it("opens on mouse enter after delay", async () => {
		renderTooltip();
		const trigger=screen.getByRole("button", {name: "Hover me"});
		fireEvent.mouseEnter(trigger);
		await waitFor(() => {
			expect(screen.queryByRole("tooltip")).not.toBeNull();
		});
	});
	it("closes on mouse leave", async () => {
		renderTooltip({defaultOpen: true});
		const trigger=screen.getByRole("button", {name: "Hover me"});
		fireEvent.mouseLeave(trigger);
		await waitFor(() => {
			expect(screen.queryByRole("tooltip")).toBeNull();
		});
	});
	it("opens on focus and closes on blur", async () => {
		renderTooltip();
		const trigger=screen.getByRole("button", {name: "Hover me"});
		fireEvent.focus(trigger);
		await waitFor(() => {
			expect(screen.queryByRole("tooltip")).not.toBeNull();
		});
		fireEvent.blur(trigger);
		await waitFor(() => {
			expect(screen.queryByRole("tooltip")).toBeNull();
		});
	});
	it("calls onOpenChange in controlled mode", async () => {
		const handleChange=vi.fn<(open: boolean) => void>();
		renderTooltip({controlledOpen: false, onOpenChange: handleChange});
		const trigger=screen.getByRole("button", {name: "Hover me"});
		fireEvent.focus(trigger);
		await waitFor(() => {
			expect(handleChange).toHaveBeenCalledWith(true);
		});
	});
	it("portals content to document body", () => {
		const {container}=renderTooltip({defaultOpen: true});
		expect(container.contains(screen.getByRole("tooltip"))).toBe(false);
		expect(document.body.contains(screen.getByRole("tooltip"))).toBe(true);
	});
	it("sets aria-describedby on trigger when open", () => {
		renderTooltip({defaultOpen: true});
		const trigger=screen.getByRole("button", {name: "Hover me"});
		const tooltip=screen.getByRole("tooltip");
		expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
	});
});
