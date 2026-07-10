import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import {createTheme} from "../createTheme";
import {useSettingsStore} from "../../stores/settingsStore";
type MqlListener=(event: MediaQueryListEvent) => void;
interface MqlMock {
	matches: boolean;
	media: string;
	onchange: null;
	addEventListener: (type: string, listener: MqlListener) => void;
	removeEventListener: (type: string, listener: MqlListener) => void;
	addListener: () => void;
	removeListener: () => void;
	dispatchEvent: () => boolean;
}
interface MatchMediaMock {
	(query: string): MqlMock;
	setMatches: (query: string, value: boolean) => void;
}
function createMatchMediaMock(): MatchMediaMock {
	let byQuery=new Map<string, {matches: boolean, listeners: Set<MqlListener>}>();
	let ensure=(query: string) => {
		let entry=byQuery.get(query);
		if (!entry) {
			entry={matches: false, listeners: new Set()};
			byQuery.set(query, entry);
		}
		return entry;
	};
	let fn: MatchMediaMock=Object.assign(
		(query: string): MqlMock => {
			let entry=ensure(query);
			return {
				get matches() {
					return entry.matches;
				},
				media: query,
				onchange: null,
				addEventListener: (type, listener) => {
					if (type === "change") {
						entry.listeners.add(listener);
					}
				},
				removeEventListener: (type, listener) => {
					if (type === "change") {
						entry.listeners.delete(listener);
					}
				},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false,
			};
		},
		{
			setMatches: (query: string, value: boolean) => {
				let entry=ensure(query);
				entry.matches=value;
				entry.listeners.forEach(listener => listener({matches: value, media: query} as MediaQueryListEvent));
			},
		},
	);
	return fn;
}
let matchMediaMock: MatchMediaMock;
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
function ThemeRoot(): JSX.Element {
	createTheme({settingsStore: useSettingsStore});
	return <div>theme</div>;
}
function resetSettings(overrides: {themeMode?: "light" | "dark" | "system", reducedMotion?: boolean}={}): void {
	useSettingsStore.setState({themeMode: "light", reducedMotion: false, ...overrides});
}
beforeEach(() => {
	document.documentElement.removeAttribute("data-theme");
	document.documentElement.removeAttribute("data-reduce-motion");
	matchMediaMock=createMatchMediaMock();
	Object.defineProperty(window, "matchMedia", {writable: true, value: matchMediaMock});
	resetSettings();
});
describe("createTheme", () => {
	it("applies data-theme dark when themeMode is dark", async () => {
		resetSettings({themeMode: "dark"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
	});
	it("applies data-theme light when themeMode is light", async () => {
		resetSettings({themeMode: "light"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");
	});
	it("follows system preference when themeMode is system", async () => {
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", true);
		resetSettings({themeMode: "system"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
	});
	it("updates data-theme when the system preference changes", async () => {
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", false);
		resetSettings({themeMode: "system"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", true);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
	});
	it("reacts to themeMode changes from the store", async () => {
		resetSettings({themeMode: "light"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");
		useSettingsStore.getState().setThemeMode("dark");
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
	});
	it("sets data-reduce-motion when the reducedMotion setting is on", async () => {
		resetSettings({reducedMotion: true});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.hasAttribute("data-reduce-motion")).toBe(true);
	});
	it("sets data-reduce-motion when the OS prefers reduced motion", async () => {
		matchMediaMock.setMatches("(prefers-reduced-motion: reduce)", true);
		resetSettings({reducedMotion: false});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.hasAttribute("data-reduce-motion")).toBe(true);
	});
	it("removes listeners on disposal", async () => {
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", false);
		resetSettings({themeMode: "system"});
		let result=render(() => <ThemeRoot />);
		await flush();
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", true);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
		result.unmount();
		document.documentElement.removeAttribute("data-theme");
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", false);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBeNull();
	});
});
