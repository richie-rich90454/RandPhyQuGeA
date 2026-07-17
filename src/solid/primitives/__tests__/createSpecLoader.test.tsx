import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach} from "vitest";
import type {JSX} from "solid-js";
import {createSpecLoader} from "../createSpecLoader";
import type {CreateSpecLoaderOptions, CreateSpecLoaderReturn} from "../createSpecLoader";
import {useSpecStore} from "../../stores/specStore";
import type {ISpecService} from "../../../services/contracts";
import type {Specification} from "../../../types/models";
function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}
function emptySpec(): Specification {
    return {units: [], topics: [], skills: [], templates: []};
}
function nonEmptySpec(): Specification {
    return {units: [], topics: [{id: "t1", name: "Topic 1", unit_id: "u1", description: "d"}], skills: [], templates: []};
}
function createMockSpecService(loadSpecImpl: (input: string) => Promise<Specification>): ISpecService {
    return {
        loadSpec: loadSpecImpl,
        validateSpec: async () => ({valid: true, errors: []}),
        previewTemplate: async () => [],
    };
}
function deferred(): {promise: Promise<string>; resolve: (v: string) => void; reject: (e: unknown) => void} {
    let resolve!: (v: string) => void;
    let reject!: (e: unknown) => void;
    let promise = new Promise<string>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {promise, resolve, reject};
}
let loader: CreateSpecLoaderReturn | null = null;
function makeRoot(opts: CreateSpecLoaderOptions): () => JSX.Element {
    return () => {
        loader = createSpecLoader(opts);
        return <div>loader</div>;
    };
}
beforeEach(() => {
    useSpecStore.setState(useSpecStore.getInitialState());
    loader = null;
});
describe("createSpecLoader", () => {
    it("loads the default spec and populates the store on success", async () => {
        let opts: CreateSpecLoaderOptions = {
            specStore: useSpecStore,
            specService: createMockSpecService(async () => nonEmptySpec()),
            loadDefaultSpec: async () => "spec text",
            autoLoad: false,
        };
        render(makeRoot(opts));
        let result = loader!;
        await result.load();
        expect(result.loading()).toBe(false);
        expect(result.error()).toBeNull();
        expect(useSpecStore.getState().loading).toBe(false);
        expect(useSpecStore.getState().error).toBeNull();
        expect(useSpecStore.getState().specification).not.toBeNull();
        expect(useSpecStore.getState().empty).toBe(false);
    });
    it("marks the store empty when topics and templates are both absent", async () => {
        let opts: CreateSpecLoaderOptions = {
            specStore: useSpecStore,
            specService: createMockSpecService(async () => emptySpec()),
            loadDefaultSpec: async () => "spec text",
            autoLoad: false,
        };
        render(makeRoot(opts));
        await loader!.load();
        expect(useSpecStore.getState().empty).toBe(true);
    });
    it("reports a network error when loadDefaultSpec rejects", async () => {
        let opts: CreateSpecLoaderOptions = {
            specStore: useSpecStore,
            specService: createMockSpecService(async () => nonEmptySpec()),
            loadDefaultSpec: async () => {
                throw new Error("offline");
            },
            autoLoad: false,
        };
        render(makeRoot(opts));
        let result = loader!;
        await result.load();
        expect(result.loading()).toBe(false);
        expect(result.error()?.type).toBe("network");
        expect(result.error()?.message).toBe("offline");
        expect(useSpecStore.getState().error?.type).toBe("network");
        expect(useSpecStore.getState().loading).toBe(false);
    });
    it("reports a parse error when specService.loadSpec rejects", async () => {
        let opts: CreateSpecLoaderOptions = {
            specStore: useSpecStore,
            specService: createMockSpecService(async () => {
                throw new Error("bad spec");
            }),
            loadDefaultSpec: async () => "spec text",
            autoLoad: false,
        };
        render(makeRoot(opts));
        let result = loader!;
        await result.load();
        expect(result.error()?.type).toBe("parse");
        expect(result.error()?.message).toBe("bad spec");
        expect(useSpecStore.getState().error?.type).toBe("parse");
    });
    it("exposes loading=true while the load is in flight", async () => {
        let d = deferred();
        let opts: CreateSpecLoaderOptions = {
            specStore: useSpecStore,
            specService: createMockSpecService(async () => nonEmptySpec()),
            loadDefaultSpec: () => d.promise,
            autoLoad: false,
        };
        render(makeRoot(opts));
        let result = loader!;
        let promise = result.load();
        expect(result.loading()).toBe(true);
        d.resolve("spec text");
        await promise;
        expect(result.loading()).toBe(false);
    });
    it("auto-loads on mount when autoLoad is not disabled", async () => {
        let opts: CreateSpecLoaderOptions = {
            specStore: useSpecStore,
            specService: createMockSpecService(async () => nonEmptySpec()),
            loadDefaultSpec: async () => "spec text",
        };
        render(makeRoot(opts));
        await flush();
        expect(useSpecStore.getState().specification).not.toBeNull();
        expect(useSpecStore.getState().loading).toBe(false);
    });
});
