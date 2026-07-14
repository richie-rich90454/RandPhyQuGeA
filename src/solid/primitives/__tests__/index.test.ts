import {describe, it, expect} from "vitest";
import {
	createCountUp,
	createCountdownTimer,
	createGlobalShortcuts,
	createGsapContext,
	createHashRouter,
	createMcqHotReconfig,
	createMediaQuery,
	createPersistedSignal,
	createPersistedStore,
	createPracticeActions,
	createReducedMotion,
	createSessionSnapshot,
	createShortcut,
	createSpecLoader,
	createTheme,
	createVoiceInput,
} from "../index";
describe("primitives barrel (regression 5.43)", () => {
	it("re-exports every primitive as a callable function", () => {
		expect(typeof createCountUp).toBe("function");
		expect(typeof createCountdownTimer).toBe("function");
		expect(typeof createGlobalShortcuts).toBe("function");
		expect(typeof createGsapContext).toBe("function");
		expect(typeof createHashRouter).toBe("function");
		expect(typeof createMcqHotReconfig).toBe("function");
		expect(typeof createMediaQuery).toBe("function");
		expect(typeof createPersistedSignal).toBe("function");
		expect(typeof createPersistedStore).toBe("function");
		expect(typeof createPracticeActions).toBe("function");
		expect(typeof createReducedMotion).toBe("function");
		expect(typeof createSessionSnapshot).toBe("function");
		expect(typeof createShortcut).toBe("function");
		expect(typeof createSpecLoader).toBe("function");
		expect(typeof createTheme).toBe("function");
		expect(typeof createVoiceInput).toBe("function");
	});
});
