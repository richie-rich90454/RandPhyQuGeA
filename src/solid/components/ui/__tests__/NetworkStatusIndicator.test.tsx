import {render, screen, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {createSignal} from "solid-js";
import {NetworkStatusIndicator} from "../NetworkStatusIndicator";
function makeRoot(online: boolean, forcedOffline: boolean) {
	let [onlineSig, setOnlineSig] = createSignal(online);
	let [forcedSig, setForcedSig] = createSignal(forcedOffline);
	let toggle = () => setForcedSig(!forcedSig());
	return {
		render: () => render(() => <NetworkStatusIndicator online={onlineSig} forcedOffline={forcedSig} onToggle={toggle} />),
		setOnline: setOnlineSig,
		setForced: setForcedSig,
	};
}
describe("NetworkStatusIndicator", () => {
	it("shows Online pill when online and not forced offline", () => {
		let root = makeRoot(true, false);
		root.render();
		expect(screen.getByText("Online")).toBeInTheDocument();
	});
	it("shows Offline pill when the browser is offline", () => {
		let root = makeRoot(false, false);
		root.render();
		expect(screen.getByText("Offline")).toBeInTheDocument();
	});
	it("shows Forced offline pill when forced offline is true", () => {
		let root = makeRoot(true, true);
		root.render();
		expect(screen.getByText("Forced offline")).toBeInTheDocument();
	});
	it("marks the root with data-online true when effective online", () => {
		let root = makeRoot(true, false);
		root.render();
		let rootEl = document.querySelector("[data-online]");
		expect(rootEl?.getAttribute("data-online")).toBe("true");
	});
	it("marks the root with data-online false when forced offline", () => {
		let root = makeRoot(true, true);
		root.render();
		let rootEl = document.querySelector("[data-online]");
		expect(rootEl?.getAttribute("data-online")).toBe("false");
	});
	it("marks the root with data-online false when offline", () => {
		let root = makeRoot(false, false);
		root.render();
		let rootEl = document.querySelector("[data-online]");
		expect(rootEl?.getAttribute("data-online")).toBe("false");
	});
	it("renders a toggle button with the Simulate offline label", () => {
		let root = makeRoot(true, false);
		root.render();
		expect(screen.getByRole("button", {name: /simulate offline/i})).toBeInTheDocument();
	});
	it("renders a toggle button with the Restore online label when forced", () => {
		let root = makeRoot(true, true);
		root.render();
		expect(screen.getByRole("button", {name: /restore online/i})).toBeInTheDocument();
	});
	it("toggles forced offline when the button is clicked", () => {
		let root = makeRoot(true, false);
		root.render();
		let button = screen.getByRole("button", {name: /simulate offline/i});
		fireEvent.click(button);
		expect(screen.getByText("Forced offline")).toBeInTheDocument();
		expect(screen.getByRole("button", {name: /restore online/i})).toBeInTheDocument();
	});
	it("sets aria-pressed true on the toggle when forced offline", () => {
		let root = makeRoot(true, true);
		root.render();
		let button = screen.getByRole("button");
		expect(button.getAttribute("aria-pressed")).toBe("true");
	});
	it("sets aria-pressed false on the toggle when not forced offline", () => {
		let root = makeRoot(true, false);
		root.render();
		let button = screen.getByRole("button");
		expect(button.getAttribute("aria-pressed")).toBe("false");
	});
	it("announces status via an aria-live polite region", () => {
		let root = makeRoot(true, false);
		root.render();
		let liveRegion = screen.getByText("Online");
		expect(liveRegion.getAttribute("aria-live")).toBe("polite");
		expect(liveRegion.getAttribute("aria-atomic")).toBe("true");
	});
	it("updates the status text reactively when online changes", () => {
		let root = makeRoot(true, false);
		root.render();
		expect(screen.getByText("Online")).toBeInTheDocument();
		root.setOnline(false);
		expect(screen.getByText("Offline")).toBeInTheDocument();
	});
	it("updates the status text reactively when forced offline changes", () => {
		let root = makeRoot(true, false);
		root.render();
		expect(screen.getByText("Online")).toBeInTheDocument();
		root.setForced(true);
		expect(screen.getByText("Forced offline")).toBeInTheDocument();
	});
});
