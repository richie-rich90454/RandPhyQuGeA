import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {EmptyState} from "../EmptyState";
describe("EmptyState", () => {
	it("renders title", () => {
		render(<EmptyState title="No results" />);
		expect(screen.getByRole("heading", {name: "No results"})).toBeDefined();
	});
	it("renders description", () => {
		render(<EmptyState title="No results" description="Try adjusting your filters." />);
		expect(screen.getByText("Try adjusting your filters.")).toBeDefined();
	});
	it("renders illustration slot", () => {
		render(<EmptyState title="No results" illustration={<span data-testid="illustration">Art</span>} />);
		expect(screen.getByTestId("illustration")).toBeDefined();
	});
	it("renders icon prop as fallback", () => {
		render(<EmptyState title="No results" icon={<span data-testid="icon">Icon</span>} />);
		expect(screen.getByTestId("icon")).toBeDefined();
	});
	it("prefers illustration over icon when both are provided", () => {
		render(
			<EmptyState
				title="No results"
				illustration={<span data-testid="illustration">Art</span>}
				icon={<span data-testid="icon">Icon</span>}
			/>,
		);
		expect(screen.getByTestId("illustration")).toBeDefined();
		expect(screen.queryByTestId("icon")).toBeNull();
	});
	it("renders action slot", () => {
		render(<EmptyState title="No results" action={<button data-testid="action">Retry</button>} />);
		expect(screen.getByTestId("action")).toBeDefined();
	});
	it("applies custom className", () => {
		const {container}=render(<EmptyState title="No results" className="my-custom-class" />);
		expect(container.firstElementChild?.classList.contains("my-custom-class")).toBe(true);
	});
	it("hides decorative media from screen readers", () => {
		render(<EmptyState title="No results" illustration={<span data-testid="illustration">Art</span>} />);
		const wrapper=screen.getByTestId("illustration").parentElement;
		expect(wrapper?.getAttribute("aria-hidden")).toBe("true");
	});
});
