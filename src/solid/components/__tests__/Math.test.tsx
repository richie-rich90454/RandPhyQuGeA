import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {MathRenderer} from "../MathRenderer";
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
});
