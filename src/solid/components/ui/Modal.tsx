import type {JSX, JSXElement} from "solid-js";
import {Show, createEffect, createSignal, onCleanup, splitProps} from "solid-js";
import {Portal} from "solid-js/web";
import styles from "./Modal.module.css";
/** Selector matching focusable descendants used by the focus trap. */
let FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
export interface ModalProps {
    /** When true the modal is rendered. */
    open: boolean;
    /** Called when the user requests dismissal (Escape/backdrop/close button). */
    onClose: () => void;
    /** Dialog title rendered in the header. */
    title?: string;
    /** Labelled-by id override for the title heading. */
    titleId?: string;
    /** Id applied to the outer modal element. */
    modalId?: string;
    /** Modal body content. */
    children?: JSXElement;
    /** Optional footer actions. */
    footer?: JSXElement;
    /** Extra classes appended to the modal content. */
    class?: string;
    /** Accessible name when no title is supplied. */
    ariaLabel?: string;
    /** Ref callback forwarded to the scrollable modal-content container. */
    scrollerRef?: (el: HTMLElement | null) => void;
}
/**
 * Modal dialog rendered into a portal on document.body.
 *
 * Escape and backdrop clicks call onClose. A focus trap cycles Tab through
 * focusable descendants, focus moves to the first element on open, and the
 * previously focused element is restored on close. Body scroll is locked
 * while open. All setup is torn down via onCleanup.
 */
export function Modal(props: ModalProps): JSX.Element {
    let [local] = splitProps(props, ["open", "onClose", "title", "titleId", "modalId", "children", "footer", "class", "ariaLabel", "scrollerRef"]);
    let [containerEl, setContainerEl] = createSignal<HTMLDivElement | null>(null);
    let labelledBy = () => (local.title ? (local.titleId ?? "modal-title") : undefined);
    createEffect(() => {
        let open = local.open;
        let container = containerEl();
        if (!open || !container) return;
        let previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        let previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        let focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        let closeButton = container.querySelector<HTMLButtonElement>('[data-modal-close="true"]');
        let target = closeButton ?? focusables[0] ?? container;
        target.focus();
        let handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                local.onClose();
                return;
            }
            if (event.key !== "Tab") return;
            let node = containerEl();
            if (!node) return;
            let items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
            if (items.length === 0) {
                event.preventDefault();
                node.focus();
                return;
            }
            let first = items[0];
            let last = items[items.length - 1];
            if (!first || !last) return;
            let active = document.activeElement;
            if (event.shiftKey) {
                if (active === first || !node.contains(active)) {
                    event.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last || !node.contains(active)) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        let handleFocusIn = (event: FocusEvent) => {
            let node = containerEl();
            if (!node) return;
            let eventTarget = event.target instanceof HTMLElement ? event.target : null;
            if (eventTarget && !node.contains(eventTarget)) {
                let items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
                if (items.length > 0) {
                    let first = items[0];
                    if (first) first.focus();
                } else {
                    node.focus();
                }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("focusin", handleFocusIn);
        onCleanup(() => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("focusin", handleFocusIn);
            document.body.style.overflow = previousOverflow;
            if (previousFocus) previousFocus.focus();
        });
    });
    let setRef = (el: HTMLDivElement | null) => {
        setContainerEl(el);
        if (local.scrollerRef) local.scrollerRef(el);
    };
    return (
        <Show when={local.open}>
            <Portal mount={document.body}>
                <div
                    id={local.modalId}
                    class={`${styles.modal} ${styles.show}`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={labelledBy()}
                    aria-label={local.title ? undefined : local.ariaLabel}
                    onClick={local.onClose}
                >
                    <div ref={setRef} tabIndex={-1} class={`${styles.content} glass ${local.class ?? ""}`} onClick={event => event.stopPropagation()}>
                        <div class={styles.header}>
                            <Show when={local.title}>
                                <h2 id={labelledBy() ?? undefined} class={styles.title}>
                                    {local.title}
                                </h2>
                            </Show>
                            <button type="button" data-modal-close="true" class={styles.iconButton} aria-label="Close dialog" onClick={local.onClose}>
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>
                        <div class={styles.body}>{local.children}</div>
                        <Show when={local.footer}>
                            <div class={styles.footer}>{local.footer}</div>
                        </Show>
                    </div>
                </div>
            </Portal>
        </Show>
    );
}
