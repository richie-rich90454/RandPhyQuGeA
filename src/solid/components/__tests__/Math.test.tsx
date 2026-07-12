import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import katex from "katex";
import {MathRenderer, clearMathCache} from "../MathRenderer";
import {MathText} from "../MathText";
describe("MathRenderer", () => {
	it("renders inline math as a span", () => {
		let {container}=render(() => <MathRenderer tex="x^2" />);
		let el=container.querySelector("span");
		expect(el).not.toBeNull();
		expect(el?.innerHTML).toContain("katex");
	});
	it("renders display math as a div", () => {
		let {container}=render(() => <MathRenderer tex="x^2" display={true} />);
		let el=container.querySelector("div");
		expect(el).not.toBeNull();
		expect(el?.innerHTML).toContain("katex");
	});
	it("does not throw on invalid TeX", () => {
		let {container}=render(() => <MathRenderer tex="\\invalidcmd{" />);
		expect(container.querySelector("span")).not.toBeNull();
	});
	it("renders the KaTeX output", () => {
		let {container}=render(() => <MathRenderer tex="a+b" />);
		expect(container.innerHTML).toContain("a");
		expect(container.innerHTML).toContain("b");
	});
	it("caches KaTeX output for repeated TeX across renders (regression 5.4)", () => {
		clearMathCache();
		let spy=vi.spyOn(katex, "renderToString");
		render(() => <MathRenderer tex="x^2" />);
		expect(spy).toHaveBeenCalledTimes(1);
		render(() => <MathRenderer tex="x^2" />);
		expect(spy).toHaveBeenCalledTimes(1);
		spy.mockRestore();
	});
	it("different display modes produce separate cache entries (regression 5.4)", () => {
		clearMathCache();
		let spy=vi.spyOn(katex, "renderToString");
		render(() => <MathRenderer tex="x^2" />);
		render(() => <MathRenderer tex="x^2" display={true} />);
		expect(spy).toHaveBeenCalledTimes(2);
		spy.mockRestore();
	});
	it("different TeX strings are cached separately (regression 5.4)", () => {
		clearMathCache();
		let spy=vi.spyOn(katex, "renderToString");
		render(() => <MathRenderer tex="a+b" />);
		render(() => <MathRenderer tex="c+d" />);
		expect(spy).toHaveBeenCalledTimes(2);
		spy.mockRestore();
	});
});
describe("MathText", () => {
	it("renders plain text without math delimiters", () => {
		render(() => <MathText text="Hello world" />);
		expect(screen.getByText("Hello world")).toBeInTheDocument();
	});
	it("renders nothing when text is empty", () => {
		let {container}=render(() => <MathText text="" />);
		expect(container.querySelector("span")).toBeNull();
	});
	it("renders inline math with dollar delimiters", () => {
		let {container}=render(() => <MathText text="The value of $x^2$ is unknown" />);
		expect(container.innerHTML).toContain("katex");
		expect(container.innerHTML).toContain("The value of");
		expect(container.innerHTML).toContain("is unknown");
	});
	it("renders display math with double dollar delimiters", () => {
		let {container}=render(() => <MathText text="$$x^2 + y^2 = r^2$$" />);
		expect(container.querySelector("div")).not.toBeNull();
		expect(container.innerHTML).toContain("katex");
	});
	it("renders display math with bracket delimiters", () => {
		let {container}=render(() => <MathText text={"\\[x^2 + y^2 = r^2\\]"} />);
		expect(container.querySelector("div")).not.toBeNull();
		expect(container.innerHTML).toContain("katex");
	});
	it("renders inline math with paren delimiters", () => {
		let {container}=render(() => <MathText text={"The value of \\(x^2\\) is unknown"} />);
		expect(container.innerHTML).toContain("katex");
	});
	it("handles escaped dollar signs", () => {
		let {container}=render(() => <MathText text="Price is \\$5" />);
		expect(container.textContent).toContain("$5");
	});
	it("renders mixed text and math segments", () => {
		let {container}=render(() => <MathText text="If $a=1$ and $b=2$, then $$a+b=3$$" />);
		expect(container.innerHTML).toContain("katex");
		expect(container.innerHTML).toContain("If");
		expect(container.innerHTML).toContain("and");
		expect(container.innerHTML).toContain("then");
	});
	it("escaped backslash before dollar does not consume math open (regression 5.1)", () => {
		let {container}=render(() => <MathText text={"\\\\$x$"} />);
		expect(container.innerHTML).toContain("katex");
		expect(container.textContent).toContain("\\");
		expect(container.textContent).toContain("x");
	});
	it("escaped backslash inside bracket display math does not close early (regression 5.1)", () => {
		let {container}=render(() => <MathText text={"\\[a \\\\] b\\]"} />);
		let divs=container.querySelectorAll("div");
		expect(divs.length).toBe(1);
		expect(container.innerHTML).toContain("katex");
		expect(container.textContent).toContain("b");
	});
	it("unbalanced double-dollar renders as text not broken math (regression 5.1)", () => {
		let {container}=render(() => <MathText text="$$x$y" />);
		expect(container.textContent).toContain("$$");
		expect(container.textContent).toContain("x");
		expect(container.textContent).toContain("y");
		let divs=container.querySelectorAll("div");
		expect(divs.length).toBe(0);
	});
	it("escaped backslash inside paren inline math does not close early (regression 5.1)", () => {
		let {container}=render(() => <MathText text={"\\(a \\\\) b\\)"} />);
		expect(container.innerHTML).toContain("katex");
		expect(container.textContent).toContain("b");
	});
	it("single trailing dollar renders as text (regression 5.1)", () => {
		let {container}=render(() => <MathText text="cost $5" />);
		expect(container.textContent).toContain("$5");
		expect(container.innerHTML).not.toContain("katex");
	});
});
