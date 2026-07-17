import type {JSX, JSXElement} from "solid-js";
import {Show, createContext, createMemo, createSignal, splitProps, useContext} from "solid-js";
import styles from "./Tabs.module.css";
let idCounter = 0;
function generateId(): string {
    idCounter = idCounter + 1;
    return `solid-tabs-${idCounter}`;
}
interface TabsContextValue {
    active: () => string;
    setActive: (next: string) => void;
    baseId: string;
    ariaLabel?: string;
}
let TabsContext = createContext<TabsContextValue>();
function useTabsContext(): TabsContextValue {
    let ctx = useContext(TabsContext);
    if (!ctx) throw new Error("Tabs subcomponents must be rendered inside <Tabs>");
    return ctx;
}
export interface TabsProps {
    /** Controlled active tab value. */
    value?: string;
    /** Default active tab value (uncontrolled). */
    defaultValue?: string;
    /** Change handler for controlled usage. */
    onValueChange?: (value: string) => void;
    /** Tab children (`TabsList` and `TabsContent` elements). */
    children?: JSXElement;
    /** Additional class for the root element. */
    class?: string;
    /** Accessible label for the tablist. */
    ariaLabel?: string;
}
/** Root tabs component managing active value and keyboard navigation. */
export function Tabs(props: TabsProps): JSX.Element {
    let [local] = splitProps(props, ["value", "defaultValue", "onValueChange", "children", "class", "ariaLabel"]);
    let baseId = generateId();
    let isControlled = () => local.value !== undefined;
    let [internalValue, setInternalValue] = createSignal(local.defaultValue ?? "");
    let active = createMemo(() => (isControlled() ? (local.value ?? "") : internalValue()));
    let setActive = (next: string) => {
        if (!isControlled()) {
            setInternalValue(next);
        }
        local.onValueChange?.(next);
    };
    let ctx: TabsContextValue = {active, setActive, baseId, ariaLabel: local.ariaLabel};
    return (
        <TabsContext.Provider value={ctx}>
            <div class={`${styles.root} ${local.class ?? ""}`} data-tabs-root="">
                {local.children}
            </div>
        </TabsContext.Provider>
    );
}
export interface TabsListProps {
    children?: JSXElement;
    class?: string;
    ariaLabel?: string;
}
export function TabsList(props: TabsListProps): JSX.Element {
    let [local] = splitProps(props, ["children", "class", "ariaLabel"]);
    let ctx = useTabsContext();
    let [values, setValues] = createSignal<string[]>([]);
    let register = (value: string) => {
        setValues(prev => (prev.includes(value) ? prev : [...prev, value]));
    };
    let moveFocus = (delta: number) => {
        let list = values();
        if (list.length === 0) return;
        let currentIndex = list.findIndex(v => v === ctx.active());
        let nextIndex = currentIndex + delta;
        if (nextIndex < 0) nextIndex = list.length - 1;
        if (nextIndex >= list.length) nextIndex = 0;
        let nextValue = list[nextIndex];
        if (nextValue) {
            ctx.setActive(nextValue);
            let trigger = document.getElementById(`${ctx.baseId}-trigger-${nextValue}`);
            if (trigger) trigger.focus();
        }
    };
    let handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
                event.preventDefault();
                moveFocus(1);
                break;
            case "ArrowLeft":
            case "ArrowUp":
                event.preventDefault();
                moveFocus(-1);
                break;
            case "Home":
                event.preventDefault();
                {
                    let first = values()[0];
                    if (first) {
                        ctx.setActive(first);
                        let trigger = document.getElementById(`${ctx.baseId}-trigger-${first}`);
                        if (trigger) trigger.focus();
                    }
                }
                break;
            case "End":
                event.preventDefault();
                {
                    let list = values();
                    let last = list[list.length - 1];
                    if (last) {
                        ctx.setActive(last);
                        let trigger = document.getElementById(`${ctx.baseId}-trigger-${last}`);
                        if (trigger) trigger.focus();
                    }
                }
                break;
        }
    };
    return (
        <TabsListInternalContext.Provider value={{register}}>
            <div role="tablist" aria-label={local.ariaLabel ?? ctx.ariaLabel} onKeyDown={handleKeyDown} class={`${styles.list} ${local.class ?? ""}`}>
                {local.children}
            </div>
        </TabsListInternalContext.Provider>
    );
}
interface TabsListInternalContextValue {
    register: (value: string) => void;
}
let TabsListInternalContext = createContext<TabsListInternalContextValue>();
function useTabsListInternalContext(): TabsListInternalContextValue {
    let ctx = useContext(TabsListInternalContext);
    if (!ctx) throw new Error("TabsTrigger must be rendered inside <TabsList>");
    return ctx;
}
export interface TabsTriggerProps {
    value: string;
    children?: JSXElement;
    class?: string;
    disabled?: boolean;
}
export function TabsTrigger(props: TabsTriggerProps): JSX.Element {
    let [local] = splitProps(props, ["value", "children", "class", "disabled"]);
    let ctx = useTabsContext();
    let listCtx = useTabsListInternalContext();
    listCtx.register(local.value);
    let isActive = () => ctx.active() === local.value;
    return (
        <button
            type="button"
            role="tab"
            id={`${ctx.baseId}-trigger-${local.value}`}
            aria-selected={isActive()}
            tabIndex={isActive() ? 0 : -1}
            aria-controls={`${ctx.baseId}-panel-${local.value}`}
            data-tabs-trigger={local.value}
            disabled={local.disabled}
            onClick={() => ctx.setActive(local.value)}
            class={`${styles.trigger} ${isActive() ? styles.triggerActive : ""} ${local.class ?? ""}`}
        >
            {local.children}
        </button>
    );
}
export interface TabsContentProps {
    value: string;
    children?: JSXElement;
    class?: string;
}
export function TabsContent(props: TabsContentProps): JSX.Element {
    let [local] = splitProps(props, ["value", "children", "class"]);
    let ctx = useTabsContext();
    let isActive = () => ctx.active() === local.value;
    return (
        <Show when={isActive()}>
            <div role="tabpanel" id={`${ctx.baseId}-panel-${local.value}`} aria-labelledby={`${ctx.baseId}-trigger-${local.value}`} class={`${styles.panel} ${local.class ?? ""}`}>
                {local.children}
            </div>
        </Show>
    );
}
