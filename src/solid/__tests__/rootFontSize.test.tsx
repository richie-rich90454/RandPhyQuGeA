import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
let globalsCss = readFileSync(join(process.cwd(), "src", "solid", "styles", "globals.css"), "utf-8");
let modalCss = readFileSync(join(process.cwd(), "src", "solid", "components", "ui", "Modal.module.css"), "utf-8");
let selectCss = readFileSync(join(process.cwd(), "src", "solid", "components", "ui", "Select.module.css"), "utf-8");
describe("root font-size enables browser font scaling", () => {
    it("globals.css sets html font-size to 100%", () => {
        expect(globalsCss).toMatch(/html\s*\{[^}]*font-size:\s*100%/);
    });
    it("globals.css sets -webkit-text-size-adjust to 100%", () => {
        expect(globalsCss).toContain("-webkit-text-size-adjust: 100%");
    });
    it("globals.css sets text-size-adjust to 100%", () => {
        expect(globalsCss).toContain("text-size-adjust: 100%");
    });
});
describe("no hardcoded px font-sizes block browser scaling", () => {
    it("Modal.module.css does not use px for font-size", () => {
        expect(modalCss).not.toMatch(/font-size:\s*\d+px/);
    });
    it("Modal.module.css uses rem-based token for iconButton font-size", () => {
        expect(modalCss).toContain("font-size: var(--font-size-lg)");
    });
    it("Select.module.css does not use px for font-size", () => {
        expect(selectCss).not.toMatch(/font-size:\s*\d+px/);
    });
    it("Select.module.css uses rem-based token for chevron font-size", () => {
        expect(selectCss).toContain("font-size: var(--font-size-xs)");
    });
});
