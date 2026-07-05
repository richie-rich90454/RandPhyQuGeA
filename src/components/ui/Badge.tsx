import {ReactNode} from "react";
import {cn} from "../../lib/utils";
type BadgeVariant = "default" | "success" | "warning" | "error" | "info";
type BadgeSize = "sm" | "md" | "lg";
export interface BadgeProps {
	variant?: BadgeVariant;
	size?: BadgeSize;
	children: ReactNode;
	className?: string;
}
let variantClasses: Record<BadgeVariant, string> = {
	default: "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100",
	success: "bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200",
	warning: "bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200",
	error: "bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200",
	info: "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200",
};
let sizeClasses: Record<BadgeSize, string> = {
	sm: "text-xs px-2 py-0.5",
	md: "text-xs px-2.5 py-0.5",
	lg: "text-sm px-3 py-1",
};
export function Badge({variant = "default", size = "md", children, className}: BadgeProps) {
	return <span className={cn("inline-flex items-center rounded-full font-medium", variantClasses[variant], sizeClasses[size], className)}>{children}</span>;
}
