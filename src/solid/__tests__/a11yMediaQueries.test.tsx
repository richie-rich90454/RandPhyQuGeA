import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
let globalsCss = readFileSync(join(process.cwd(), "src", "solid", "styles", "globals.css"), "utf-8");
let switchCss = readFileSync(join(process.cwd(), "src", "solid", "components", "ui", "Switch.module.css"), "utf-8");
describe("prefers-reduced-motion honored globally", () => {
    it("globals.css defines a prefers-reduced-motion media query", () => {
        expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
    });
    it("globals.css resets animation-duration under prefers-reduced-motion", () => {
        expect(globalsCss).toContain("animation-duration: 0.01ms !important");
    });
    it("globals.css resets animation-delay under prefers-reduced-motion", () => {
        expect(globalsCss).toContain("animation-delay: 0ms !important");
    });
    it("globals.css resets animation-iteration-count under prefers-reduced-motion", () => {
        expect(globalsCss).toContain("animation-iteration-count: 1 !important");
    });
    it("globals.css restricts transition-property to opacity under prefers-reduced-motion", () => {
        expect(globalsCss).toContain("transition-property: opacity !important");
    });
    it("globals.css resets transition-duration under prefers-reduced-motion", () => {
        expect(globalsCss).toContain("transition-duration: var(--duration-fast) !important");
    });
    it("globals.css resets transition-delay under prefers-reduced-motion", () => {
        expect(globalsCss).toContain("transition-delay: 0ms !important");
    });
});
describe("forced-colors honored by Switch", () => {
    it("Switch.module.css defines a forced-colors media query", () => {
        expect(switchCss).toContain("@media (forced-colors: active)");
    });
    it("Switch track gets a CanvasText border under forced-colors", () => {
        expect(switchCss).toContain("border: 1px solid CanvasText");
    });
    it("Switch trackOn uses Highlight background under forced-colors", () => {
        expect(switchCss).toContain("background: Highlight");
    });
    it("Switch thumb removes box-shadow under forced-colors", () => {
        expect(switchCss).toContain("box-shadow: none");
    });
});
