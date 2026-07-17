import {describe, it, expect} from "vitest";
import {execSync} from "node:child_process";
import {readFileSync, existsSync} from "node:fs";
import {resolve} from "node:path";
let root = process.cwd();
function gitLsFiles(): string {
    return execSync("git ls-files", {cwd: root, encoding: "utf-8"});
}
describe("repo hygiene (task 5.35)", () => {
    it(".gitignore does not blanket-ignore Cargo.lock for the Tauri binary app", () => {
        let gitignore = readFileSync(resolve(root, ".gitignore"), "utf-8");
        let lines = gitignore.split(/\r?\n/);
        let blanketCargoLock = lines.some(line => {
            let trimmed = line.trim();
            return trimmed === "Cargo.lock" || trimmed === "/Cargo.lock";
        });
        expect(blanketCargoLock).toBe(false);
    });
    it("src-tauri/Cargo.lock is committed and present on disk", () => {
        let tracked = gitLsFiles().split(/\r?\n/);
        expect(tracked).toContain("src-tauri/Cargo.lock");
        expect(existsSync(resolve(root, "src-tauri", "Cargo.lock"))).toBe(true);
    });
    it("no stale target/ directory is tracked by git", () => {
        let tracked = gitLsFiles().split(/\r?\n/);
        let underTarget = tracked.filter(p => p.split(/[\\/]/).includes("target"));
        expect(underTarget).toEqual([]);
    });
});
