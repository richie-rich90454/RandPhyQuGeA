import {render, waitFor} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {Motion} from "../Motion";
import styles from "../Motion.module.css";
describe("Motion", () => {
	it("renders children inside the motion root", () => {
		let {container} = render(() => (
			<Motion>
				<span>content</span>
			</Motion>
		));
		let root = container.firstChild as HTMLElement;
		expect(root).toBeTruthy();
		expect(root.getAttribute("data-testid")).toBe("motion");
		expect(root.textContent).toBe("content");
	});
	it("applies the root and fade-in hidden classes by default", () => {
		let {container} = render(() => (
			<Motion>
				<span>x</span>
			</Motion>
		));
		let root = container.firstChild as HTMLElement;
		expect(root.classList.contains(styles.root ?? "")).toBe(true);
		expect(root.classList.contains(styles.fadeHidden ?? "")).toBe(true);
	});
	it("applies the slide-up hidden class for the slide-up variant", () => {
		let {container} = render(() => (
			<Motion variant="slide-up">
				<span>x</span>
			</Motion>
		));
		let root = container.firstChild as HTMLElement;
		expect(root.classList.contains(styles.slideHidden ?? "")).toBe(true);
	});
	it("applies the scale-in hidden class for the scale-in variant", () => {
		let {container} = render(() => (
			<Motion variant="scale-in">
				<span>x</span>
			</Motion>
		));
		let root = container.firstChild as HTMLElement;
		expect(root.classList.contains(styles.scaleHidden ?? "")).toBe(true);
	});
	it("adds the visible class after mount", async () => {
		let {container} = render(() => (
			<Motion>
				<span>x</span>
			</Motion>
		));
		let root = container.firstChild as HTMLElement;
		await waitFor(() => {
			expect(root.classList.contains(styles.visible ?? "")).toBe(true);
		});
	});
	it("forwards duration and delay as CSS custom properties", () => {
		let {container} = render(() => (
			<Motion duration={500} delay={120}>
				<span>x</span>
			</Motion>
		));
		let root = container.firstChild as HTMLElement;
		let style = root.getAttribute("style") ?? "";
		expect(style).toContain("--motion-duration: 500ms");
		expect(style).toContain("--motion-delay: 120ms");
	});
	it("appends a custom class alongside the motion classes", () => {
		let {container} = render(() => (
			<Motion class="custom">
				<span>x</span>
			</Motion>
		));
		let root = container.firstChild as HTMLElement;
		expect(root.classList.contains("custom")).toBe(true);
		expect(root.classList.contains(styles.root ?? "")).toBe(true);
	});
	it("does not add the visible class before the animation frame fires", () => {
		let {container} = render(() => (
			<Motion>
				<span>x</span>
			</Motion>
		));
		let root = container.firstChild as HTMLElement;
		expect(root.classList.contains(styles.visible ?? "")).toBe(false);
	});
});
