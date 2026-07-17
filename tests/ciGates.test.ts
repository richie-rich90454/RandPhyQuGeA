import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
let root = process.cwd();
function readText(rel: string): string {
    return readFileSync(resolve(root, rel), "utf-8");
}
describe("CI gates on PR (task 5.39)", () => {
    it("code-quality workflow runs build and coverage gates on pull requests (preventive fix)", () => {
        let yml = readText(".github/workflows/code-quality.yml");
        expect(yml).toMatch(/on:/);
        expect(yml).toMatch(/pull_request:/);
        expect(yml).toMatch(/npm run build/);
        expect(yml).toMatch(/npm run test:coverage/);
    });
    it("vitest config has coverage thresholds so coverage is a real gate (preventive fix)", () => {
        let config = readText("vitest.config.ts");
        expect(config).toMatch(/thresholds/);
        expect(config).toMatch(/lines:\s*\d+/);
        expect(config).toMatch(/branches:\s*\d+/);
        expect(config).toMatch(/functions:\s*\d+/);
        expect(config).toMatch(/statements:\s*\d+/);
    });
    it("code-quality and version-bump workflows cache npm dependencies (preventive fix)", () => {
        let cq = readText(".github/workflows/code-quality.yml");
        let vb = readText(".github/workflows/version-bump.yml");
        expect(cq).toMatch(/cache:\s*"npm"/);
        expect(vb).toMatch(/cache:\s*"npm"/);
    });
    it("version-bump workflow regenerates package-lock.json after bumping version (preventive fix)", () => {
        let yml = readText(".github/workflows/version-bump.yml");
        expect(yml).toMatch(/npm install --package-lock-only/);
        expect(yml).toMatch(/npm version/);
    });
});
