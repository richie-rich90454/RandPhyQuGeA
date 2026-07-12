import {describe, it, expect} from "vitest";
import {readFileSync, readdirSync} from "node:fs";
import {join, relative} from "node:path";
let solidDir=join(process.cwd(), "src", "solid");
function collectSourceFiles(dir: string): string[] {
	let entries=readdirSync(dir, {withFileTypes: true});
	let files: string[]=[];
	for (let entry of entries) {
		let fullPath=join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectSourceFiles(fullPath));
		} else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
			files.push(fullPath);
		}
	}
	return files;
}
let allFiles=collectSourceFiles(solidDir);
describe("no window.confirm usage (task 5.33)", () => {
	it("SolidJS source never calls window.confirm or globalThis.confirm", () => {
		let violations: string[]=[];
		for (let file of allFiles) {
			let content=readFileSync(file, "utf-8");
			if (/window\.confirm\s*\(/.test(content) || /globalThis\.confirm\s*\(/.test(content)) {
				violations.push(relative(process.cwd(), file));
			}
		}
		expect(violations, `Found window.confirm/globalThis.confirm calls in: ${violations.join(", ")}`).toEqual([]);
	});
	it("ConfirmDialog is exported from the ui barrel for in-app confirmations", () => {
		let barrel=readFileSync(join(solidDir, "components", "ui", "index.ts"), "utf-8");
		expect(barrel).toMatch(/export\s+\{[^}]*ConfirmDialog[^}]*\}/);
	});
});
