import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import type {Accessor, Setter} from "solid-js";
import {createPersistedSignal} from "../createPersistedSignal";
function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}
function SignalHost<T>(props: {key: string; defaultValue: T; onReady: (value: Accessor<T>, set: Setter<T>) => void}): JSX.Element {
    let [value, set] = createPersistedSignal<T>({key: props.key, defaultValue: props.defaultValue});
    props.onReady(value, set);
    return <div>signal</div>;
}
describe("createPersistedSignal", () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it("returns the default value when nothing is stored", async () => {
        let captured: {value: Accessor<string>} | null = null;
        render(() => (
            <SignalHost<string>
                key="test-key"
                defaultValue="default"
                onReady={value => {
                    captured = {value};
                }}
            />
        ));
        await flush();
        expect(captured!.value()).toBe("default");
    });
    it("hydrates from localStorage on init", async () => {
        localStorage.setItem("hydrate-key", JSON.stringify("stored"));
        let captured: {value: Accessor<string>} | null = null;
        render(() => (
            <SignalHost<string>
                key="hydrate-key"
                defaultValue="default"
                onReady={value => {
                    captured = {value};
                }}
            />
        ));
        await flush();
        expect(captured!.value()).toBe("stored");
    });
    it("persists to localStorage on set", async () => {
        let captured: {set: Setter<string>} | null = null;
        render(() => (
            <SignalHost<string>
                key="persist-key"
                defaultValue="default"
                onReady={(_value, set) => {
                    captured = {set};
                }}
            />
        ));
        await flush();
        captured!.set("updated");
        await flush();
        expect(localStorage.getItem("persist-key")).toBe(JSON.stringify("updated"));
    });
    it("persists object values via JSON", async () => {
        let captured: {set: Setter<{count: number}>} | null = null;
        render(() => (
            <SignalHost<{count: number}>
                key="obj-key"
                defaultValue={{count: 0}}
                onReady={(_value, set) => {
                    captured = {set};
                }}
            />
        ));
        await flush();
        captured!.set({count: 5});
        await flush();
        expect(JSON.parse(localStorage.getItem("obj-key") ?? "{}")).toEqual({count: 5});
    });
    it("hydrates object values from localStorage", async () => {
        localStorage.setItem("obj-hydrate", JSON.stringify({count: 9}));
        let captured: {value: Accessor<{count: number}>} | null = null;
        render(() => (
            <SignalHost<{count: number}>
                key="obj-hydrate"
                defaultValue={{count: 0}}
                onReady={value => {
                    captured = {value};
                }}
            />
        ));
        await flush();
        expect(captured!.value()).toEqual({count: 9});
    });
    it("falls back to default when stored JSON is malformed", async () => {
        localStorage.setItem("bad-key", "{not json");
        let captured: {value: Accessor<string>} | null = null;
        render(() => (
            <SignalHost<string>
                key="bad-key"
                defaultValue="fallback"
                onReady={value => {
                    captured = {value};
                }}
            />
        ));
        await flush();
        expect(captured!.value()).toBe("fallback");
    });
    it("supports updater functions and persists the resolved value", async () => {
        let captured: {value: Accessor<number>; set: Setter<number>} | null = null;
        render(() => (
            <SignalHost<number>
                key="updater-key"
                defaultValue={1}
                onReady={(value, set) => {
                    captured = {value, set};
                }}
            />
        ));
        await flush();
        captured!.set(prev => prev + 10);
        await flush();
        expect(captured!.value()).toBe(11);
        expect(localStorage.getItem("updater-key")).toBe(JSON.stringify(11));
    });
    it("returns the resolved value from the setter", async () => {
        let captured: {set: Setter<number>} | null = null;
        render(() => (
            <SignalHost<number>
                key="return-key"
                defaultValue={0}
                onReady={(_value, set) => {
                    captured = {set};
                }}
            />
        ));
        await flush();
        let result = captured!.set(42);
        expect(result).toBe(42);
    });
    it("persists numeric values", async () => {
        let captured: {value: Accessor<number>; set: Setter<number>} | null = null;
        render(() => (
            <SignalHost<number>
                key="num-key"
                defaultValue={0}
                onReady={(value, set) => {
                    captured = {value, set};
                }}
            />
        ));
        await flush();
        captured!.set(7);
        await flush();
        expect(captured!.value()).toBe(7);
        expect(localStorage.getItem("num-key")).toBe(JSON.stringify(7));
    });
});
