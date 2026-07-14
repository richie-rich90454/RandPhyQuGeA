import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import {LiquidBackground} from "../LiquidBackground";
import {useSettingsStore} from "../../stores/settingsStore";
import styles from "../LiquidBackground.module.css";
beforeEach(() => {
	useSettingsStore.setState(useSettingsStore.getInitialState());
});
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
describe("LiquidBackground reduced-data mode (task 5.68)", () => {
	it("omits the blob/veil layer when reducedDataMode is on", () => {
		useSettingsStore.setState({reducedDataMode: true});
		let {container}=render(() => <LiquidBackground />);
		let root=container.firstChild as HTMLElement;
		expect(root).toBeTruthy();
		expect(root.getAttribute("aria-hidden")).toBe("true");
		expect(root.classList.contains(styles.root ?? "")).toBe(true);
		expect(root.classList.contains(styles.reducedData ?? "")).toBe(true);
		expect(root.childElementCount).toBe(0);
		expect(root.querySelectorAll(`.${styles.blob}`).length).toBe(0);
		expect(root.querySelectorAll(`.${styles.veil}`).length).toBe(0);
	});
	it("renders the full blob layer when reducedDataMode is off", () => {
		useSettingsStore.setState({reducedDataMode: false});
		let {container}=render(() => <LiquidBackground />);
		let root=container.firstChild as HTMLElement;
		expect(root.childElementCount).toBe(5);
		expect(root.classList.contains(styles.reducedData ?? "")).toBe(false);
	});
	it("reacts to reducedDataMode changes from the store", () => {
		useSettingsStore.setState({reducedDataMode: false});
		let {container}=render(() => <LiquidBackground />);
		let root=container.firstChild as HTMLElement;
		expect(root.childElementCount).toBe(5);
		useSettingsStore.getState().setReducedDataMode(true);
		let reducedRoot=container.firstChild as HTMLElement;
		expect(reducedRoot.childElementCount).toBe(0);
		expect(reducedRoot.classList.contains(styles.reducedData ?? "")).toBe(true);
	});
	it("preserves a custom class in reduced-data mode", () => {
		useSettingsStore.setState({reducedDataMode: true});
		let {container}=render(() => <LiquidBackground class="custom-bg" />);
		let root=container.firstChild as HTMLElement;
		expect(root.classList.contains("custom-bg")).toBe(true);
		expect(root.classList.contains(styles.root ?? "")).toBe(true);
	});
});
