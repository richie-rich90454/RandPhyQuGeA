import {render, screen} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {createSignal} from "solid-js";
import {A11yLiveRegion} from "../A11yLiveRegion";
import styles from "../A11yLiveRegion.module.css";
describe("A11yLiveRegion", () => {
	it("renders a status role with polite aria-live by default", () => {
		render(() => <A11yLiveRegion message="hello" />);
		let region = screen.getByTestId("a11y-live-region");
		expect(region).toHaveAttribute("role", "status");
		expect(region).toHaveAttribute("aria-live", "polite");
	});
	it("supports assertive politeness", () => {
		render(() => <A11yLiveRegion message="danger" politeness="assertive" />);
		expect(screen.getByTestId("a11y-live-region")).toHaveAttribute("aria-live", "assertive");
	});
	it("writes the message text into the region", () => {
		render(() => <A11yLiveRegion message="Question 2 loaded" />);
		expect(screen.getByTestId("a11y-live-region").textContent).toBe("Question 2 loaded");
	});
	it("updates text content when the accessor changes", () => {
		let [msg, setMsg] = createSignal<string>("first");
		render(() => <A11yLiveRegion message={msg} />);
		let region = screen.getByTestId("a11y-live-region");
		expect(region.textContent).toBe("first");
		setMsg("second");
		expect(region.textContent).toBe("second");
	});
	it("accepts a static string message", () => {
		render(() => <A11yLiveRegion message="static announcement" />);
		expect(screen.getByTestId("a11y-live-region").textContent).toBe("static announcement");
	});
	it("applies the visually-hidden class", () => {
		render(() => <A11yLiveRegion message="hidden" />);
		let region = screen.getByTestId("a11y-live-region");
		expect(region.classList.contains(styles.srOnly ?? "")).toBe(true);
	});
	it("clears the announcement when the message becomes empty", () => {
		let [msg, setMsg] = createSignal<string>("announce");
		render(() => <A11yLiveRegion message={msg} />);
		let region = screen.getByTestId("a11y-live-region");
		expect(region.textContent).toBe("announce");
		setMsg("");
		expect(region.textContent).toBe("");
	});
	it("forwards the id attribute", () => {
		render(() => <A11yLiveRegion message="x" id="score-live" />);
		expect(screen.getByTestId("a11y-live-region")).toHaveAttribute("id", "score-live");
	});
});
