import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from "react";
import {cn} from "../../lib/utils";
import {Spinner} from "./Spinner";
/** Visual style of a button. */
export type ButtonVariant="primary" | "secondary" | "ghost" | "danger" | "icon";
/** Available button sizes. */
export type ButtonSize="xs" | "sm" | "md" | "lg";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	/** Visual style. */
	variant?: ButtonVariant;
	/** Button size; defaults to md. */
	size?: ButtonSize;
	/** @deprecated Use loading instead. */
	isLoading?: boolean;
	/** Show a spinner and disable interaction while pending. */
	loading?: boolean;
	/** Optional leading icon rendered before the label. */
	leftIcon?: ReactNode;
	/** Optional trailing icon rendered after the label. */
	rightIcon?: ReactNode;
}
const variantStyles: Record<ButtonVariant, string>={
	primary: "primary-button bg-accent-600 text-text-inverse border border-white/20 shadow-elevated hover:bg-accent-700 hover:-translate-y-0.5 hover:shadow-hover focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 !active:scale-[0.98]",
	secondary: "secondary-button bg-surface text-text-primary border border-border hover:bg-surface-elevated hover:-translate-y-0.5 hover:shadow-rest focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 !active:scale-[0.98]",
	ghost: "bg-transparent text-text-secondary border border-transparent hover:bg-surface-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 !active:scale-[0.98]",
	danger: "bg-danger text-white border border-danger hover:bg-error-700 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-2 !active:scale-[0.98]",
	icon: "icon-button bg-surface-elevated text-text-secondary border border-border shadow-rest hover:text-accent-600 hover:-translate-y-0.5 hover:scale-105 hover:shadow-elevated focus-visible:outline-2 focus-visible:outline-accent-600 focus-visible:outline-offset-2 !active:scale-95",
};
const sizeStyles: Record<ButtonSize, string>={
	xs: "h-7 px-2 text-xs gap-1",
	sm: "h-8 px-2.5 text-sm gap-1.5",
	md: "h-9 px-3 text-sm gap-1.5",
	lg: "h-10 px-4 text-base gap-2",
};
const iconSizeStyles: Record<ButtonSize, string>={
	xs: "h-6 w-6 p-1",
	sm: "h-7 w-7 p-1",
	md: "h-8 w-8 p-1.5",
	lg: "h-9 w-9 p-1.5",
};
/**
 * Polymorphic button primitive with variants, sizes, and a loading state.
 *
 * Loading preserves the button's layout width by keeping the original
 * children in the document flow and overlaying the spinner absolutely.
 */
export const Button=forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{variant="primary", size="md", isLoading=false, loading, leftIcon, rightIcon, className, children, disabled, type="button", ...props},
	ref,
) {
	const busy=loading ?? isLoading;
	const isIcon=variant === "icon";
	const base="relative inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-fast ease-standard disabled:cursor-not-allowed disabled:opacity-50";
	const sizeClass=isIcon ? iconSizeStyles[size] : sizeStyles[size];
	return (
		<button ref={ref} type={type} className={cn(base, variantStyles[variant], sizeClass, className)} disabled={disabled || busy} {...props}>
			{busy && (
				<span className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<Spinner size="sm" />
				</span>
			)}
			<span className={cn("inline-flex items-center justify-center gap-[inherit]", busy && "invisible")}>
				{!busy && leftIcon && <span className="inline-flex">{leftIcon}</span>}
				{children}
				{!busy && rightIcon && <span className="inline-flex">{rightIcon}</span>}
			</span>
		</button>
	);
});
