import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {renderHook, act} from "@testing-library/react";
import {useCountdownTimer} from "../useCountdownTimer";
function setDocumentHidden(hidden: boolean) {
	Object.defineProperty(document, "hidden", {value: hidden, configurable: true});
	document.dispatchEvent(new Event("visibilitychange"));
}
function advanceTime(ms: number) {
	vi.advanceTimersByTime(ms);
	vi.runOnlyPendingTimers();
}
describe("useCountdownTimer", () => {
	const rafIds = new Map<number, ReturnType<typeof setTimeout>>();
	let rafId = 0;
	let cancelAnimationFrameSpy: ReturnType<typeof vi.spyOn>;
	beforeEach(() => {
		vi.useFakeTimers({toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval"]});
		vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
			rafId++;
			const id = window.setTimeout(() => callback(Date.now()), 16);
			rafIds.set(rafId, id);
			return rafId;
		});
		cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(id => {
			const timeoutId = rafIds.get(id);
			if (timeoutId !== undefined) {
				window.clearTimeout(timeoutId);
				rafIds.delete(id);
			}
		});
		cancelAnimationFrameSpy.mockClear();
		setDocumentHidden(false);
	});
	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		rafIds.clear();
		rafId = 0;
	});
	it("start sets timeRemaining and isRunning", () => {
		const {result} = renderHook(() => useCountdownTimer());
		act(() => {
			result.current.start(5);
		});
		expect(result.current.timeRemaining).toBe(5);
		expect(result.current.isRunning).toBe(true);
	});
	it("countdown decrements every second", () => {
		const {result} = renderHook(() => useCountdownTimer());
		act(() => {
			result.current.start(5);
		});
		act(() => {
			advanceTime(1000);
		});
		expect(result.current.timeRemaining).toBe(4);
		act(() => {
			advanceTime(1000);
		});
		expect(result.current.timeRemaining).toBe(3);
		act(() => {
			advanceTime(1000);
		});
		expect(result.current.timeRemaining).toBe(2);
	});
	it("expires at 0 and stops", () => {
		const {result} = renderHook(() => useCountdownTimer());
		act(() => {
			result.current.start(2);
		});
		act(() => {
			advanceTime(1000);
		});
		expect(result.current.timeRemaining).toBe(1);
		expect(result.current.isRunning).toBe(true);
		act(() => {
			advanceTime(1000);
		});
		expect(result.current.timeRemaining).toBe(0);
		expect(result.current.isRunning).toBe(false);
	});
	it("pause and resume work", () => {
		const {result} = renderHook(() => useCountdownTimer());
		act(() => {
			result.current.start(5);
		});
		act(() => {
			advanceTime(2000);
		});
		expect(result.current.timeRemaining).toBe(3);
		act(() => {
			result.current.pause();
		});
		expect(result.current.isRunning).toBe(false);
		expect(result.current.timeRemaining).toBe(3);
		act(() => {
			advanceTime(5000);
		});
		expect(result.current.timeRemaining).toBe(3);
		act(() => {
			result.current.resume();
		});
		expect(result.current.isRunning).toBe(true);
		act(() => {
			advanceTime(2000);
		});
		expect(result.current.timeRemaining).toBe(1);
	});
	it("reset clears state", () => {
		const {result} = renderHook(() => useCountdownTimer());
		act(() => {
			result.current.start(5);
		});
		act(() => {
			advanceTime(2000);
		});
		act(() => {
			result.current.reset();
		});
		expect(result.current.timeRemaining).toBe(0);
		expect(result.current.isRunning).toBe(false);
		act(() => {
			advanceTime(2000);
		});
		expect(result.current.timeRemaining).toBe(0);
		expect(result.current.isRunning).toBe(false);
	});
	it("tab hidden pauses and visible resumes", () => {
		const {result} = renderHook(() => useCountdownTimer());
		act(() => {
			result.current.start(5);
		});
		act(() => {
			advanceTime(2000);
		});
		expect(result.current.timeRemaining).toBe(3);
		expect(result.current.isRunning).toBe(true);
		act(() => {
			setDocumentHidden(true);
		});
		expect(result.current.isRunning).toBe(false);
		expect(result.current.timeRemaining).toBe(3);
		act(() => {
			advanceTime(5000);
		});
		expect(result.current.timeRemaining).toBe(3);
		act(() => {
			setDocumentHidden(false);
		});
		expect(result.current.isRunning).toBe(true);
		act(() => {
			advanceTime(2000);
		});
		expect(result.current.timeRemaining).toBe(1);
	});
	it("has no drift after multiple seconds", () => {
		const {result} = renderHook(() => useCountdownTimer());
		act(() => {
			result.current.start(60);
		});
		act(() => {
			advanceTime(59000);
		});
		expect(result.current.timeRemaining).toBe(1);
		expect(result.current.isRunning).toBe(true);
		act(() => {
			advanceTime(1000);
		});
		expect(result.current.timeRemaining).toBe(0);
		expect(result.current.isRunning).toBe(false);
	});
	it("cleans up rAF on unmount", () => {
		const {result, unmount} = renderHook(() => useCountdownTimer());
		act(() => {
			result.current.start(5);
		});
		expect(cancelAnimationFrameSpy).not.toHaveBeenCalled();
		act(() => {
			unmount();
		});
		expect(cancelAnimationFrameSpy).toHaveBeenCalled();
	});
	it("accepts pauseOnFeedback option", () => {
		const {result} = renderHook(() => useCountdownTimer({pauseOnFeedback: true}));
		act(() => {
			result.current.start(5);
		});
		expect(result.current.timeRemaining).toBe(5);
		expect(result.current.isRunning).toBe(true);
	});
});
