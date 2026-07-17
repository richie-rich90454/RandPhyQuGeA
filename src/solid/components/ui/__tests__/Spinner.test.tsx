import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {Spinner} from "../Spinner";
describe("Spinner", () => {
    it("renders a spinner element", () => {
        let {container} = render(() => <Spinner />);
        expect(container.querySelector("div")).not.toBeNull();
    });
    it("is aria-hidden when not standalone", () => {
        render(() => <Spinner />);
        let el = document.querySelector("[aria-hidden='true']");
        expect(el).not.toBeNull();
    });
    it("has role status when standalone", () => {
        render(() => <Spinner standalone={true} />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });
    it("renders loading text when standalone", () => {
        render(() => <Spinner standalone={true} />);
        expect(screen.getByText("Loading")).toBeInTheDocument();
    });
    it("applies size via inline style for sm", () => {
        render(() => <Spinner size="sm" />);
        let el = document.querySelector("[aria-hidden='true']") as HTMLElement;
        expect(el.style.width).toBe("16px");
        expect(el.style.height).toBe("16px");
    });
    it("applies size via inline style for md", () => {
        render(() => <Spinner size="md" />);
        let el = document.querySelector("[aria-hidden='true']") as HTMLElement;
        expect(el.style.width).toBe("24px");
        expect(el.style.height).toBe("24px");
    });
    it("applies size via inline style for lg", () => {
        render(() => <Spinner size="lg" />);
        let el = document.querySelector("[aria-hidden='true']") as HTMLElement;
        expect(el.style.width).toBe("32px");
        expect(el.style.height).toBe("32px");
    });
    it("defaults to md size", () => {
        render(() => <Spinner />);
        let el = document.querySelector("[aria-hidden='true']") as HTMLElement;
        expect(el.style.width).toBe("24px");
    });
});
