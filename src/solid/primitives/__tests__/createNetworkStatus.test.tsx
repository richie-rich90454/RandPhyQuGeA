import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import type {JSX} from "solid-js";
import {createNetworkStatus} from "../createNetworkStatus";
import type {CreateNetworkStatusReturn} from "../createNetworkStatus";
let captured: CreateNetworkStatusReturn | null = null;
function makeRoot(opts?: Parameters<typeof createNetworkStatus>[0]): () => JSX.Element {
    return () => {
        captured = createNetworkStatus(opts);
        return <div>ns</div>;
    };
}
beforeEach(() => {
    captured = null;
    Object.defineProperty(navigator, "onLine", {value: true, configurable: true, writable: true});
});
describe("createNetworkStatus", () => {
    it("initializes online from navigator.onLine", () => {
        Object.defineProperty(navigator, "onLine", {value: true, configurable: true});
        render(makeRoot());
        expect(captured!.online()).toBe(true);
    });
    it("initializes offline when navigator.onLine is false", () => {
        Object.defineProperty(navigator, "onLine", {value: false, configurable: true});
        render(makeRoot());
        expect(captured!.online()).toBe(false);
    });
    it("accepts an explicit initialOnline override", () => {
        render(makeRoot({initialOnline: false}));
        expect(captured!.online()).toBe(false);
    });
    it("defaults forcedOffline to false", () => {
        render(makeRoot());
        expect(captured!.forcedOffline()).toBe(false);
    });
    it("accepts an initialForcedOffline override", () => {
        render(makeRoot({initialForcedOffline: true}));
        expect(captured!.forcedOffline()).toBe(true);
    });
    it("effectiveOnline is true when online and not forced offline", () => {
        Object.defineProperty(navigator, "onLine", {value: true, configurable: true});
        render(makeRoot());
        expect(captured!.effectiveOnline()).toBe(true);
    });
    it("effectiveOnline is false when forced offline even if online", () => {
        Object.defineProperty(navigator, "onLine", {value: true, configurable: true});
        render(makeRoot({initialForcedOffline: true}));
        expect(captured!.effectiveOnline()).toBe(false);
    });
    it("effectiveOnline is false when offline", () => {
        Object.defineProperty(navigator, "onLine", {value: false, configurable: true});
        render(makeRoot());
        expect(captured!.effectiveOnline()).toBe(false);
    });
    it("setForcedOffline updates the override", () => {
        render(makeRoot());
        expect(captured!.forcedOffline()).toBe(false);
        captured!.setForcedOffline(true);
        expect(captured!.forcedOffline()).toBe(true);
        captured!.setForcedOffline(false);
        expect(captured!.forcedOffline()).toBe(false);
    });
    it("toggleForcedOffline flips the override", () => {
        render(makeRoot());
        expect(captured!.forcedOffline()).toBe(false);
        captured!.toggleForcedOffline();
        expect(captured!.forcedOffline()).toBe(true);
        captured!.toggleForcedOffline();
        expect(captured!.forcedOffline()).toBe(false);
    });
    it("refresh re-reads navigator.onLine", () => {
        Object.defineProperty(navigator, "onLine", {value: true, configurable: true});
        render(makeRoot());
        expect(captured!.online()).toBe(true);
        Object.defineProperty(navigator, "onLine", {value: false, configurable: true});
        captured!.refresh();
        expect(captured!.online()).toBe(false);
    });
    it("subscribes to window online/offline events when listen is true", () => {
        let addSpy = vi.spyOn(window, "addEventListener");
        render(makeRoot({listen: true}));
        expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
        expect(addSpy).toHaveBeenCalledWith("offline", expect.any(Function));
        addSpy.mockRestore();
    });
    it("does not subscribe when listen is false", () => {
        let addSpy = vi.spyOn(window, "addEventListener");
        render(makeRoot({listen: false}));
        expect(addSpy).not.toHaveBeenCalledWith("online", expect.any(Function));
        expect(addSpy).not.toHaveBeenCalledWith("offline", expect.any(Function));
        addSpy.mockRestore();
    });
    it("updates online signal when the window fires an offline event", async () => {
        Object.defineProperty(navigator, "onLine", {value: true, configurable: true});
        render(makeRoot({listen: true}));
        expect(captured!.online()).toBe(true);
        window.dispatchEvent(new Event("offline"));
        expect(captured!.online()).toBe(false);
    });
    it("updates online signal when the window fires an online event", async () => {
        Object.defineProperty(navigator, "onLine", {value: false, configurable: true});
        render(makeRoot({listen: true, initialOnline: false}));
        expect(captured!.online()).toBe(false);
        window.dispatchEvent(new Event("online"));
        expect(captured!.online()).toBe(true);
    });
    it("removes window listeners on unmount", () => {
        let removeSpy = vi.spyOn(window, "removeEventListener");
        let rendered = render(makeRoot({listen: true}));
        rendered.unmount();
        expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
        removeSpy.mockRestore();
    });
});
