import {describe, it, expect} from "vitest";
import {readFileSync, existsSync, readdirSync} from "node:fs";
import {resolve, join} from "node:path";
let root = process.cwd();
function readText(rel: string): string {
    return readFileSync(resolve(root, rel), "utf-8");
}
describe("asset references (task 5.36)", () => {
    it("src/solid/main.tsx imports @fontsource/noto-sans so @font-face rules load", () => {
        let main = readText("src/solid/main.tsx");
        expect(main).toMatch(/@fontsource\/noto-sans\/400\.css/);
        expect(main).toMatch(/@fontsource\/noto-sans\/700\.css/);
        expect(main).toMatch(/@fontsource\/noto-sans-mono\/400\.css/);
        expect(main).toMatch(/@fontsource\/noto-sans-mono\/700\.css/);
    });
    it("HTML favicon refs resolve to existing files", () => {
        let htmlFiles = ["index.html", "src/solid/index.html"];
        for (let rel of htmlFiles) {
            let html = readText(rel);
            let match = html.match(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/);
            expect(match, rel + ' must declare a <link rel="icon"> favicon').not.toBeNull();
            let href = match ? match[1] : "";
            expect(href).toBe("/favicon.svg");
            expect(existsSync(resolve(root, "public", "favicon.svg"))).toBe(true);
        }
    });
    it('no <link rel="preload"> font preload entries remain in HTML (preventive fix)', () => {
        let htmlFiles = ["index.html", "src/solid/index.html"];
        for (let rel of htmlFiles) {
            let html = readText(rel);
            expect(html.includes('rel="preload"'), rel + ' must not contain rel="preload"').toBe(false);
        }
    });
    it("no hand-written @font-face declarations in app CSS (preventive fix)", () => {
        let stylesDir = resolve(root, "src", "solid", "styles");
        let entries = readdirSync(stylesDir);
        for (let entry of entries) {
            if (!entry.endsWith(".css")) {
                continue;
            }
            let css = readText(join("src", "solid", "styles", entry));
            expect(css.includes("@font-face"), entry + " must not contain hand-written @font-face").toBe(false);
        }
    });
});
