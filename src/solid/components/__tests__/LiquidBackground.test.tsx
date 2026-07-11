import {render} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {LiquidBackground} from "../LiquidBackground";
import styles from "../LiquidBackground.module.css";
describe("LiquidBackground", () => {
	it("renders a decorative root marked aria-hidden", () => {
		let {container}=render(() => <LiquidBackground />);
		let root=container.firstChild as HTMLElement;
		expect(root).toBeTruthy();
		expect(root.getAttribute("aria-hidden")).toBe("true");
	});
	it("applies the root background class", () => {
		let {container}=render(() => <LiquidBackground />);
		let root=container.firstChild as HTMLElement;
		expect(root.classList.contains(styles.root ?? "")).toBe(true);
	});
	it("renders four animated blobs and a veil", () => {
		let {container}=render(() => <LiquidBackground />);
		let root=container.firstChild as HTMLElement;
		expect(root.childElementCount).toBe(5);
		expect(root.querySelectorAll(`.${styles.blob}`).length).toBe(4);
		expect(root.querySelectorAll(`.${styles.veil}`).length).toBe(1);
	});
	it("appends a custom class to the root", () => {
		let {container}=render(() => <LiquidBackground class="custom-bg" />);
		let root=container.firstChild as HTMLElement;
		expect(root.classList.contains("custom-bg")).toBe(true);
		expect(root.classList.contains(styles.root ?? "")).toBe(true);
	});
});
