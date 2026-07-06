import {describe, it, expect, beforeEach, vi} from "vitest";
import {renderHook, act} from "@testing-library/react";
import {useCountUp} from "../useCountUp";
function createMatchMedia(initialMatches: boolean): Window["matchMedia"] {
	return (query: string) => ({
		matches: initialMatches,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	});
}
beforeEach(() => {
	window.matchMedia = createMatchMedia(false);
	vi.useFakeTimers({shouldAdvanceTime: true});
});
describe("useCountUp", () => {
	it("returns the target immediately when reduced motion is preferred", () => {
		window.matchMedia = createMatchMedia(true);
		const {result} = renderHook(() => useCountUp(42));
		expect(result.current).toBe(42);
	});
	it("animates from zero toward the target", () => {
		const callbacks: Array<(timestamp: number) => void> = [];
		const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
			callbacks.push(callback);
			return callbacks.length;
		});
		const cancelSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
		const tick = (timestamp: number) => {
			act(() => {
				callbacks.shift()?.(timestamp);
			});
		};
		const {result} = renderHook(() => useCountUp(100, 100));
		expect(result.current).toBe(0);
		tick(0);
		expect(result.current).toBe(0);
		tick(50);
		expect(result.current).toBe(50);
		tick(100);
		expect(result.current).toBe(100);
		rafSpy.mockRestore();
		cancelSpy.mockRestore();
	});
	it("updates when the target changes", () => {
		const callbacks: Array<(timestamp: number) => void> = [];
		const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
			callbacks.push(callback);
			return callbacks.length;
		});
		const tick = (timestamp: number) => {
			act(() => {
				callbacks.shift()?.(timestamp);
			});
		};
		const {result, rerender} = renderHook(({target}) => useCountUp(target, 50), {initialProps: {target: 50}});
		tick(0);
		tick(50);
		expect(result.current).toBe(50);
		act(() => {
			rerender({target: 80});
		});
		expect(result.current).toBe(0);
		tick(0);
		tick(50);
		expect(result.current).toBe(80);
		rafSpy.mockRestore();
	});
});
