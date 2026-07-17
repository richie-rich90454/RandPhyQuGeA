import {render} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, vi} from "vitest";
import type {JSX} from "solid-js";
import {createVoiceInput} from "../createVoiceInput";
import type {VoiceInputState} from "../createVoiceInput";
interface SpeechRecognitionAlternative {
    readonly transcript: string;
}
interface SpeechRecognitionResult {
    readonly 0: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    readonly item: (index: number) => SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstanceLike extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onend: (() => void) | null;
}
interface SpeechRecognitionConstructorLike {
    new (): SpeechRecognitionInstanceLike;
}
class FakeErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
    constructor(error: string, message: string = "") {
        super("error");
        this.error = error;
        this.message = message;
    }
}
function makeFakeCtor(): SpeechRecognitionConstructorLike & {instances: SpeechRecognitionInstanceLike[]} {
    let instances: SpeechRecognitionInstanceLike[] = [];
    class FakeInstance extends EventTarget implements SpeechRecognitionInstanceLike {
        lang = "";
        continuous = false;
        interimResults = false;
        maxAlternatives = 1;
        start = vi.fn<() => void>();
        stop = vi.fn<() => void>();
        abort = vi.fn<() => void>();
        onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
        onend: (() => void) | null = null;
        constructor() {
            super();
            instances.push(this);
        }
    }
    return Object.assign(FakeInstance, {instances});
}
function getInstance(ctor: {instances: SpeechRecognitionInstanceLike[]}, index: number = 0): SpeechRecognitionInstanceLike {
    let instance = ctor.instances[index];
    if (!instance) throw new Error(`Expected instance at index ${index}`);
    return instance;
}
function makeResultEvent(transcript: string, isFinal: boolean, resultIndex: number = 0): SpeechRecognitionEventLike {
    let alt: SpeechRecognitionAlternative = {transcript};
    let result: SpeechRecognitionResult = {0: alt, isFinal};
    let results: SpeechRecognitionResultList = {
        length: 1,
        item: () => result,
        0: result,
    };
    return {resultIndex, results};
}
function makeErrorEvent(code: string, message: string = ""): FakeErrorEvent {
    return new FakeErrorEvent(code, message);
}
let state: VoiceInputState | null = null;
function makeRoot(setup: () => VoiceInputState): () => JSX.Element {
    return () => {
        state = setup();
        return <div>voice</div>;
    };
}
beforeEach(() => {
    state = null;
    if (typeof window !== "undefined") {
        vi.stubGlobal("SpeechRecognition", undefined);
        vi.stubGlobal("webkitSpeechRecognition", undefined);
        vi.unstubAllGlobals();
    }
});
describe("createVoiceInput fallback (preventive fix, task 5.66)", () => {
    it("reports supported=false when no SpeechRecognition constructor is exposed", () => {
        render(makeRoot(() => createVoiceInput()));
        expect(state!.supported()).toBe(false);
    });
    it("start and stop are no-ops when unsupported", () => {
        render(makeRoot(() => createVoiceInput()));
        expect(state!.listening()).toBe(false);
        state!.start();
        expect(state!.listening()).toBe(false);
        state!.stop();
        expect(state!.listening()).toBe(false);
    });
    it("transcript stays empty when unsupported", () => {
        render(makeRoot(() => createVoiceInput()));
        expect(state!.transcript()).toBe("");
        state!.start();
        expect(state!.transcript()).toBe("");
    });
});
describe("createVoiceInput with a constructor", () => {
    it("reports supported=true when ctor option is provided", () => {
        let ctor = makeFakeCtor();
        render(makeRoot(() => createVoiceInput({ctor})));
        expect(state!.supported()).toBe(true);
    });
    it("start() constructs an instance, configures it, and flips listening to true", () => {
        let ctor = makeFakeCtor();
        render(makeRoot(() => createVoiceInput({ctor, lang: "en-US", continuous: false, interimResults: true})));
        state!.start();
        expect(ctor.instances.length).toBe(1);
        let instance = getInstance(ctor);
        expect(instance.lang).toBe("en-US");
        expect(instance.continuous).toBe(false);
        expect(instance.interimResults).toBe(true);
        expect(instance.maxAlternatives).toBe(1);
        expect(instance.start).toHaveBeenCalled();
        expect(state!.listening()).toBe(true);
    });
    it("start() is a no-op when already listening", () => {
        let ctor = makeFakeCtor();
        render(makeRoot(() => createVoiceInput({ctor})));
        state!.start();
        state!.start();
        expect(ctor.instances.length).toBe(1);
    });
    it("stop() calls recognition.stop and flips listening to false", () => {
        let ctor = makeFakeCtor();
        render(makeRoot(() => createVoiceInput({ctor})));
        state!.start();
        let instance = getInstance(ctor);
        state!.stop();
        expect(instance.stop).toHaveBeenCalled();
        expect(state!.listening()).toBe(false);
    });
    it("stop() is a no-op when not listening", () => {
        let ctor = makeFakeCtor();
        render(makeRoot(() => createVoiceInput({ctor})));
        state!.stop();
        expect(state!.listening()).toBe(false);
    });
    it("transcript updates from onresult with interim results", () => {
        let ctor = makeFakeCtor();
        render(makeRoot(() => createVoiceInput({ctor, interimResults: true})));
        state!.start();
        let instance = getInstance(ctor);
        instance.onresult?.(makeResultEvent("hello", false));
        expect(state!.transcript()).toBe("hello");
        instance.onresult?.(makeResultEvent("hello world", true));
        expect(state!.transcript()).toBe("hello world");
    });
    it("transcript ignores interim results when interimResults=false", () => {
        let ctor = makeFakeCtor();
        render(makeRoot(() => createVoiceInput({ctor, interimResults: false})));
        state!.start();
        let instance = getInstance(ctor);
        instance.onresult?.(makeResultEvent("partial", false));
        expect(state!.transcript()).toBe("");
        instance.onresult?.(makeResultEvent("final answer", true));
        expect(state!.transcript()).toBe("final answer");
    });
    it("error accessor surfaces onerror code and stops listening", () => {
        let ctor = makeFakeCtor();
        render(makeRoot(() => createVoiceInput({ctor})));
        state!.start();
        let instance = getInstance(ctor);
        instance.dispatchEvent(makeErrorEvent("not-allowed"));
        expect(state!.error()).toBe("not-allowed");
        expect(state!.listening()).toBe(false);
    });
    it("onend flips listening to false without setting an error", () => {
        let ctor = makeFakeCtor();
        render(makeRoot(() => createVoiceInput({ctor})));
        state!.start();
        let instance = getInstance(ctor);
        instance.onend?.();
        expect(state!.listening()).toBe(false);
        expect(state!.error()).toBe(null);
    });
    it("start() that throws is caught and surfaces start-failed error", () => {
        let ThrowingCtor: SpeechRecognitionConstructorLike = class extends EventTarget implements SpeechRecognitionInstanceLike {
            lang = "";
            continuous = false;
            interimResults = false;
            maxAlternatives = 1;
            start = () => {
                throw new Error("boom");
            };
            stop = vi.fn<() => void>();
            abort = vi.fn<() => void>();
            onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
            onend: (() => void) | null = null;
        };
        let state2: VoiceInputState | null = null;
        render(() => {
            state2 = createVoiceInput({ctor: ThrowingCtor});
            return <div>throwing</div>;
        });
        state2!.start();
        expect(state2!.error()).toBe("start-failed");
        expect(state2!.listening()).toBe(false);
    });
});
describe("createVoiceInput cleanup (preventive fix, task 5.66)", () => {
    it("aborts the recognition instance and clears handlers on disposal", () => {
        let ctor = makeFakeCtor();
        let rendered = render(makeRoot(() => createVoiceInput({ctor})));
        state!.start();
        let instance = getInstance(ctor);
        expect(instance.abort).not.toHaveBeenCalled();
        rendered.unmount();
        expect(instance.abort).toHaveBeenCalled();
        expect(instance.onresult).toBeNull();
        expect(instance.onend).toBeNull();
    });
    it("cleanup is a no-op when recognition was never started", () => {
        let ctor = makeFakeCtor();
        let rendered = render(makeRoot(() => createVoiceInput({ctor})));
        rendered.unmount();
        expect(ctor.instances.length).toBe(0);
    });
    it("a fresh primitive after disposal starts with listening=false", () => {
        let ctor = makeFakeCtor();
        let rendered = render(makeRoot(() => createVoiceInput({ctor})));
        state!.start();
        expect(state!.listening()).toBe(true);
        rendered.unmount();
        let state2: VoiceInputState | null = null;
        render(() => {
            state2 = createVoiceInput({ctor});
            return <div>fresh</div>;
        });
        expect(state2!.listening()).toBe(false);
    });
});
