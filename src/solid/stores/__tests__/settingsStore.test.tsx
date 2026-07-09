import {describe, it, expect, beforeEach} from "vitest";
import {render, screen} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import pkg from "../../../../package.json";
import {useSettingsStore} from "../settingsStore";
const STORAGE_KEY="physics-quest-settings";
function LocaleView(): JSX.Element {
	const locale = useSettingsStore(s => s.locale);
	return <div data-testid="locale">{locale()}</div>;
}
describe("solid settingsStore", () => {
	beforeEach(() => {
		localStorage.clear();
		useSettingsStore.setState({...useSettingsStore.getInitialState(), appVersion: pkg.version});
	});
	describe("initial state", () => {
		it("uses defaults and reads appVersion from package.json", () => {
			const state=useSettingsStore.getState();
			expect(state.locale).toBe("en");
			expect(state.accentHue).toBe(210);
			expect(state.fontSize).toBe("medium");
			expect(state.reducedMotion).toBe(false);
			expect(state.appVersion).toBe(pkg.version);
		});
	});
	describe("setters", () => {
		it("setLocale updates locale", () => {
			useSettingsStore.getState().setLocale("fr");
			expect(useSettingsStore.getState().locale).toBe("fr");
		});
		it("setAccentHue updates accentHue", () => {
			useSettingsStore.getState().setAccentHue(120);
			expect(useSettingsStore.getState().accentHue).toBe(120);
		});
		it("setFontSize updates fontSize", () => {
			useSettingsStore.getState().setFontSize("large");
			expect(useSettingsStore.getState().fontSize).toBe("large");
		});
		it("setReducedMotion updates reducedMotion", () => {
			useSettingsStore.getState().setReducedMotion(true);
			expect(useSettingsStore.getState().reducedMotion).toBe(true);
		});
		it("setThemeMode updates themeMode", () => {
			useSettingsStore.getState().setThemeMode("dark");
			expect(useSettingsStore.getState().themeMode).toBe("dark");
		});
	});
	describe("resetToDefaults", () => {
		it("preserves spec content and path but resets other fields", () => {
			const store=useSettingsStore.getState();
			store.setThemeMode("dark");
			store.setLocale("fr");
			store.setAccentHue(120);
			store.setFontSize("large");
			store.setReducedMotion(true);
			store.setSpecification("/spec.json", "content");
			store.resetToDefaults();
			const state=useSettingsStore.getState();
			expect(state.themeMode).toBe("system");
			expect(state.locale).toBe("en");
			expect(state.accentHue).toBe(210);
			expect(state.fontSize).toBe("medium");
			expect(state.reducedMotion).toBe(false);
			expect(state.specificationPath).toBe("/spec.json");
			expect(state.specificationContent).toBe("content");
			expect(state.appVersion).toBe(pkg.version);
		});
	});
	describe("migration", () => {
		it("fills defaults from a partial old state without crashing", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: {themeMode: "dark", unknownField: "x"}, version: 0}));
			await useSettingsStore.persist!.rehydrate();
			const state=useSettingsStore.getState();
			expect(state.themeMode).toBe("dark");
			expect(state.locale).toBe("en");
			expect(state.accentHue).toBe(210);
			expect(state.fontSize).toBe("medium");
			expect(state.reducedMotion).toBe(false);
			expect("unknownField" in state).toBe(false);
		});
	});
	describe("persistence", () => {
		it("does not persist appVersion in localStorage", async () => {
			useSettingsStore.getState().setLocale("fr");
			await new Promise(resolve => setTimeout(resolve, 50));
			const raw=localStorage.getItem(STORAGE_KEY);
			expect(raw).toBeTruthy();
			const parsed=JSON.parse(raw!);
			expect(parsed.state.appVersion).toBeUndefined();
			expect(parsed.state.locale).toBe("fr");
		});
	});
	describe("reactive subscription", () => {
		it("updates a rendered accessor when setLocale fires", () => {
			render(() => <LocaleView />);
			expect(screen.getByTestId("locale").textContent).toBe("en");
			useSettingsStore.getState().setLocale("de");
			expect(screen.getByTestId("locale").textContent).toBe("de");
		});
	});
});
