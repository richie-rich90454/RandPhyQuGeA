import {render} from "@solidjs/testing-library";
import {describe, it, expect, vi} from "vitest";
import type {JSX} from "solid-js";
import {createShortcut} from "../createShortcut";
function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}
function keydown(key: string, opts: {ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean} = {}): KeyboardEvent {
    let event = new KeyboardEvent("keydown", {
        key,
        ctrlKey: opts.ctrlKey ?? false,
        metaKey: opts.metaKey ?? false,
        shiftKey: opts.shiftKey ?? false,
        altKey: opts.altKey ?? false,
        bubbles: true,
        cancelable: true,
    });
    document.dispatchEvent(event);
    return event;
}
function ShortcutHost(props: {
    key: string;
    modifiers?: {ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean};
    enabled?: boolean;
    handler: (event: KeyboardEvent) => void;
    onReady?: (toggle: [() => boolean, (v: boolean) => void]) => void;
}): JSX.Element {
    let pair = createShortcut({key: props.key, modifiers: props.modifiers, handler: props.handler, enabled: props.enabled});
    if (props.onReady) props.onReady(pair);
    return <div>shortcut</div>;
}
describe("createShortcut", () => {
    it("fires the handler when the key and modifiers match", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        render(() => <ShortcutHost key="g" modifiers={{ctrl: true}} handler={handler} />);
        await flush();
        keydown("g", {ctrlKey: true});
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it("does not fire when the key does not match", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        render(() => <ShortcutHost key="g" modifiers={{ctrl: true}} handler={handler} />);
        await flush();
        keydown("h", {ctrlKey: true});
        expect(handler).not.toHaveBeenCalled();
    });
    it("matches letters case-insensitively", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        render(() => <ShortcutHost key="G" modifiers={{ctrl: true}} handler={handler} />);
        await flush();
        keydown("g", {ctrlKey: true});
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it("does not fire when an unspecified modifier is pressed (strict)", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        render(() => <ShortcutHost key="g" modifiers={{ctrl: true}} handler={handler} />);
        await flush();
        keydown("g", {ctrlKey: true, shiftKey: true});
        expect(handler).not.toHaveBeenCalled();
    });
    it("supports the meta modifier", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        render(() => <ShortcutHost key="k" modifiers={{meta: true}} handler={handler} />);
        await flush();
        keydown("k", {metaKey: true});
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it("supports shift and alt modifiers together", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        render(() => <ShortcutHost key="s" modifiers={{shift: true, alt: true}} handler={handler} />);
        await flush();
        keydown("s", {shiftKey: true, altKey: true});
        expect(handler).toHaveBeenCalledTimes(1);
        keydown("s", {shiftKey: true});
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it("matches a bare key with no modifiers", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        render(() => <ShortcutHost key="Escape" handler={handler} />);
        await flush();
        keydown("Escape");
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it("is disabled when enabled option is false", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        render(() => <ShortcutHost key="g" modifiers={{ctrl: true}} enabled={false} handler={handler} />);
        await flush();
        keydown("g", {ctrlKey: true});
        expect(handler).not.toHaveBeenCalled();
    });
    it("returns a signal pair that can toggle the binding on", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        let pair: [() => boolean, (v: boolean) => void] | null = null;
        render(() => (
            <ShortcutHost
                key="g"
                modifiers={{ctrl: true}}
                enabled={false}
                onReady={p => {
                    pair = p;
                }}
                handler={handler}
            />
        ));
        await flush();
        expect(pair).not.toBeNull();
        expect(pair![0]()).toBe(false);
        keydown("g", {ctrlKey: true});
        expect(handler).not.toHaveBeenCalled();
        pair![1](true);
        expect(pair![0]()).toBe(true);
        keydown("g", {ctrlKey: true});
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it("removes the listener on unmount", async () => {
        let handler = vi.fn<(event: KeyboardEvent) => void>();
        let result = render(() => <ShortcutHost key="g" modifiers={{ctrl: true}} handler={handler} />);
        await flush();
        result.unmount();
        keydown("g", {ctrlKey: true});
        expect(handler).not.toHaveBeenCalled();
    });
});
