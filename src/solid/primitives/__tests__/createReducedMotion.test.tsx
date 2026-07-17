import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import type {Accessor} from "solid-js";
import {createReducedMotion} from "../createReducedMotion";
import type {CreateReducedMotionOptions} from "../createReducedMotion";
type MqlListener = (event: MediaQueryListEvent) => void;
interface MqlMock {
    matches: boolean;
    media: string;
    onchange: null;
    addEventListener: (type: string, listener: MqlListener) => void;
    removeEventListener: (type: string, listener: MqlListener) => void;
    addListener: () => void;
    removeListener: () => void;
    dispatchEvent: () => boolean;
}
interface MatchMediaMock {
    (query: string): MqlMock;
    setMatches: (query: string, value: boolean) => void;
}
function createMatchMediaMock(): MatchMediaMock {
    let byQuery = new Map<string, {matches: boolean; listeners: Set<MqlListener>}>();
    let ensure = (query: string) => {
        let entry = byQuery.get(query);
        if (!entry) {
            entry = {matches: false, listeners: new Set()};
            byQuery.set(query, entry);
        }
        return entry;
    };
    let fn: MatchMediaMock = Object.assign(
        (query: string): MqlMock => {
            let entry = ensure(query);
            return {
                get matches() {
                    return entry.matches;
                },
                media: query,
                onchange: null,
                addEventListener: (type, listener) => {
                    if (type === "change") {
                        entry.listeners.add(listener);
                    }
                },
                removeEventListener: (type, listener) => {
                    if (type === "change") {
                        entry.listeners.delete(listener);
                    }
                },
                addListener: () => {},
                removeListener: () => {},
                dispatchEvent: () => false,
            };
        },
        {
            setMatches: (query: string, value: boolean) => {
                let entry = ensure(query);
                entry.matches = value;
                entry.listeners.forEach(listener => listener(Object.assign(new Event("change"), {matches: value, media: query})));
            },
        },
    );
    return fn;
}
let matchMediaMock: MatchMediaMock;
function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}
let result: Accessor<boolean> | null = null;
function makeRoot(opts: CreateReducedMotionOptions): () => JSX.Element {
    return () => {
        result = createReducedMotion(opts);
        return <div>motion</div>;
    };
}
beforeEach(() => {
    matchMediaMock = createMatchMediaMock();
    Object.defineProperty(window, "matchMedia", {writable: true, value: matchMediaMock});
    result = null;
});
describe("createReducedMotion", () => {
    it("returns false when the OS does not prefer reduced motion", async () => {
        matchMediaMock.setMatches("(prefers-reduced-motion: reduce)", false);
        render(makeRoot({}));
        await flush();
        expect(result!()).toBe(false);
    });
    it("returns true when the OS prefers reduced motion", async () => {
        matchMediaMock.setMatches("(prefers-reduced-motion: reduce)", true);
        render(makeRoot({}));
        await flush();
        expect(result!()).toBe(true);
    });
    it("updates when the OS preference changes", async () => {
        matchMediaMock.setMatches("(prefers-reduced-motion: reduce)", false);
        render(makeRoot({}));
        await flush();
        expect(result!()).toBe(false);
        matchMediaMock.setMatches("(prefers-reduced-motion: reduce)", true);
        expect(result!()).toBe(true);
        matchMediaMock.setMatches("(prefers-reduced-motion: reduce)", false);
        expect(result!()).toBe(false);
    });
    it("respects a custom query override", async () => {
        matchMediaMock.setMatches("(min-width: 1000px)", true);
        render(makeRoot({query: "(min-width: 1000px)"}));
        await flush();
        expect(result!()).toBe(true);
    });
    it("stops updating after disposal", async () => {
        matchMediaMock.setMatches("(prefers-reduced-motion: reduce)", false);
        let rendered = render(makeRoot({}));
        await flush();
        expect(result!()).toBe(false);
        rendered.unmount();
        matchMediaMock.setMatches("(prefers-reduced-motion: reduce)", true);
        expect(result!()).toBe(false);
    });
});
