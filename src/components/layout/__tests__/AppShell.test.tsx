import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {AppShell} from "../AppShell";
import {ToastProvider} from "../../ui";
import {ServiceProvider} from "../../providers/ServiceProvider";
function wrapper({children}: {children?: React.ReactNode}) {
	return (
		<ToastProvider>
			<ServiceProvider>{children}</ServiceProvider>
		</ToastProvider>
	);
}
describe("AppShell", () => {
	it("renders skip-link targeting main content", () => {
		render(
			<AppShell>
				<div>Toolbar</div>
				<div>Main child</div>
			</AppShell>,
			{wrapper},
		);
		const skipLink=screen.getByRole("link", {name: /skip to main content/i});
		expect(skipLink.getAttribute("href")).toBe("#main-content");
	});
	it("renders top navigation bar with wordmark and global actions", () => {
		render(
			<AppShell>
				<div>Toolbar</div>
				<div>Main child</div>
			</AppShell>,
			{wrapper},
		);
		expect(screen.getByText("RandPhyQuGeA")).toBeDefined();
		expect(screen.getByLabelText("Primary actions")).toBeDefined();
	});
	it("renders main landmark with id main-content", () => {
		render(
			<AppShell>
				<div>Toolbar</div>
				<div>Main child</div>
			</AppShell>,
			{wrapper},
		);
		const main=screen.getByRole("main");
		expect(main.id).toBe("main-content");
		expect(main.getAttribute("tabindex")).toBe("-1");
	});
	it("renders footer with version and copyright", () => {
		render(
			<AppShell>
				<div>Toolbar</div>
				<div>Main child</div>
			</AppShell>,
			{wrapper},
		);
		const footer=screen.getByRole("contentinfo");
		expect(footer.textContent).toContain("RandPhyQuGeA v");
		expect(footer.textContent).toContain("2026 Richard");
	});
	it("renders toolbar as first child and remaining children inside main", () => {
		render(
			<AppShell>
				<div data-testid="toolbar">Toolbar</div>
				<div data-testid="main-child">Main child</div>
			</AppShell>,
			{wrapper},
		);
		expect(screen.getByTestId("toolbar")).toBeDefined();
		const main=screen.getByRole("main");
		expect(main.contains(screen.getByTestId("main-child"))).toBe(true);
	});
});