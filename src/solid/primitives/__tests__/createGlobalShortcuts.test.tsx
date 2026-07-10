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
function keydown(key: string, opts: {ctrlKey?: boolean, metaKey?: boolean, shiftKey?: boolean}={}): KeyboardEvent {
	let event=new KeyboardEvent("keydown", {
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
	it("Ctrl+G calls preventDefault", async () => {
		render(() => <ShortcutsRoot />);
		await flush();
		let event=keydown("g", {ctrlKey: true});
		expect(event.defaultPrevented).toBe(true);
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
		let result=render(() => <ShortcutsRoot />);
		await flush();
		result.unmount();
		keydown(",", {ctrlKey: true});
		expect(useUiStore.getState().activeModal).toBeNull();
	});
});
