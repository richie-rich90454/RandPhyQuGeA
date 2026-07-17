import type {ComponentProps, JSX, JSXElement} from "solid-js";
import {Show, createMemo, splitProps} from "solid-js";
import styles from "./Button.module.css";
/** Visual style of a button. */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "icon";
/** Available button sizes. */
export type ButtonSize = "xs" | "sm" | "md" | "lg";
export interface ButtonProps extends ComponentProps<"button"> {
    /** Visual style. */
    variant?: ButtonVariant;
    /** Button size; defaults to md. */
    size?: ButtonSize;
    /** @deprecated Use loading instead. */
    isLoading?: boolean;
    /** Show a spinner and disable interaction while pending. */
    loading?: boolean;
    /** Optional leading icon rendered before the label. */
    leftIcon?: JSXElement;
    /** Optional trailing icon rendered after the label. */
    rightIcon?: JSXElement;
}
let variantClass: Record<ButtonVariant, string | undefined> = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
    icon: styles.iconVariant,
};
let sizeClass: Record<ButtonSize, string | undefined> = {
    xs: styles.xs,
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
};
let iconSizeClass: Record<ButtonSize, string | undefined> = {
    xs: styles.iconXs,
    sm: styles.iconSm,
    md: styles.iconMd,
    lg: styles.iconLg,
};
/**
 * Button primitive with variants, sizes, and a loading state.
 *
 * Loading preserves the button's layout width by keeping the original
 * children in the document flow and overlaying the spinner absolutely.
 */
export function Button(props: ButtonProps): JSX.Element {
    let [local, others] = splitProps(props, ["variant", "size", "isLoading", "loading", "leftIcon", "rightIcon", "class", "children", "disabled", "type", "aria-busy"]);
    let variant = local.variant ?? "primary";
    let size = local.size ?? "md";
    let isIcon = variant === "icon";
    let busy = createMemo(() => local.loading ?? local.isLoading ?? false);
    let sizeC = isIcon ? (iconSizeClass[size] ?? "") : (sizeClass[size] ?? "");
    return (
        <button
            type={local.type ?? "button"}
            class={`${styles.base} ${variantClass[variant] ?? ""} ${sizeC} ${local.class ?? ""}`}
            disabled={local.disabled || busy()}
            aria-busy={local["aria-busy"] ?? busy()}
            {...others}
        >
            <Show when={busy()}>
                <span class={styles.spinner} aria-hidden="true" />
            </Show>
            <span class={`${styles.content} ${busy() ? styles.invisible : ""}`}>
                <Show when={!busy() && local.leftIcon}>
                    <span class={styles.iconWrap}>{local.leftIcon}</span>
                </Show>
                {local.children}
                <Show when={!busy() && local.rightIcon}>
                    <span class={styles.iconWrap}>{local.rightIcon}</span>
                </Show>
            </span>
        </button>
    );
}
