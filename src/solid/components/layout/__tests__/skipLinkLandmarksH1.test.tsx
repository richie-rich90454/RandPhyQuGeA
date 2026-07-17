import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {AppShell} from "../AppShell";
import {AppTopBar} from "../AppTopBar";
import {readFileSync} from "node:fs";
import {join} from "node:path";
let appShellCss = readFileSync(join(process.cwd(), "src", "solid", "components", "layout", "AppShell.module.css"), "utf-8");
let appTopBarCss = readFileSync(join(process.cwd(), "src", "solid", "components", "layout", "AppTopBar.module.css"), "utf-8");
describe("skip-link, landmarks, and single h1", () => {
    it("AppShell renders exactly one h1 as the wordmark", () => {
        render(() => (
            <AppShell toolbar={<div>Toolbar</div>}>
                <div>Main child</div>
            </AppShell>
        ));
        let headings = screen.getAllByRole("heading", {level: 1});
        expect(headings).toHaveLength(1);
        expect(headings[0]?.textContent).toBe("RandPhyQuGeA");
    });
    it("AppShell h1 wordmark lives inside the banner landmark", () => {
        render(() => (
            <AppShell toolbar={<div>Toolbar</div>}>
                <div>Main child</div>
            </AppShell>
        ));
        let banner = screen.getByRole("banner");
        let h1 = screen.getByRole("heading", {level: 1});
        expect(banner.contains(h1)).toBe(true);
    });
    it("AppShell main landmark does not override its implicit accessible name", () => {
        render(() => (
            <AppShell toolbar={<div>Toolbar</div>}>
                <div>Main child</div>
            </AppShell>
        ));
        let main = screen.getByRole("main");
        expect(main.getAttribute("aria-label")).toBeNull();
    });
    it("AppShell main landmark retains id and tabindex for skip-link target", () => {
        render(() => (
            <AppShell toolbar={<div>Toolbar</div>}>
                <div>Main child</div>
            </AppShell>
        ));
        let main = screen.getByRole("main");
        expect(main.id).toBe("main-content");
        expect(main.getAttribute("tabindex")).toBe("-1");
    });
    it("AppShell skip-link is present and targets main-content", () => {
        render(() => (
            <AppShell toolbar={<div>Toolbar</div>}>
                <div>Main child</div>
            </AppShell>
        ));
        let skipLink = screen.getByRole("link", {name: /skip to main content/i});
        expect(skipLink.getAttribute("href")).toBe("#main-content");
    });
    it("AppShell exposes banner, main, and contentinfo landmarks", () => {
        render(() => (
            <AppShell toolbar={<div>Toolbar</div>}>
                <div>Main child</div>
            </AppShell>
        ));
        expect(screen.getByRole("banner")).toBeInTheDocument();
        expect(screen.getByRole("main")).toBeInTheDocument();
        expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });
    it("AppTopBar wordmark is an h1 element", () => {
        render(() => <AppTopBar />);
        let h1 = screen.getByRole("heading", {level: 1});
        expect(h1.tagName).toBe("H1");
        expect(h1.textContent).toBe("RandPhyQuGeA");
    });
    it("AppTopBar wordmark link retains its accessible name", () => {
        render(() => <AppTopBar />);
        expect(screen.getByRole("link", {name: /RandPhyQuGeA home/i})).toBeInTheDocument();
    });
    it("AppShell.module.css positions skip-link off-screen until focused", () => {
        expect(appShellCss).toContain(".skipLink");
        expect(appShellCss).toMatch(/\.skipLink\s*\{[^}]*top:\s*-100px/);
        expect(appShellCss).toMatch(/\.skipLink:focus\s*\{[^}]*top:\s*0/);
    });
    it("AppTopBar.module.css resets h1 default margin on .text", () => {
        expect(appTopBarCss).toMatch(/\.text\s*\{[^}]*margin:\s*0/);
    });
});
