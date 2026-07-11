import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import {Footer} from "../Footer";
describe("Footer", () => {
	it("renders app name and version", () => {
		render(() => <Footer />);
		let footer=screen.getByRole("contentinfo");
		expect(footer.textContent).toContain("RandPhyQuGeA v");
	});
	it("renders copyright text", () => {
		render(() => <Footer />);
		let footer=screen.getByRole("contentinfo");
		expect(footer.textContent).toContain("2026 Richard");
	});
	it("renders GitHub link with default href", () => {
		render(() => <Footer />);
		let link=screen.getByRole("link", {name: /github/i});
		expect(link.getAttribute("href")).toContain("github.com");
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toBe("noopener noreferrer");
	});
	it("renders GitHub link with custom href", () => {
		render(() => <Footer githubUrl="https://example.com/repo" />);
		let link=screen.getByRole("link", {name: /github/i});
		expect(link.getAttribute("href")).toBe("https://example.com/repo");
	});
	it("does not render quick-action buttons without callbacks", () => {
		render(() => <Footer />);
		expect(screen.queryByRole("button", {name: /shortcuts/i})).toBeNull();
		expect(screen.queryByRole("button", {name: /settings/i})).toBeNull();
		expect(screen.queryByRole("button", {name: /theme/i})).toBeNull();
	});
	it("renders shortcuts button and fires callback", () => {
		let onOpenShortcuts=vi.fn();
		render(() => <Footer onOpenShortcuts={onOpenShortcuts} />);
		let btn=screen.getByRole("button", {name: /shortcuts/i});
		fireEvent.click(btn);
		expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
	});
	it("renders settings button and fires callback", () => {
		let onOpenSettings=vi.fn();
		render(() => <Footer onOpenSettings={onOpenSettings} />);
		let btn=screen.getByRole("button", {name: /settings/i});
		fireEvent.click(btn);
		expect(onOpenSettings).toHaveBeenCalledTimes(1);
	});
	it("renders theme toggle button with custom label and fires callback", () => {
		let onToggleTheme=vi.fn();
		render(() => <Footer onToggleTheme={onToggleTheme} themeLabel="Dim" />);
		let btn=screen.getByRole("button", {name: /dim/i});
		expect(btn.textContent).toBe("Dim");
		fireEvent.click(btn);
		expect(onToggleTheme).toHaveBeenCalledTimes(1);
	});
	it("renders footer quick links nav landmark", () => {
		render(() => <Footer />);
		expect(screen.getByRole("navigation", {name: /footer quick links/i})).toBeInTheDocument();
	});
});
