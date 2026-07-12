import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
let globalsCss=readFileSync(join(process.cwd(), "src", "solid", "styles", "globals.css"), "utf-8");
let glassCss=readFileSync(join(process.cwd(), "src", "solid", "styles", "glass.css"), "utf-8");
let indexHtml=readFileSync(join(process.cwd(), "src", "solid", "index.html"), "utf-8");
describe("system mode CSS rules target data-theme system", () => {
	it("globals.css has system dark overrides inside prefers-color-scheme dark media query", () => {
		expect(globalsCss).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[^}]*:root\[data-theme="system"\]/);
	});
	it("glass.css has system dark overrides inside prefers-color-scheme dark media query", () => {
		expect(glassCss).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?:root\[data-theme="system"\]/);
	});
});
describe("index.html inline script reads persisted theme from correct key", () => {
	it("reads from physics-quest-settings localStorage key", () => {
		expect(indexHtml).toContain('localStorage.getItem("physics-quest-settings")');
	});
	it("does not read from solid-theme localStorage key", () => {
		expect(indexHtml).not.toContain('localStorage.getItem("solid-theme")');
	});
	it("parses Zustand persist format (state.themeMode)", () => {
		expect(indexHtml).toContain("parsed.state.themeMode");
	});
	it("sets data-theme to system for system mode", () => {
		expect(indexHtml).toMatch(/attr="system"/);
	});
	it("sets data-theme to dim for dim mode", () => {
		expect(indexHtml).toMatch(/attr="dim"/);
	});
	it("does not treat dim as dark", () => {
		expect(indexHtml).not.toMatch(/mode === "dim"\s*\|\|/);
	});
	it("falls back to system on parse error", () => {
		expect(indexHtml).toMatch(/catch\(e\)\{[^}]*setAttribute\("data-theme",\s*"system"\)/);
	});
});
