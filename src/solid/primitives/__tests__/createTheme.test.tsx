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
function resetSettings(overrides: {themeMode?: "light" | "dark" | "dim" | "system", reducedMotion?: boolean, locale?: string, fontSize?: "small" | "medium" | "large"}={}): void {
	useSettingsStore.setState({themeMode: "light", reducedMotion: false, locale: "en", fontSize: "medium", ...overrides});
}
beforeEach(() => {
	document.documentElement.removeAttribute("data-theme");
	document.documentElement.removeAttribute("data-reduce-motion");
	document.documentElement.removeAttribute("dir");
	document.documentElement.removeAttribute("data-font-size");
	let existingMeta=document.querySelector('meta[name="theme-color"]');
	if (existingMeta) {
		existingMeta.remove();
	}
	let meta=document.createElement("meta");
	meta.setAttribute("name", "theme-color");
	meta.setAttribute("content", "#0b2540");
	document.head.appendChild(meta);
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
	it("applies data-theme dim when themeMode is dim", async () => {
		resetSettings({themeMode: "dim"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("dim");
	});
	it("sets data-theme system when themeMode is system", async () => {
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", true);
		resetSettings({themeMode: "system"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("system");
	});
	it("keeps data-theme system and updates meta theme-color when the system preference changes", async () => {
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", false);
		resetSettings({themeMode: "system"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("system");
		expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#F8FAFC");
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", true);
		await flush();
		expect(document.documentElement.getAttribute("data-theme")).toBe("system");
		expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#1a1f2e");
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
		expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#1a1f2e");
		result.unmount();
		document.documentElement.removeAttribute("data-theme");
		let meta=document.querySelector('meta[name="theme-color"]');
		let contentBefore=meta?.getAttribute("content") ?? "";
		matchMediaMock.setMatches("(prefers-color-scheme: dark)", false);
		await flush();
		expect(meta?.getAttribute("content")).toBe(contentBefore);
	});
	it("sets dir=ltr for a default English locale (RTL mirroring regression)", async () => {
		resetSettings({locale: "en"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("dir")).toBe("ltr");
	});
	it("sets dir=rtl when locale is Arabic (RTL mirroring regression)", async () => {
		resetSettings({locale: "ar"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("dir")).toBe("rtl");
	});
	it("sets dir=rtl when locale is Hebrew with a region subtag (RTL mirroring regression)", async () => {
		resetSettings({locale: "he-IL"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("dir")).toBe("rtl");
	});
	it("sets dir=rtl for Persian and Urdu locales (RTL mirroring regression)", async () => {
		resetSettings({locale: "fa-IR"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("dir")).toBe("rtl");
		useSettingsStore.getState().setLocale("ur-PK");
		await flush();
		expect(document.documentElement.getAttribute("dir")).toBe("rtl");
	});
	it("reacts to locale changes from the store and flips dir (RTL mirroring regression)", async () => {
		resetSettings({locale: "en"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("dir")).toBe("ltr");
		useSettingsStore.getState().setLocale("ar-SA");
		await flush();
		expect(document.documentElement.getAttribute("dir")).toBe("rtl");
		useSettingsStore.getState().setLocale("en-US");
		await flush();
		expect(document.documentElement.getAttribute("dir")).toBe("ltr");
	});
	it("treats an unknown locale as LTR (RTL mirroring regression)", async () => {
		resetSettings({locale: "xx-YY"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("dir")).toBe("ltr");
	});
});
describe("createTheme font-size application (task 5.67)", () => {
	it("applies data-font-size medium by default", async () => {
		resetSettings({fontSize: "medium"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-font-size")).toBe("medium");
	});
	it("applies data-font-size small when fontSize is small", async () => {
		resetSettings({fontSize: "small"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-font-size")).toBe("small");
	});
	it("applies data-font-size large when fontSize is large", async () => {
		resetSettings({fontSize: "large"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-font-size")).toBe("large");
	});
	it("reacts to fontSize changes from the store", async () => {
		resetSettings({fontSize: "medium"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-font-size")).toBe("medium");
		useSettingsStore.getState().setFontSize("large");
		await flush();
		expect(document.documentElement.getAttribute("data-font-size")).toBe("large");
		useSettingsStore.getState().setFontSize("small");
		await flush();
		expect(document.documentElement.getAttribute("data-font-size")).toBe("small");
	});
	it("clears a stale data-font-size attribute before the first effect runs", async () => {
		document.documentElement.setAttribute("data-font-size", "large");
		resetSettings({fontSize: "small"});
		render(() => <ThemeRoot />);
		await flush();
		expect(document.documentElement.getAttribute("data-font-size")).toBe("small");
	});
});
