import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {AppShell} from "../AppShell";
describe("AppShell", () => {
	it("renders skip-link targeting main content", () => {
		render(() => (
			<AppShell toolbar={<div>Toolbar</div>}>
				<div>Main child</div>
			</AppShell>
		));
		let skipLink=screen.getByRole("link", {name: /skip to main content/i});
		expect(skipLink.getAttribute("href")).toBe("#main-content");
	});
	it("renders top navigation bar with wordmark", () => {
		render(() => (
			<AppShell toolbar={<div>Toolbar</div>}>
				<div>Main child</div>
			</AppShell>
		));
		expect(screen.getByText("RandPhyQuGeA")).toBeInTheDocument();
	});
	it("renders main landmark with id main-content", () => {
		render(() => (
			<AppShell toolbar={<div>Toolbar</div>}>
				<div>Main child</div>
			</AppShell>
		));
		let main=screen.getByRole("main");
		expect(main.id).toBe("main-content");
		expect(main.getAttribute("tabindex")).toBe("-1");
	});
	it("renders footer with version and copyright", () => {
		render(() => (
			<AppShell toolbar={<div>Toolbar</div>}>
				<div>Main child</div>
			</AppShell>
		));
		let footer=screen.getByRole("contentinfo");
		expect(footer.textContent).toContain("RandPhyQuGeA v");
		expect(footer.textContent).toContain("2026 Richard");
	});
	it("renders toolbar above main and children inside main", () => {
		render(() => (
			<AppShell toolbar={<div data-testid="toolbar">Toolbar</div>}>
				<div data-testid="main-child">Main child</div>
			</AppShell>
		));
		expect(screen.getByTestId("toolbar")).toBeInTheDocument();
		let main=screen.getByRole("main");
		expect(main.contains(screen.getByTestId("main-child"))).toBe(true);
	});
});
