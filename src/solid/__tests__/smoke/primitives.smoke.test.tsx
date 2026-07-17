import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import {createTheme} from "../../primitives/createTheme";
import {createGlobalShortcuts} from "../../primitives/createGlobalShortcuts";
import {createSpecLoader} from "../../primitives/createSpecLoader";
import {createSessionSnapshot} from "../../primitives/createSessionSnapshot";
import {createPracticeActions} from "../../primitives/createPracticeActions";
import {createMcqHotReconfig} from "../../primitives/createMcqHotReconfig";
import {createReducedMotion} from "../../primitives/createReducedMotion";
import {createMediaQuery} from "../../primitives/createMediaQuery";
import {createCountUp} from "../../primitives/createCountUp";
import {createCountdownTimer} from "../../primitives/createCountdownTimer";
import {ServiceProvider} from "../../providers/ServiceProvider";
import {usePracticeStore} from "../../stores/practiceStore";
import {useProgressStore} from "../../stores/progressStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useSpecStore} from "../../stores/specStore";
import {useUiStore} from "../../stores/uiStore";
import type {ISessionService, SessionSnapshot, Session} from "../../../services/contracts";
import type {GeneratedQuestion, PracticeResult} from "../../../types/models";
function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}
type MqlListener = (event: MediaQueryListEvent) => void;
function createMatchMediaMock(): (query: string) => MediaQueryList {
    let byQuery = new Map<string, {matches: boolean; listeners: Set<MqlListener>}>();
    let ensure = (query: string) => {
        let entry = byQuery.get(query);
        if (!entry) {
            entry = {matches: false, listeners: new Set()};
            byQuery.set(query, entry);
        }
        return entry;
    };
    return (query: string) => {
        let entry = ensure(query);
        return {
            get matches() {
                return entry.matches;
            },
            media: query,
            onchange: null,
            addEventListener: (type: string, listener: MqlListener) => {
                if (type === "change") entry.listeners.add(listener);
            },
            removeEventListener: (type: string, listener: MqlListener) => {
                if (type === "change") entry.listeners.delete(listener);
            },
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
        } as MediaQueryList;
    };
}
function resetStores() {
    usePracticeStore.setState(usePracticeStore.getInitialState());
    useProgressStore.setState(useProgressStore.getInitialState());
    useSettingsStore.setState(useSettingsStore.getInitialState());
    useSpecStore.setState(useSpecStore.getInitialState());
    useUiStore.setState(useUiStore.getInitialState());
}
function fakeSessionService(): ISessionService {
    return {
        startSession: vi.fn<() => Promise<Session>>(async () => ({}) as Session),
        submitAnswer: vi.fn<() => Promise<PracticeResult>>(async () => ({}) as PracticeResult),
        advanceQuestion: vi.fn<() => Promise<boolean>>(async () => true),
        regenerateCurrentQuestionAs: vi.fn<() => Promise<GeneratedQuestion>>(async () => ({}) as GeneratedQuestion),
        finishSession: vi.fn<() => Promise<PracticeResult[]>>(async () => [] as PracticeResult[]),
        getSession: vi.fn<() => Session>(() => ({}) as Session),
        resumeSession: vi.fn<() => Promise<Session>>(async () => ({}) as Session),
        saveSessionSnapshot: vi.fn<() => Promise<null>>(async () => null),
        loadSessionSnapshot: vi.fn<() => Promise<null>>(async () => null),
        clearSessionSnapshot: vi.fn<() => void>(() => {}),
    };
}
interface Holder<T> {
    value: T;
}
beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {writable: true, value: createMatchMediaMock()});
    resetStores();
});
describe("primitives smoke", () => {
    it("createTheme initializes and applies data-theme without errors", () => {
        render(() => {
            createTheme();
            return <div>theme</div>;
        });
        expect(document.documentElement.getAttribute("data-theme")).toBeTruthy();
    });
    it("createGlobalShortcuts attaches a keydown listener without errors", () => {
        let result = render(() => {
            createGlobalShortcuts();
            return <div>shortcuts</div>;
        });
        expect(result.container.textContent).toContain("shortcuts");
    });
    it("createSpecLoader returns loading, error, and load accessor shape", () => {
        let holder: Holder<{load: () => Promise<void>; loading: () => boolean; error: () => unknown} | null> = {value: null};
        render(() => (
            <ServiceProvider>
                <div>
                    {(() => {
                        holder.value = createSpecLoader({autoLoad: false, loadDefaultSpec: async () => ""});
                        return null;
                    })()}
                </div>
            </ServiceProvider>
        ));
        expect(holder.value).not.toBeNull();
        expect(typeof holder.value!.load).toBe("function");
        expect(holder.value!.loading()).toBe(false);
        expect(holder.value!.error()).toBeNull();
    });
    it("createSessionSnapshot returns snapshot, resume, and discard accessors", () => {
        let holder: Holder<{snapshot: () => SessionSnapshot | null; resume: () => void; discard: () => void} | null> = {value: null};
        render(() => (
            <ServiceProvider>
                <div>
                    {(() => {
                        holder.value = createSessionSnapshot({sessionService: fakeSessionService()});
                        return null;
                    })()}
                </div>
            </ServiceProvider>
        ));
        expect(holder.value).not.toBeNull();
        expect(typeof holder.value!.resume).toBe("function");
        expect(typeof holder.value!.discard).toBe("function");
        expect(holder.value!.snapshot()).toBeNull();
    });
    it("createPracticeActions returns a check function", () => {
        let holder: Holder<{check: () => Promise<void>} | null> = {value: null};
        render(() => (
            <ServiceProvider>
                <div>
                    {(() => {
                        holder.value = createPracticeActions({sessionService: fakeSessionService()});
                        return null;
                    })()}
                </div>
            </ServiceProvider>
        ));
        expect(holder.value).not.toBeNull();
        expect(typeof holder.value!.check).toBe("function");
    });
    it("createMcqHotReconfig initializes without errors", () => {
        let result = render(() => (
            <ServiceProvider>
                <div>
                    {(() => {
                        createMcqHotReconfig({sessionService: fakeSessionService()});
                        return null;
                    })()}
                    mcq
                </div>
            </ServiceProvider>
        ));
        expect(result.container.textContent).toContain("mcq");
    });
    it("createReducedMotion returns a boolean accessor", () => {
        let holder: Holder<(() => boolean) | null> = {value: null};
        render(() => (
            <div>
                {(() => {
                    holder.value = createReducedMotion();
                    return null;
                })()}
            </div>
        ));
        expect(typeof holder.value).toBe("function");
        expect(typeof holder.value!()).toBe("boolean");
    });
    it("createMediaQuery returns a boolean accessor for a given query", () => {
        let holder: Holder<(() => boolean) | null> = {value: null};
        render(() => (
            <div>
                {(() => {
                    holder.value = createMediaQuery("(min-width: 1px)");
                    return null;
                })()}
            </div>
        ));
        expect(typeof holder.value).toBe("function");
        expect(typeof holder.value!()).toBe("boolean");
    });
    it("createCountUp returns a numeric accessor", async () => {
        let holder: Holder<(() => number) | null> = {value: null};
        render(() => (
            <div>
                {(() => {
                    holder.value = createCountUp({target: 10, duration: 50});
                    return null;
                })()}
            </div>
        ));
        expect(typeof holder.value).toBe("function");
        expect(typeof holder.value!()).toBe("number");
        await flush();
    });
    it("createCountdownTimer returns the expected accessor shape", () => {
        let holder: Holder<ReturnType<typeof createCountdownTimer> | null> = {value: null};
        render(() => (
            <div>
                {(() => {
                    holder.value = createCountdownTimer();
                    return null;
                })()}
            </div>
        ));
        expect(holder.value).not.toBeNull();
        expect(typeof holder.value!.start).toBe("function");
        expect(typeof holder.value!.pause).toBe("function");
        expect(typeof holder.value!.resume).toBe("function");
        expect(typeof holder.value!.reset).toBe("function");
        expect(typeof holder.value!.timeRemaining).toBe("function");
        expect(typeof holder.value!.isRunning).toBe("function");
        expect(holder.value!.timeRemaining()).toBe(0);
        expect(holder.value!.isRunning()).toBe(false);
    });
    it("createCountdownTimer start transitions isRunning to true", () => {
        let holder: Holder<ReturnType<typeof createCountdownTimer> | null> = {value: null};
        render(() => (
            <div>
                {(() => {
                    holder.value = createCountdownTimer();
                    return null;
                })()}
            </div>
        ));
        holder.value!.start(5);
        expect(holder.value!.isRunning()).toBe(true);
        expect(holder.value!.timeRemaining()).toBe(5);
        holder.value!.pause();
        expect(holder.value!.isRunning()).toBe(false);
        holder.value!.reset();
        expect(holder.value!.timeRemaining()).toBe(0);
    });
});
