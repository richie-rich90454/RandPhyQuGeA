import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import {createA11yInspector} from "../createA11yInspector";
import type {CreateA11yInspectorReturn} from "../createA11yInspector";
import {A11yChecker} from "../../../lib/a11y/A11yChecker";
let captured: CreateA11yInspectorReturn | null = null;
function makeRoot(opts?: Parameters<typeof createA11yInspector>[0]): () => JSX.Element {
	return () => {
		captured = createA11yInspector(opts);
		return <div>ai</div>;
	};
}
beforeEach(() => {
	captured = null;
	document.body.innerHTML = "";
	document.documentElement.removeAttribute("lang");
});
describe("createA11yInspector", () => {
	it("populates issues after mount from the document", () => {
		document.body.innerHTML = "<img src='a.png'><button></button>";
		render(makeRoot());
		expect(captured!.issues().length).toBeGreaterThanOrEqual(2);
	});
	it("returns an empty issues list for a clean document", () => {
		document.documentElement.setAttribute("lang", "en");
		document.body.innerHTML = "<h1>Title</h1><p>Content</p>";
		render(makeRoot());
		expect(captured!.issues()).toHaveLength(0);
	});
	it("errorCount counts only error-severity issues", () => {
		document.documentElement.removeAttribute("lang");
		document.body.innerHTML = "<img src='a.png'>";
		render(makeRoot());
		expect(captured!.errorCount()).toBeGreaterThanOrEqual(2);
	});
	it("warningCount counts only warning-severity issues", () => {
		document.body.innerHTML = "<h1>A</h1><h3>B</h3>";
		document.documentElement.setAttribute("lang", "en");
		render(makeRoot());
		expect(captured!.warningCount()).toBe(1);
	});
	it("isOpen defaults to false", () => {
		render(makeRoot());
		expect(captured!.isOpen()).toBe(false);
	});
	it("isOpen respects initiallyOpen", () => {
		render(makeRoot({initiallyOpen: true}));
		expect(captured!.isOpen()).toBe(true);
	});
	it("toggle flips isOpen", () => {
		render(makeRoot());
		expect(captured!.isOpen()).toBe(false);
		captured!.toggle();
		expect(captured!.isOpen()).toBe(true);
		captured!.toggle();
		expect(captured!.isOpen()).toBe(false);
	});
	it("setOpen sets the visibility", () => {
		render(makeRoot());
		captured!.setOpen(true);
		expect(captured!.isOpen()).toBe(true);
		captured!.setOpen(false);
		expect(captured!.isOpen()).toBe(false);
	});
	it("refresh re-runs the scan", () => {
		document.body.innerHTML = "";
		document.documentElement.setAttribute("lang", "en");
		render(makeRoot());
		expect(captured!.issues()).toHaveLength(0);
		document.body.innerHTML = "<img src='a.png'>";
		captured!.refresh();
		expect(captured!.issues().length).toBeGreaterThanOrEqual(1);
	});
	it("accepts a custom checker", () => {
		let checker = new A11yChecker();
		render(makeRoot({checker}));
		expect(captured!.checker).toBe(checker);
	});
	it("accepts a custom root", () => {
		let container = document.createElement("div");
		container.innerHTML = "<img src='x.png'>";
		document.body.appendChild(container);
		render(makeRoot({root: () => container}));
		let hasImgIssue = captured!.issues().some(i => i.rule === "img-alt");
		expect(hasImgIssue).toBe(true);
	});
	it("exposes the checker instance", () => {
		render(makeRoot());
		expect(captured!.checker).toBeInstanceOf(A11yChecker);
	});
});
