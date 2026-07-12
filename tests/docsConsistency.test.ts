import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
let root=process.cwd();
function readText(rel: string): string {
	return readFileSync(resolve(root, rel), "utf-8");
}
describe("docs describe SolidJS stack (task 5.38)", () => {
	it("README dev command comment does not mislabel the root entry as React", () => {
		let readme=readText("README.md");
		let devLine=readme.split(/\r?\n/).find(l => l.includes("npm run dev") && l.includes("#"));
		expect(devLine, "README must document npm run dev").toBeDefined();
		expect(devLine ? devLine.includes("React root entry") : true).toBe(false);
		expect(devLine ? devLine.includes("Solid root entry") : false).toBe(true);
	});
	it("CHANGELOG prior-polish-pass section describes the current stack as SolidJS, not React 19", () => {
		let changelog=readText("CHANGELOG.md");
		let priorSection=changelog.split("#### Prior polish pass")[1] || changelog;
		let introLine=priorSection.split(/\r?\n/).find(l => l.includes("stack is in place"));
		expect(introLine, "CHANGELOG must describe the stack").toBeDefined();
		expect(introLine ? introLine.includes("React 19 + Vite 8") : false).toBe(false);
		expect(introLine ? introLine.includes("SolidJS") : false).toBe(true);
	});
});
