import type {JSX, JSXElement} from "solid-js";
import {Show, createContext, createMemo, createSignal, splitProps, useContext} from "solid-js";
import styles from "./Accordion.module.css";
let idCounter = 0;
function generateId(): string {
    idCounter = idCounter + 1;
    return `solid-accordion-${idCounter}`;
}
interface AccordionContextValue {
    value: () => string | undefined;
    setValue: (next: string | undefined) => void;
    baseId: string;
}
let AccordionContext = createContext<AccordionContextValue>();
function useAccordionContext(): AccordionContextValue {
    let ctx = useContext(AccordionContext);
    if (!ctx) throw new Error("Accordion subcomponents must be rendered inside <Accordion>");
    return ctx;
}
interface ItemValueContextValue {
    value: () => string;
}
let ItemValueContext = createContext<ItemValueContextValue>();
function useItemValue(): string {
    let ctx = useContext(ItemValueContext);
    if (!ctx) throw new Error("AccordionTrigger and AccordionContent must be rendered inside <AccordionItem>");
    return ctx.value();
}
export interface AccordionProps {
    /** Single open item value (uncontrolled default). */
    defaultValue?: string;
    /** Controlled open item value; provide when type="single". */
    value?: string;
    /** Change handler for controlled single mode. */
    onValueChange?: (value: string) => void;
    /** Accordion children (`AccordionItem` elements). */
    children?: JSXElement;
    /** Additional class for the root element. */
    class?: string;
}
/** Root accordion allowing a single open item at a time. */
export function Accordion(props: AccordionProps): JSX.Element {
    let [local] = splitProps(props, ["defaultValue", "value", "onValueChange", "children", "class"]);
    let baseId = generateId();
    let isControlled = () => local.value !== undefined;
    let [internalValue, setInternalValue] = createSignal<string | undefined>(local.defaultValue);
    let activeValue = createMemo(() => (isControlled() ? local.value : internalValue()));
    let setValue = (next: string | undefined) => {
        if (!isControlled()) {
            setInternalValue(next);
        }
        local.onValueChange?.(next ?? "");
    };
    let ctx: AccordionContextValue = {value: activeValue, setValue, baseId};
    return (
        <AccordionContext.Provider value={ctx}>
            <div class={`${styles.root} ${local.class ?? ""}`} data-accordion-root="">
                {local.children}
            </div>
        </AccordionContext.Provider>
    );
}
export interface AccordionItemProps {
    value: string;
    children?: JSXElement;
    class?: string;
}
export function AccordionItem(props: AccordionItemProps): JSX.Element {
    let [local] = splitProps(props, ["value", "children", "class"]);
    let ctx = useAccordionContext();
    let isOpen = () => ctx.value() === local.value;
    let itemCtx: ItemValueContextValue = {value: () => local.value};
    return (
        <ItemValueContext.Provider value={itemCtx}>
            <div class={`${styles.item} ${local.class ?? ""}`} data-accordion-item={local.value} data-state={isOpen() ? "open" : "closed"}>
                {local.children}
            </div>
        </ItemValueContext.Provider>
    );
}
export interface AccordionTriggerProps {
    children?: JSXElement;
    class?: string;
}
export function AccordionTrigger(props: AccordionTriggerProps): JSX.Element {
    let [local] = splitProps(props, ["children", "class"]);
    let ctx = useAccordionContext();
    let itemValue = useItemValue();
    let isOpen = () => ctx.value() === itemValue;
    let triggerId = () => `${ctx.baseId}-trigger-${itemValue}`;
    let contentId = () => `${ctx.baseId}-content-${itemValue}`;
    return (
        <button
            id={triggerId()}
            type="button"
            aria-expanded={isOpen()}
            aria-controls={contentId()}
            class={`${styles.trigger} ${local.class ?? ""}`}
            onClick={() => ctx.setValue(isOpen() ? undefined : itemValue)}
        >
            {local.children}
            <svg class={`${styles.chevron} ${isOpen() ? styles.chevronOpen : ""}`} viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        </button>
    );
}
export interface AccordionContentProps {
    children?: JSXElement;
    class?: string;
}
export function AccordionContent(props: AccordionContentProps): JSX.Element {
    let [local] = splitProps(props, ["children", "class"]);
    let ctx = useAccordionContext();
    let itemValue = useItemValue();
    let isOpen = () => ctx.value() === itemValue;
    let contentId = () => `${ctx.baseId}-content-${itemValue}`;
    let triggerId = () => `${ctx.baseId}-trigger-${itemValue}`;
    return (
        <div id={contentId()} role="region" aria-labelledby={triggerId()} data-state={isOpen() ? "open" : "closed"} class={`${styles.content} ${isOpen() ? styles.contentOpen : ""}`}>
            <div class={`${styles.contentInner} ${local.class ?? ""}`}>
                <Show when={isOpen()}>
                    <div class={styles.contentBody}>{local.children}</div>
                </Show>
            </div>
        </div>
    );
}
