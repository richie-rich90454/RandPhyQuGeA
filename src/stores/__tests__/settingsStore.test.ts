import {describe, it, expect, beforeEach, vi} from "vitest";
import pkg from "../../../package.json";
const STORAGE_KEY="physics-quest-settings";
describe("settingsStore", () => {
	beforeEach(async () => {
		localStorage.clear();
		vi.resetModules();
	});
	describe("initial state", () => {
		it("uses defaults and reads appVersion from package.json", async () => {
			const {useSettingsStore}=await import("../settingsStore");
			const state=useSettingsStore.getState();
			expect(state.locale).toBe("en");
			expect(state.accentHue).toBe(210);
			expect(state.fontSize).toBe("medium");
			expect(state.reducedMotion).toBe(false);
			expect(state.appVersion).toBe(pkg.version);
		});
	});
	describe("setters", () => {
		it("setLocale updates locale", async () => {
			const {useSettingsStore}=await import("../settingsStore");
			useSettingsStore.getState().setLocale("fr");
			expect(useSettingsStore.getState().locale).toBe("fr");
		});
		it("setAccentHue updates accentHue", async () => {
			const {useSettingsStore}=await import("../settingsStore");
			useSettingsStore.getState().setAccentHue(120);
			expect(useSettingsStore.getState().accentHue).toBe(120);
		});
		it("setFontSize updates fontSize", async () => {
			const {useSettingsStore}=await import("../settingsStore");
			useSettingsStore.getState().setFontSize("large");
			expect(useSettingsStore.getState().fontSize).toBe("large");
		});
		it("setReducedMotion updates reducedMotion", async () => {
			const {useSettingsStore}=await import("../settingsStore");
			useSettingsStore.getState().setReducedMotion(true);
			expect(useSettingsStore.getState().reducedMotion).toBe(true);
		});
	});
	describe("resetToDefaults", () => {
		it("preserves spec content and path but resets other fields", async () => {
			const {useSettingsStore}=await import("../settingsStore");
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
			vi.resetModules();
			const {useSettingsStore}=await import("../settingsStore");
			await useSettingsStore.persist.rehydrate();
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
			const {useSettingsStore}=await import("../settingsStore");
			useSettingsStore.getState().setLocale("fr");
			await new Promise(resolve => setTimeout(resolve, 50));
			const raw=localStorage.getItem(STORAGE_KEY);
			expect(raw).toBeTruthy();
			const parsed=JSON.parse(raw!);
			expect(parsed.state.appVersion).toBeUndefined();
			expect(parsed.state.locale).toBe("fr");
		});
	});
});