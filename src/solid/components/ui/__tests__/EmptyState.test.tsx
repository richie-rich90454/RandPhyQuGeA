import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {EmptyState} from "../EmptyState";
describe("EmptyState", () => {
    it("renders the title", () => {
        render(() => <EmptyState title="No results" />);
        expect(screen.getByText("No results")).toBeInTheDocument();
    });
    it("renders title as h3", () => {
        render(() => <EmptyState title="No results" />);
        expect(screen.getByText("No results").tagName).toBe("H3");
    });
    it("renders the title as an accessible heading with the correct level (task 5.49, preventive fix)", () => {
        render(() => <EmptyState title="No results" description="Try again" />);
        let heading = screen.getByRole("heading", {name: "No results", level: 3});
        expect(heading).toBeInTheDocument();
        expect(heading.tagName).toBe("H3");
    });
    it("renders description when provided", () => {
        render(() => <EmptyState title="No results" description="Try adjusting filters" />);
        expect(screen.getByText("Try adjusting filters")).toBeInTheDocument();
    });
    it("does not render description when not provided", () => {
        render(() => <EmptyState title="No results" />);
        expect(screen.queryByText("Try adjusting filters")).not.toBeInTheDocument();
    });
    it("renders illustration when provided", () => {
        render(() => <EmptyState title="No results" illustration={<span data-testid="illus">I</span>} />);
        expect(screen.getByTestId("illus")).toBeInTheDocument();
    });
    it("renders legacy icon when illustration not provided", () => {
        render(() => <EmptyState title="No results" icon={<span data-testid="icon">I</span>} />);
        expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
    it("prefers illustration over icon", () => {
        render(() => <EmptyState title="No results" illustration={<span data-testid="illus">I</span>} icon={<span data-testid="icon">I</span>} />);
        expect(screen.getByTestId("illus")).toBeInTheDocument();
        expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    });
    it("renders action when provided", () => {
        render(() => <EmptyState title="No results" action={<button type="button">Reset</button>} />);
        expect(screen.getByText("Reset")).toBeInTheDocument();
    });
    it("does not render action when not provided", () => {
        render(() => <EmptyState title="No results" />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
