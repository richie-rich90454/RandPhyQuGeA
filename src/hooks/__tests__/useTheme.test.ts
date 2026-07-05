import {describe, it, expect, beforeEach} from "vitest";
import {renderHook, act} from "@testing-library/react";
import {useTheme} from "../useTheme";
import {useSettingsStore} from "../../stores/settingsStore";
type MatchMediaMock={
	matches: boolean;
	addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void;
	removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void;
};
type MatchMediaFactory={
	(): MatchMediaMock;
	setMatches: (value: boolean) => void;
};
function createMatchMedia(initialMatches: boolean): MatchMediaFactory {
	let matches=initialMatches;
	const listeners=new Set<(event: MediaQueryListEvent) => void>();
	const mock=(): MatchMediaMock => ({
		matches,
		addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
			if (type === "change") listeners.add(listener);
		},
		removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
			if (type === "change") listeners.delete(listener);
		},
	});
	mock.setMatches=(value: boolean) => {
		matches=value;
		listeners.forEach(listener => listener({matches} as MediaQueryListEvent));
	};
	return mock;
}
function resetSettings(overrides: Partial<Pick<ReturnType<typeof useSettingsStore.getState>, "themeMode" | "reducedMotion">>={}): void {
	useSettingsStore.setState({themeMode: "light", reducedMotion: false, ...overrides});
}
beforeEach(() => {
	document.documentElement.classList.remove("dark", "reduce-motion");
	Object.defineProperty(window, "matchMedia", {writable: true, value: createMatchMedia(false)});
	resetSettings();
});
describe("useTheme", () => {
	it("applies dark class when themeMode is dark", () => {
		resetSettings({themeMode: "dark"});
		renderHook(() => useTheme());
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});
	it("removes dark class when themeMode is light", () => {
		document.documentElement.classList.add("dark");
		resetSettings({themeMode: "light"});
		renderHook(() => useTheme());
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});
	it("follows system preference when themeMode is system", () => {
		const matchMedia=createMatchMedia(true);
		Object.defineProperty(window, "matchMedia", {writable: true, value: matchMedia});
		resetSettings({themeMode: "system"});
		renderHook(() => useTheme());
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});
	it("updates when system preference changes", () => {
		const matchMedia=createMatchMedia(false);
		Object.defineProperty(window, "matchMedia", {writable: true, value: matchMedia});
		resetSettings({themeMode: "system"});
		renderHook(() => useTheme());
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		act(() => {
			matchMedia.setMatches(true);
		});
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});
	it("respects reducedMotion setting", () => {
		resetSettings({reducedMotion: true});
		renderHook(() => useTheme());
		expect(document.documentElement.classList.contains("reduce-motion")).toBe(true);
	});
	it("cleanup removes listeners", () => {
		const matchMedia=createMatchMedia(false);
		Object.defineProperty(window, "matchMedia", {writable: true, value: matchMedia});
		resetSettings({themeMode: "system"});
		const {unmount}=renderHook(() => useTheme());
		act(() => {
			matchMedia.setMatches(true);
		});
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		unmount();
		document.documentElement.classList.remove("dark");
		act(() => {
			matchMedia.setMatches(false);
		});
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});
});
