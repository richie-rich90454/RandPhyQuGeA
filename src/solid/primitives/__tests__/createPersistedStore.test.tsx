import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import type {SetStoreFunction} from "solid-js/store";
import {createPersistedStore} from "../createPersistedStore";
interface CountState {
    count: number;
    nested: {value: number};
}
function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}
function StoreHost(props: {onReady: (store: CountState, setStore: SetStoreFunction<CountState>) => void}): JSX.Element {
    let [store, setStore] = createPersistedStore<CountState>({key: "store-key", defaultValue: {count: 0, nested: {value: 0}}});
    props.onReady(store, setStore);
    return <div>store</div>;
}
describe("createPersistedStore", () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it("returns the default store when nothing is stored", async () => {
        let captured: {store: CountState} | null = null;
        render(() => (
            <StoreHost
                onReady={store => {
                    captured = {store};
                }}
            />
        ));
        await flush();
        expect(captured!.store.count).toBe(0);
        expect(captured!.store.nested.value).toBe(0);
    });
    it("hydrates from localStorage on init", async () => {
        localStorage.setItem("store-key", JSON.stringify({count: 3, nested: {value: 7}}));
        let captured: {store: CountState} | null = null;
        render(() => (
            <StoreHost
                onReady={store => {
                    captured = {store};
                }}
            />
        ));
        await flush();
        expect(captured!.store.count).toBe(3);
        expect(captured!.store.nested.value).toBe(7);
    });
    it("persists top-level changes to localStorage", async () => {
        let captured: {store: CountState; setStore: SetStoreFunction<CountState>} | null = null;
        render(() => (
            <StoreHost
                onReady={(store, setStore) => {
                    captured = {store, setStore};
                }}
            />
        ));
        await flush();
        captured!.setStore("count", 12);
        await flush();
        expect(captured!.store.count).toBe(12);
        let stored = JSON.parse(localStorage.getItem("store-key") ?? "{}");
        expect(stored.count).toBe(12);
    });
    it("persists nested changes to localStorage", async () => {
        let captured: {store: CountState; setStore: SetStoreFunction<CountState>} | null = null;
        render(() => (
            <StoreHost
                onReady={(store, setStore) => {
                    captured = {store, setStore};
                }}
            />
        ));
        await flush();
        captured!.setStore("nested", "value", 42);
        await flush();
        expect(captured!.store.nested.value).toBe(42);
        let stored = JSON.parse(localStorage.getItem("store-key") ?? "{}");
        expect(stored.nested.value).toBe(42);
    });
    it("falls back to default when stored JSON is malformed", async () => {
        localStorage.setItem("store-key", "{not json");
        let captured: {store: CountState} | null = null;
        render(() => (
            <StoreHost
                onReady={store => {
                    captured = {store};
                }}
            />
        ));
        await flush();
        expect(captured!.store.count).toBe(0);
    });
    it("persists a full object replacement", async () => {
        let captured: {setStore: SetStoreFunction<CountState>} | null = null;
        render(() => (
            <StoreHost
                onReady={(_store, setStore) => {
                    captured = {setStore};
                }}
            />
        ));
        await flush();
        captured!.setStore({count: 99, nested: {value: 100}});
        await flush();
        let stored = JSON.parse(localStorage.getItem("store-key") ?? "{}");
        expect(stored.count).toBe(99);
        expect(stored.nested.value).toBe(100);
    });
});
