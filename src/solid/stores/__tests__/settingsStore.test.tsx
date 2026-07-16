import {describe, it, expect, beforeEach} from "vitest";
import {render, screen} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import pkg from "../../../../package.json";
import {useSettingsStore, migrateSettingsState, SETTINGS_SCHEMA_VERSION} from "../settingsStore";
const STORAGE_KEY = "physics-quest-settings";
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
			const state = useSettingsStore.getState();
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
			const store = useSettingsStore.getState();
			store.setThemeMode("dark");
			store.setLocale("fr");
			store.setAccentHue(120);
			store.setFontSize("large");
			store.setReducedMotion(true);
			store.setSpecification("/spec.json", "content");
			store.resetToDefaults();
			const state = useSettingsStore.getState();
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
			const state = useSettingsStore.getState();
			expect(state.themeMode).toBe("dark");
			expect(state.locale).toBe("en");
			expect(state.accentHue).toBe(210);
			expect(state.fontSize).toBe("medium");
			expect(state.reducedMotion).toBe(false);
			expect("unknownField" in state).toBe(false);
		});
		it("fills defaultResponseMode and sigFigs defaults when fields are missing (task 5.11 bug 1)", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: {themeMode: "dark"}, version: 0}));
			await useSettingsStore.persist!.rehydrate();
			const state = useSettingsStore.getState();
			expect(state.defaultResponseMode).toBe("frq");
			expect(state.sigFigs).toBe(3);
		});
		it("keeps valid defaultResponseMode and sigFigs values from persisted state", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: {defaultResponseMode: "mcq", sigFigs: 5}, version: 1}));
			await useSettingsStore.persist!.rehydrate();
			const state = useSettingsStore.getState();
			expect(state.defaultResponseMode).toBe("mcq");
			expect(state.sigFigs).toBe(5);
		});
		it("falls back to defaults when defaultResponseMode or sigFigs are null (task 5.11 bug 1)", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: {defaultResponseMode: null, sigFigs: null}, version: 1}));
			await useSettingsStore.persist!.rehydrate();
			const state = useSettingsStore.getState();
			expect(state.defaultResponseMode).toBe("frq");
			expect(state.sigFigs).toBe(3);
		});
		it("falls back to defaults when defaultResponseMode is an invalid string (task 5.11 bug 1)", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: {defaultResponseMode: "MCQ", sigFigs: "abc"}, version: 1}));
			await useSettingsStore.persist!.rehydrate();
			const state = useSettingsStore.getState();
			expect(state.defaultResponseMode).toBe("frq");
			expect(state.sigFigs).toBe(3);
		});
		it("falls back to defaults when sigFigs is zero or negative (task 5.11 bug 1)", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: {sigFigs: 0}, version: 1}));
			await useSettingsStore.persist!.rehydrate();
			expect(useSettingsStore.getState().sigFigs).toBe(3);
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: {sigFigs: -2}, version: 1}));
			await useSettingsStore.persist!.rehydrate();
			expect(useSettingsStore.getState().sigFigs).toBe(3);
		});
		it("does not crash when persisted state is null (task 5.11 bug 1)", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: null, version: 1}));
			await useSettingsStore.persist!.rehydrate();
			const state = useSettingsStore.getState();
			expect(state.defaultResponseMode).toBe("frq");
			expect(state.sigFigs).toBe(3);
		});
		it("does not crash when persisted state is a primitive (task 5.11 bug 1)", async () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({state: 42, version: 1}));
			await useSettingsStore.persist!.rehydrate();
			const state = useSettingsStore.getState();
			expect(state.defaultResponseMode).toBe("frq");
			expect(state.sigFigs).toBe(3);
		});
	});
	describe("migrateSettingsState (unit)", () => {
		it("returns all defaults for a null payload", () => {
			const migrated = migrateSettingsState(null, 0);
			expect(migrated.defaultResponseMode).toBe("frq");
			expect(migrated.sigFigs).toBe(3);
			expect(migrated.themeMode).toBe("system");
		});
		it("returns all defaults for an array payload", () => {
			const migrated = migrateSettingsState([1, 2, 3], 0);
			expect(migrated.defaultResponseMode).toBe("frq");
			expect(migrated.sigFigs).toBe(3);
		});
		it("drops unknown keys and keeps known keys", () => {
			const migrated = migrateSettingsState({themeMode: "dark", unknownField: "x"}, 1);
			expect(migrated.themeMode).toBe("dark");
			expect("unknownField" in migrated).toBe(false);
		});
		it("validates defaultResponseMode against mcq|frq", () => {
			expect(migrateSettingsState({defaultResponseMode: "mcq"}, 1).defaultResponseMode).toBe("mcq");
			expect(migrateSettingsState({defaultResponseMode: "frq"}, 1).defaultResponseMode).toBe("frq");
			expect(migrateSettingsState({defaultResponseMode: "MCQ"}, 1).defaultResponseMode).toBe("frq");
			expect(migrateSettingsState({defaultResponseMode: "invalid"}, 1).defaultResponseMode).toBe("frq");
		});
		it("validates sigFigs is a positive finite integer", () => {
			expect(migrateSettingsState({sigFigs: 5}, 1).sigFigs).toBe(5);
			expect(migrateSettingsState({sigFigs: 0}, 1).sigFigs).toBe(3);
			expect(migrateSettingsState({sigFigs: -1}, 1).sigFigs).toBe(3);
			expect(migrateSettingsState({sigFigs: 2.5}, 1).sigFigs).toBe(3);
			expect(migrateSettingsState({sigFigs: Number.POSITIVE_INFINITY}, 1).sigFigs).toBe(3);
			expect(migrateSettingsState({sigFigs: "3"}, 1).sigFigs).toBe(3);
		});
	});
	describe("schema version (task 5.11 bug 2)", () => {
		it("exposes a SETTINGS_SCHEMA_VERSION constant", () => {
			expect(SETTINGS_SCHEMA_VERSION).toBeGreaterThan(0);
			expect(typeof SETTINGS_SCHEMA_VERSION).toBe("number");
		});
		it("persists a version field at the top level of the stored JSON", async () => {
			useSettingsStore.getState().setLocale("fr");
			await new Promise(resolve => setTimeout(resolve, 50));
			const raw = localStorage.getItem(STORAGE_KEY);
			expect(raw).toBeTruthy();
			const parsed = JSON.parse(raw!);
			expect(typeof parsed.version).toBe("number");
			expect(parsed.version).toBe(SETTINGS_SCHEMA_VERSION);
		});
		it("uses the version parameter to drive migration (version 0 still migrates)", () => {
			const v0 = migrateSettingsState({themeMode: "dark"}, 0);
			expect(v0.themeMode).toBe("dark");
			expect(v0.defaultResponseMode).toBe("frq");
			const v1 = migrateSettingsState({defaultResponseMode: "mcq", sigFigs: 4}, 1);
			expect(v1.defaultResponseMode).toBe("mcq");
			expect(v1.sigFigs).toBe(4);
		});
	});
	describe("persistence", () => {
		it("does not persist appVersion in localStorage", async () => {
			useSettingsStore.getState().setLocale("fr");
			await new Promise(resolve => setTimeout(resolve, 50));
			const raw = localStorage.getItem(STORAGE_KEY);
			expect(raw).toBeTruthy();
			const parsed = JSON.parse(raw!);
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
