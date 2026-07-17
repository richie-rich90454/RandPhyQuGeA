import type {JSX, JSXElement} from "solid-js";
import {Show, splitProps} from "solid-js";
import styles from "./Pill.module.css";
export type PillVariant = "default" | "active" | "outline";
export type PillSize = "sm" | "md" | "lg";
export interface PillProps {
    /** Pill label text. */
    name: string;
    /** Optional leading icon. */
    icon?: JSXElement;
    /** Whether the pill is in an active/pressed state. */
    active?: boolean;
    /** Visual variant of the pill. */
    variant?: PillVariant;
    /** Pill size. */
    size?: PillSize;
    /** Click handler. */
    onClick?: () => void;
    /** Extra class for the pill. */
    class?: string;
    /** Accessible label override. */
    ariaLabel?: string;
    /** Whether the pill is disabled. */
    disabled?: boolean;
}
let variantClass: Record<PillVariant, string | undefined> = {
    default: styles.default,
    active: styles.active,
    outline: styles.outline,
};
let sizeClass: Record<PillSize, string | undefined> = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
};
/** Pill-shaped toggle button with variant, size, and optional icon. */
export function Pill(props: PillProps): JSX.Element {
    let [local] = splitProps(props, ["name", "icon", "active", "variant", "size", "onClick", "class", "ariaLabel", "disabled"]);
    let isActive = () => local.variant === "active" || Boolean(local.active);
    let resolvedVariant = () => (isActive() ? "active" : (local.variant ?? "default"));
    let size = local.size ?? "md";
    return (
        <button
            type="button"
            class={`${styles.pill} ${variantClass[resolvedVariant()] ?? ""} ${sizeClass[size] ?? ""} ${local.class ?? ""}`}
            onClick={local.onClick}
            aria-pressed={isActive()}
            aria-label={local.ariaLabel ?? local.name}
            disabled={local.disabled}
        >
            <Show when={local.icon}>
                <span class={styles.icon}>{local.icon}</span>
            </Show>
            <span class={styles.name}>{local.name}</span>
        </button>
    );
}
