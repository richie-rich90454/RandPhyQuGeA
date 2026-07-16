import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import {createGlobalShortcuts} from "../createGlobalShortcuts";
import {useSettingsStore} from "../../stores/settingsStore";
import {useUiStore} from "../../stores/uiStore";
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
function ShortcutsRoot(): JSX.Element {
	createGlobalShortcuts({settingsStore: useSettingsStore, uiStore: useUiStore});
	return <div>shortcuts</div>;
}
function keydown(key: string, opts: {ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean} = {}): KeyboardEvent {
	let event = new KeyboardEvent("keydown", {
		key,
		ctrlKey: opts.ctrlKey ?? false,
		metaKey: opts.metaKey ?? false,
		shiftKey: opts.shiftKey ?? false,
		bubbles: true,
		cancelable: true,
	});
	document.dispatchEvent(event);
	return event;
}
beforeEach(() => {
	useSettingsStore.setState({themeMode: "light", defaultMode: "Single"});
	useUiStore.setState(useUiStore.getInitialState());
});
describe("createGlobalShortcuts", () => {
	it("Ctrl+1 switches default mode to Single", async () => {
		useSettingsStore.setState({defaultMode: "Mental"});
		render(() => <ShortcutsRoot />);
		await flush();
		keydown("1", {ctrlKey: true});
		expect(useSettingsStore.getState().defaultMode).toBe("Single");
	});
	it("Ctrl+2 switches default mode to Mental", async () => {
		render(() => <ShortcutsRoot />);
		await flush();
		keydown("2", {ctrlKey: true});
		expect(useSettingsStore.getState().defaultMode).toBe("Mental");
	});
	it("Ctrl+, opens the settings modal", async () => {
		render(() => <ShortcutsRoot />);
		await flush();
		keydown(",", {ctrlKey: true});
		expect(useUiStore.getState().activeModal).toBe("settings");
	});
	it("Ctrl+Shift+T toggles theme between light and dark", async () => {
		useSettingsStore.setState({themeMode: "light"});
		render(() => <ShortcutsRoot />);
		await flush();
		keydown("T", {ctrlKey: true, shiftKey: true});
		expect(useSettingsStore.getState().themeMode).toBe("dark");
		keydown("T", {ctrlKey: true, shiftKey: true});
		expect(useSettingsStore.getState().themeMode).toBe("light");
	});
	it("Ctrl+G is not handled globally (delegated to practice page, task 5.15 bug 3)", async () => {
		render(() => <ShortcutsRoot />);
		await flush();
		let event = keydown("g", {ctrlKey: true});
		expect(event.defaultPrevented).toBe(false);
	});
	it("ignores keys without ctrl or meta", async () => {
		useSettingsStore.setState({defaultMode: "Single"});
		render(() => <ShortcutsRoot />);
		await flush();
		keydown("1");
		expect(useSettingsStore.getState().defaultMode).toBe("Single");
	});
	it("supports metaKey as an alternative to ctrlKey", async () => {
		render(() => <ShortcutsRoot />);
		await flush();
		keydown("2", {metaKey: true});
		expect(useSettingsStore.getState().defaultMode).toBe("Mental");
	});
	it("removes the listener on disposal", async () => {
		useUiStore.setState(useUiStore.getInitialState());
		let result = render(() => <ShortcutsRoot />);
		await flush();
		result.unmount();
		keydown(",", {ctrlKey: true});
		expect(useUiStore.getState().activeModal).toBeNull();
	});
	it("suppresses all shortcuts when a modal is open (task 5.15 bug 2)", async () => {
		useUiStore.setState({activeModal: "help"});
		useSettingsStore.setState({defaultMode: "Mental", themeMode: "light"});
		render(() => <ShortcutsRoot />);
		await flush();
		keydown("1", {ctrlKey: true});
		expect(useSettingsStore.getState().defaultMode).toBe("Mental");
		keydown(",", {ctrlKey: true});
		expect(useUiStore.getState().activeModal).toBe("help");
		keydown("T", {ctrlKey: true, shiftKey: true});
		expect(useSettingsStore.getState().themeMode).toBe("light");
	});
	it("suppresses Ctrl+1 mode switch when typing in a textarea (task 5.15 bug 2)", async () => {
		useSettingsStore.setState({defaultMode: "Mental"});
		render(() => <ShortcutsRoot />);
		await flush();
		let ta = document.createElement("textarea");
		document.body.appendChild(ta);
		ta.focus();
		let event = new KeyboardEvent("keydown", {key: "1", ctrlKey: true, bubbles: true, cancelable: true});
		ta.dispatchEvent(event);
		expect(useSettingsStore.getState().defaultMode).toBe("Mental");
		document.body.removeChild(ta);
	});
	it("suppresses Ctrl+2 mode switch when typing in an input (task 5.15 bug 2)", async () => {
		useSettingsStore.setState({defaultMode: "Single"});
		render(() => <ShortcutsRoot />);
		await flush();
		let input = document.createElement("input");
		document.body.appendChild(input);
		input.focus();
		let event = new KeyboardEvent("keydown", {key: "2", ctrlKey: true, bubbles: true, cancelable: true});
		input.dispatchEvent(event);
		expect(useSettingsStore.getState().defaultMode).toBe("Single");
		document.body.removeChild(input);
	});
	it("does not suppress Ctrl+, settings when typing (modifier shortcuts remain global, task 5.15)", async () => {
		render(() => <ShortcutsRoot />);
		await flush();
		let input = document.createElement("input");
		document.body.appendChild(input);
		input.focus();
		let event = new KeyboardEvent("keydown", {key: ",", ctrlKey: true, bubbles: true, cancelable: true});
		input.dispatchEvent(event);
		expect(useUiStore.getState().activeModal).toBe("settings");
		document.body.removeChild(input);
	});
});
