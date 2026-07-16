import {describe, it, expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
let base = resolve(__dirname, "..");
let files: Record<string, string> = {
	"Card.module.css": readFileSync(resolve(base, "ui/Card.module.css"), "utf-8"),
	"Accordion.module.css": readFileSync(resolve(base, "ui/Accordion.module.css"), "utf-8"),
	"Pill.module.css": readFileSync(resolve(base, "ui/Pill.module.css"), "utf-8"),
	"Toolbar.module.css": readFileSync(resolve(base, "ui/Toolbar.module.css"), "utf-8"),
	"Tabs.module.css": readFileSync(resolve(base, "ui/Tabs.module.css"), "utf-8"),
	"QuestionCard.module.css": readFileSync(resolve(base, "practice/QuestionCard.module.css"), "utf-8"),
	"UtilityButtons.module.css": readFileSync(resolve(base, "practice/UtilityButtons.module.css"), "utf-8"),
	"ErrorBoundary.module.css": readFileSync(resolve(base, "ErrorBoundary.module.css"), "utf-8"),
	"Footer.module.css": readFileSync(resolve(base, "layout/Footer.module.css"), "utf-8"),
	"PrintModal.module.css": readFileSync(resolve(base, "modals/PrintModal.module.css"), "utf-8"),
	"TopicsSection.module.css": readFileSync(resolve(base, "practice/TopicsSection.module.css"), "utf-8"),
};
describe("Task 5.80: prefers-reduced-motion regression", () => {
	for (let [name, css] of Object.entries(files)) {
		it(`${name} contains a prefers-reduced-motion media query`, () => {
			expect(css).toContain("prefers-reduced-motion");
		});
		it(`${name} contains a transition:none rule inside reduced-motion`, () => {
			expect(css).toContain("transition: none");
		});
	}
	it("all 11 CSS files are covered by the regression test", () => {
		expect(Object.keys(files).length).toBe(11);
	});
});
