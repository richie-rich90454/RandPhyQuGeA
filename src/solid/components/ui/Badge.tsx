import type {JSX, JSXElement} from "solid-js";
import {splitProps} from "solid-js";
import styles from "./Badge.module.css";
export type BadgeVariant = "default" | "success" | "warning" | "error" | "info";
export type BadgeSize = "sm" | "md" | "lg";
export interface BadgeProps {
	/** Visual variant of the badge. */
	variant?: BadgeVariant;
	/** Badge size. */
	size?: BadgeSize;
	/** Badge content. */
	children?: JSXElement;
	/** Extra class for the badge. */
	class?: string;
	/** Accessible label override for screen readers. */
	"aria-label"?: string;
	/** ARIA role for the badge element (e.g. "timer"). */
	role?: JSX.AriaAttributes["role"];
	/** ARIA live politeness for screen-reader announcements. */
	"aria-live"?: "polite" | "assertive" | "off";
	/** Whether the live region announces the full content on change. */
	"aria-atomic"?: "true" | "false";
}
let variantClass: Record<BadgeVariant, string | undefined> = {
	default: styles.default,
	success: styles.success,
	warning: styles.warning,
	error: styles.error,
	info: styles.info,
};
let sizeClass: Record<BadgeSize, string | undefined> = {
	sm: styles.sm,
	md: styles.md,
	lg: styles.lg,
};
/** Compact pill-shaped label for statuses and counts. */
export function Badge(props: BadgeProps): JSX.Element {
	let [local] = splitProps(props, ["variant", "size", "children", "class", "aria-label", "role", "aria-live", "aria-atomic"]);
	let variant = local.variant ?? "default";
	let size = local.size ?? "md";
	return (
		<span
			class={`${styles.badge} ${variantClass[variant] ?? ""} ${sizeClass[size] ?? ""} ${local.class ?? ""}`}
			aria-label={local["aria-label"]}
			role={local.role}
			aria-live={local["aria-live"]}
			aria-atomic={local["aria-atomic"]}
		>
			{local.children}
		</span>
	);
}
