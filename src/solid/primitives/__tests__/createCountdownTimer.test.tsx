import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import type {JSX} from "solid-js";
import {createCountdownTimer} from "../createCountdownTimer";
import type {CreateCountdownTimerOptions, CreateCountdownTimerReturn} from "../createCountdownTimer";
function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}
let currentTime = 0;
let dateSpy: ReturnType<typeof vi.spyOn>;
let pending: Map<number, (timestamp: number) => void> = new Map();
let nextRafId = 1;
let rafSpy: ReturnType<typeof vi.spyOn>;
let cancelSpy: ReturnType<typeof vi.spyOn>;
let result: CreateCountdownTimerReturn | null = null;
function makeRoot(opts?: CreateCountdownTimerOptions): () => JSX.Element {
    return () => {
        result = createCountdownTimer(opts);
        return <div>timer</div>;
    };
}
function tick(): void {
    let first = pending.entries().next();
    if (first.done) {
        return;
    }
    let [id, cb] = first.value;
    pending.delete(id);
    cb(currentTime);
}
function advanceTime(ms: number): void {
    currentTime += ms;
    tick();
}
function setDocumentHidden(hidden: boolean): void {
    Object.defineProperty(document, "hidden", {value: hidden, configurable: true});
    document.dispatchEvent(new Event("visibilitychange"));
}
beforeEach(() => {
    currentTime = 0;
    dateSpy = vi.spyOn(Date, "now").mockImplementation(() => currentTime);
    pending = new Map();
    nextRafId = 1;
    rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
        let id = nextRafId++;
        pending.set(id, callback);
        return id;
    });
    cancelSpy = vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id: number) => {
        pending.delete(id);
    });
    setDocumentHidden(false);
    result = null;
});
afterEach(() => {
    dateSpy.mockRestore();
    rafSpy.mockRestore();
    cancelSpy.mockRestore();
});
describe("createCountdownTimer", () => {
    it("start sets timeRemaining and isRunning", async () => {
        render(makeRoot());
        await flush();
        result!.start(5);
        expect(result!.timeRemaining()).toBe(5);
        expect(result!.isRunning()).toBe(true);
    });
    it("countdown decrements every second", async () => {
        render(makeRoot());
        await flush();
        result!.start(5);
        advanceTime(1000);
        expect(result!.timeRemaining()).toBe(4);
        advanceTime(1000);
        expect(result!.timeRemaining()).toBe(3);
        advanceTime(1000);
        expect(result!.timeRemaining()).toBe(2);
    });
    it("expires at 0 and stops", async () => {
        render(makeRoot());
        await flush();
        result!.start(2);
        advanceTime(1000);
        expect(result!.timeRemaining()).toBe(1);
        expect(result!.isRunning()).toBe(true);
        advanceTime(1000);
        expect(result!.timeRemaining()).toBe(0);
        expect(result!.isRunning()).toBe(false);
    });
    it("pause and resume work", async () => {
        render(makeRoot());
        await flush();
        result!.start(5);
        advanceTime(2000);
        expect(result!.timeRemaining()).toBe(3);
        result!.pause();
        expect(result!.isRunning()).toBe(false);
        expect(result!.timeRemaining()).toBe(3);
        advanceTime(5000);
        expect(result!.timeRemaining()).toBe(3);
        result!.resume();
        expect(result!.isRunning()).toBe(true);
        advanceTime(2000);
        expect(result!.timeRemaining()).toBe(1);
    });
    it("reset clears state", async () => {
        render(makeRoot());
        await flush();
        result!.start(5);
        advanceTime(2000);
        result!.reset();
        expect(result!.timeRemaining()).toBe(0);
        expect(result!.isRunning()).toBe(false);
        advanceTime(2000);
        expect(result!.timeRemaining()).toBe(0);
        expect(result!.isRunning()).toBe(false);
    });
    it("tab hidden pauses and visible resumes", async () => {
        render(makeRoot());
        await flush();
        result!.start(5);
        advanceTime(2000);
        expect(result!.timeRemaining()).toBe(3);
        expect(result!.isRunning()).toBe(true);
        setDocumentHidden(true);
        expect(result!.isRunning()).toBe(false);
        expect(result!.timeRemaining()).toBe(3);
        advanceTime(5000);
        expect(result!.timeRemaining()).toBe(3);
        setDocumentHidden(false);
        expect(result!.isRunning()).toBe(true);
        advanceTime(2000);
        expect(result!.timeRemaining()).toBe(1);
    });
    it("has no drift after multiple seconds", async () => {
        render(makeRoot());
        await flush();
        result!.start(60);
        advanceTime(59000);
        expect(result!.timeRemaining()).toBe(1);
        expect(result!.isRunning()).toBe(true);
        advanceTime(1000);
        expect(result!.timeRemaining()).toBe(0);
        expect(result!.isRunning()).toBe(false);
    });
    it("cleans up rAF on unmount", async () => {
        let rendered = render(makeRoot());
        await flush();
        result!.start(5);
        expect(cancelSpy).not.toHaveBeenCalled();
        rendered.unmount();
        expect(cancelSpy).toHaveBeenCalled();
    });
    it("accepts pauseOnFeedback option", async () => {
        render(makeRoot({pauseOnFeedback: true}));
        await flush();
        result!.start(5);
        expect(result!.timeRemaining()).toBe(5);
        expect(result!.isRunning()).toBe(true);
    });
    it("start with 0 duration stops immediately", async () => {
        render(makeRoot());
        await flush();
        result!.start(0);
        expect(result!.timeRemaining()).toBe(0);
        expect(result!.isRunning()).toBe(false);
        expect(pending.size).toBe(0);
    });
    it("resume does nothing when no time remains", async () => {
        render(makeRoot());
        await flush();
        result!.start(2);
        advanceTime(2000);
        expect(result!.isRunning()).toBe(false);
        result!.resume();
        expect(result!.isRunning()).toBe(false);
        expect(pending.size).toBe(0);
    });
});
