import {describe, it, expect} from "vitest";
import {readFileSync, existsSync} from "node:fs";
import {resolve} from "node:path";
let root=process.cwd();
function readText(rel: string): string {
	return readFileSync(resolve(root, rel), "utf-8");
}
describe("license consistency (task 5.37)", () => {
	it("LICENSE file declares Apache 2.0", () => {
		expect(existsSync(resolve(root, "LICENSE"))).toBe(true);
		let license=readText("LICENSE");
		expect(license).toMatch(/Apache License/);
		expect(license).toMatch(/Version 2\.0/);
	});
	it("package.json declares Apache-2.0 license matching the LICENSE file", () => {
		let pkg=JSON.parse(readText("package.json")) as {license?: string};
		expect(pkg.license).toBe("Apache-2.0");
	});
	it("src-tauri/Cargo.toml declares Apache-2.0 license matching the LICENSE file", () => {
		let cargo=readText("src-tauri/Cargo.toml");
		expect(cargo).toMatch(/^license\s*=\s*"Apache-2\.0"/m);
	});
});
