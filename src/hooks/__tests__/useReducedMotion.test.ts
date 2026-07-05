import {describe, it, expect, beforeEach} from "vitest";
import {renderHook, act} from "@testing-library/react";
import {useReducedMotion} from "../useReducedMotion";
type MatchMediaMock = {
	matches: boolean;
	addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void;
	removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => void;
};
type MatchMediaFactory = {
	(): MatchMediaMock;
	setMatches: (value: boolean) => void;
};
function createMatchMedia(initialMatches: boolean): MatchMediaFactory {
	let matches = initialMatches;
	const listeners = new Set<(event: MediaQueryListEvent) => void>();
	const mock = (): MatchMediaMock => ({
		matches,
		addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
			if (type === "change") listeners.add(listener);
		},
		removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
			if (type === "change") listeners.delete(listener);
		},
	});
	mock.setMatches = (value: boolean) => {
		matches = value;
		listeners.forEach(listener => listener({matches} as MediaQueryListEvent));
	};
	return mock;
}
describe("useReducedMotion", () => {
	beforeEach(() => {
		Object.defineProperty(window, "matchMedia", {writable: true, value: createMatchMedia(false)});
	});
	it("returns false when motion is not reduced", () => {
		const {result} = renderHook(() => useReducedMotion());
		expect(result.current.reducedMotion).toBe(false);
	});
	it("returns true when motion is reduced", () => {
		Object.defineProperty(window, "matchMedia", {writable: true, value: createMatchMedia(true)});
		const {result} = renderHook(() => useReducedMotion());
		expect(result.current.reducedMotion).toBe(true);
	});
	it("updates when the media query changes", () => {
		const matchMedia = createMatchMedia(false);
		Object.defineProperty(window, "matchMedia", {writable: true, value: matchMedia});
		const {result} = renderHook(() => useReducedMotion());
		act(() => {
			matchMedia.setMatches(true);
		});
		expect(result.current.reducedMotion).toBe(true);
	});
});
