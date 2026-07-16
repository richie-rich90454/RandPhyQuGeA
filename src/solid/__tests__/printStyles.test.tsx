import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
let globalsCss = readFileSync(join(process.cwd(), "src", "solid", "styles", "globals.css"), "utf-8");
describe("globals.css @media print rule (task 5.30)", () => {
	it("contains a @media print block", () => {
		expect(globalsCss).toMatch(/@media\s+print\s*\{/);
	});
	it("sets body background to white in print mode", () => {
		expect(globalsCss).toMatch(/@media\s+print\s*\{[\s\S]*?body\s*\{[\s\S]*?background:\s*#fff\s*!important/);
	});
	it("hides header, nav, footer with display none to prevent blank pages", () => {
		expect(globalsCss).toMatch(/@media\s+print\s*\{[\s\S]*?header,\s*nav,\s*footer\s*\{[\s\S]*?display:\s*none\s*!important/);
	});
});
