import {createSignal, onCleanup, onMount} from "solid-js";
import type {Accessor} from "solid-js";
export interface CreateNetworkStatusOptions {
    /** Initial forced-offline override; defaults to false. */
    initialForcedOffline?: boolean;
    /** Whether to subscribe to window online/offline events; defaults to true. */
    listen?: boolean;
    /** Initial online value; defaults to navigator.onLine. */
    initialOnline?: boolean;
}
export interface CreateNetworkStatusReturn {
    /** Reactive true when the browser reports an online connection. */
    online: Accessor<boolean>;
    /** Reactive true when the user has forced offline mode for testing. */
    forcedOffline: Accessor<boolean>;
    /** Effective online state: online() && !forcedOffline(). */
    effectiveOnline: Accessor<boolean>;
    /** Set the forced-offline override (used by the testing toggle). */
    setForcedOffline: (value: boolean) => void;
    /** Toggle the forced-offline override. */
    toggleForcedOffline: () => void;
    /** Re-read navigator.onLine and update the signal. */
    refresh: () => void;
}
/**
 * Track the browser network status and expose a reactive view of it. The
 * primitive subscribes to the window `online`/`offline` events (removable via
 * `onCleanup`) and also exposes a "forced offline" override so the testing
 * offline-toggle can simulate disconnection without disabling the network.
 * `effectiveOnline` combines the actual connection state with the override.
 */
export function createNetworkStatus(options: CreateNetworkStatusOptions = {}): CreateNetworkStatusReturn {
    let listen = options.listen ?? true;
    let [online, setOnline] = createSignal<boolean>(options.initialOnline ?? (typeof navigator !== "undefined" ? navigator.onLine : true));
    let [forcedOffline, setForcedOffline] = createSignal<boolean>(options.initialForcedOffline ?? false);
    let handleOnline = () => setOnline(true);
    let handleOffline = () => setOnline(false);
    onMount(() => {
        if (!listen) return;
        if (typeof window === "undefined") return;
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        onCleanup(() => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        });
    });
    let effectiveOnline = () => online() && !forcedOffline();
    let toggleForcedOffline = () => setForcedOffline(!forcedOffline());
    let refresh = () => {
        if (typeof navigator !== "undefined") setOnline(navigator.onLine);
    };
    return {online, forcedOffline, effectiveOnline, setForcedOffline, toggleForcedOffline, refresh};
}
