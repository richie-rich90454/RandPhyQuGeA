import type {ReactNode} from "react";
import {cn} from "../../lib/utils";
export type PillVariant = "default" | "active" | "outline";
export type PillSize = "sm" | "md" | "lg";
export interface PillProps {
	name: string;
	icon?: ReactNode;
	active?: boolean;
	variant?: PillVariant;
	size?: PillSize;
	onClick?: () => void;
	className?: string;
	ariaLabel?: string;
}
let variantClasses: Record<PillVariant, string> = {
	default: "bg-surface text-text-primary border-border hover:bg-surface-elevated",
	active: "bg-accent-600 text-text-inverse border-accent-600",
	outline: "bg-transparent text-text-primary border-border hover:bg-surface-elevated",
};
let sizeClasses: Record<PillSize, string> = {
	sm: "text-xs px-2 py-0.5 gap-1",
	md: "text-xs px-2.5 py-1 gap-1",
	lg: "text-sm px-3 py-1.5 gap-1.5",
};
export function Pill({name, icon, active = false, variant = "default", size = "md", onClick, className, ariaLabel}: PillProps) {
	let isActive = variant === "active" || active;
	let resolvedVariant = isActive ? "active" : variant;
	return (
		<button type="button" className={cn("topic-pill inline-flex items-center rounded-full border transition-all duration-fast focus-visible:outline-2 focus-visible:outline-accent-600 focus-visible:outline-offset-2", variantClasses[resolvedVariant], sizeClasses[size], className)} onClick={onClick} aria-pressed={isActive} aria-label={ariaLabel ?? name}>
			{icon && <span className="topic-pill-icon">{icon}</span>}
			<span className="topic-pill-name">{name}</span>
		</button>
	);
}
