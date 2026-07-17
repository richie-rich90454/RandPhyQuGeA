import {createSignal, onMount, onCleanup} from "solid-js";
import type {Accessor, Setter} from "solid-js";
export interface ShortcutModifiers {
    /** Require the Ctrl modifier to be pressed. */
    ctrl?: boolean;
    /** Require the Shift modifier to be pressed. */
    shift?: boolean;
    /** Require the Alt modifier to be pressed. */
    alt?: boolean;
    /** Require the Meta (Cmd) modifier to be pressed. */
    meta?: boolean;
}
export interface CreateShortcutOptions {
    /** Logical key to match (e.g. "g", "Enter", "ArrowUp"); case-insensitive. */
    key: string;
    /** Required modifier state. Unspecified modifiers must be absent. */
    modifiers?: ShortcutModifiers;
    /** Called when the shortcut fires. */
    handler: (event: KeyboardEvent) => void;
    /** Initial enabled state; an accessor is read once for the seed value. */
    enabled?: Accessor<boolean> | boolean;
}
function resolveInitialEnabled(value: Accessor<boolean> | boolean | undefined): boolean {
    if (typeof value === "function") {
        return value();
    }
    return value ?? true;
}
/**
 * Register a keyboard shortcut on `document`.
 *
 * Solid primitive replacing `useGlobalShortcuts` for single-shortcut bindings:
 * a `keydown` listener is attached in `onMount` and removed in `onCleanup`,
 * so the binding is scoped to the owning component's lifetime. Modifier
 * matching is strict — every modifier in {@link ShortcutModifiers} must match
 * the event's state and any unspecified modifier must be absent, so
 * `Ctrl+G` does not fire for `Ctrl+Shift+G`. The key comparison is
 * case-insensitive. Returns a Solid signal pair `[isEnabled, setEnabled]`
 * seeded from the `enabled` option (default `true`) so callers can toggle the
 * binding imperatively without re-mounting.
 */
export function createShortcut(options: CreateShortcutOptions): [Accessor<boolean>, Setter<boolean>] {
    let [enabled, setEnabled] = createSignal<boolean>(resolveInitialEnabled(options.enabled));
    let mods = () => options.modifiers ?? {};
    let matches = (event: KeyboardEvent) => {
        let m = mods();
        let keyOk = event.key.toLowerCase() === options.key.toLowerCase();
        let ctrlOk = (m.ctrl ?? false) === event.ctrlKey;
        let shiftOk = (m.shift ?? false) === event.shiftKey;
        let altOk = (m.alt ?? false) === event.altKey;
        let metaOk = (m.meta ?? false) === event.metaKey;
        return keyOk && ctrlOk && shiftOk && altOk && metaOk;
    };
    let handleKeyDown = (event: KeyboardEvent) => {
        if (!enabled()) return;
        if (matches(event)) {
            options.handler(event);
        }
    };
    onMount(() => {
        document.addEventListener("keydown", handleKeyDown);
    });
    onCleanup(() => {
        document.removeEventListener("keydown", handleKeyDown);
    });
    return [enabled, setEnabled];
}
