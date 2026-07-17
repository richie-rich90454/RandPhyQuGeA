import type {JSX, JSXElement} from "solid-js";
import {Show, createMemo, createSignal, splitProps} from "solid-js";
import styles from "./Switch.module.css";
export interface SwitchProps {
    /** Whether the switch is checked (controlled). */
    checked?: boolean;
    /** Default checked state (uncontrolled). */
    defaultChecked?: boolean;
    /** Callback fired when the checked state changes. */
    onCheckedChange?: (checked: boolean) => void;
    /** Label displayed next to the switch. */
    label?: JSXElement;
    /** Hint text displayed below the label. */
    hint?: JSXElement;
    /** Whether the switch is disabled. */
    disabled?: boolean;
    /** Optional id for the underlying input. */
    id?: string;
    /** Extra class for the wrapper label. */
    class?: string;
}
let idCounter = 0;
function generateId(): string {
    idCounter = idCounter + 1;
    return `solid-switch-${idCounter}`;
}
/** Toggle switch primitive with controlled and uncontrolled support. */
export function Switch(props: SwitchProps): JSX.Element {
    let [local] = splitProps(props, ["checked", "defaultChecked", "onCheckedChange", "label", "hint", "disabled", "id", "class"]);
    let generatedId = generateId();
    let switchId = () => local.id ?? generatedId;
    let hintId = () => `${switchId()}-hint`;
    let isControlled = () => local.checked !== undefined;
    let [internalChecked, setInternalChecked] = createSignal(Boolean(local.defaultChecked));
    let currentChecked = createMemo(() => (isControlled() ? Boolean(local.checked) : internalChecked()));
    let handleChange = (event: Event) => {
        let target = event.target as HTMLInputElement;
        if (target.disabled) return;
        let next = target.checked;
        if (!isControlled()) {
            setInternalChecked(next);
        }
        local.onCheckedChange?.(next);
    };
    return (
        <label for={switchId()} class={`${styles.root} ${local.disabled ? styles.disabled : ""} ${local.class ?? ""}`}>
            <span class={styles.trackWrap}>
                <input
                    id={switchId()}
                    type="checkbox"
                    role="switch"
                    aria-checked={currentChecked()}
                    aria-describedby={local.hint ? hintId() : undefined}
                    disabled={local.disabled}
                    checked={currentChecked()}
                    onChange={handleChange}
                    class={styles.input}
                />
                <span class={`${styles.track} ${currentChecked() ? styles.trackOn : ""}`} aria-hidden="true" />
                <span class={`${styles.thumb} ${currentChecked() ? styles.thumbOn : ""}`} aria-hidden="true" />
            </span>
            {local.label || local.hint ? (
                <span class={styles.text}>
                    <Show when={local.label}>
                        <span class={styles.label}>{local.label}</span>
                    </Show>
                    <Show when={local.hint}>
                        <span id={hintId()} class={styles.hint}>
                            {local.hint}
                        </span>
                    </Show>
                </span>
            ) : null}
        </label>
    );
}
