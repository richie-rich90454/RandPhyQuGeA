import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {Badge} from "../Badge";
describe("Badge", () => {
	it("renders children text", () => {
		render(() => <Badge>New</Badge>);
		expect(screen.getByText("New")).toBeInTheDocument();
	});
	it("applies default variant class", () => {
		render(() => <Badge>Default</Badge>);
		expect(screen.getByText("Default")).toHaveClass(/default/);
	});
	it("applies success variant class", () => {
		render(() => <Badge variant="success">Saved</Badge>);
		expect(screen.getByText("Saved")).toHaveClass(/success/);
	});
	it("applies error variant class", () => {
		render(() => <Badge variant="error">Failed</Badge>);
		expect(screen.getByText("Failed")).toHaveClass(/error/);
	});
	it("applies warning variant class", () => {
		render(() => <Badge variant="warning">Pending</Badge>);
		expect(screen.getByText("Pending")).toHaveClass(/warning/);
	});
	it("applies info variant class", () => {
		render(() => <Badge variant="info">Info</Badge>);
		expect(screen.getByText("Info")).toHaveClass(/info/);
	});
	it("applies size class", () => {
		render(() => <Badge size="lg">Big</Badge>);
		expect(screen.getByText("Big")).toHaveClass(/lg/);
	});
	it("renders as a span element", () => {
		render(() => <Badge>Span</Badge>);
		expect(screen.getByText("Span").tagName).toBe("SPAN");
	});
});
