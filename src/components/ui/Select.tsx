import {forwardRef, type ReactNode, type SelectHTMLAttributes, useId} from "react";
import {CaretDown} from "@phosphor-icons/react";
import {cn} from "../../lib/utils";
/** Select option value/label pair. */
export interface SelectOption {
	value: string;
	label: string;
}
/** Visual style, mapping to reference pill-shaped select classes. */
export type SelectVariant = "scope" | "difficulty" | "default";
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	/** Optional visible label. */
	label?: string;
	/** Optional error message. */
	error?: string;
	/** Optional hint text. */
	hint?: ReactNode;
	/** Options rendered as `<option>` children. */
	options: SelectOption[];
	/** `scope`→`.scope-select`, `difficulty`→`.difficulty-select`, `default`→plain styled. */
	variant?: SelectVariant;
}
/** Select primitive with design-token styling, error/hint states, and a custom chevron. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({label, error, hint, options, variant = "default", className, id, ...props}, ref) {
	const generatedId=useId();
	const selectId=id || generatedId;
	const errorId=`${selectId}-error`;
	const hintId=`${selectId}-hint`;
	const describedBy=[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
	const variantClass=variant === "scope" ? "scope-select" : variant === "difficulty" ? "difficulty-select" : "";
	return (
		<div className="w-full">
			{label && (
				<label htmlFor={selectId} className="mb-1 block text-sm font-medium text-text-secondary">
					{label}
				</label>
			)}
			<div className="relative">
				<select
					ref={ref}
					id={selectId}
					aria-invalid={Boolean(error)}
					aria-describedby={describedBy}
					className={cn(
						"w-full appearance-none rounded-md border border-border bg-surface px-3 py-2 pr-9 text-sm text-text-primary focus:border-[var(--accent-600)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-600)] disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]",
						variantClass,
						className,
					)}
					{...props}>
					{options.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
			</div>
			{error && <p id={errorId} className="mt-1 text-sm text-danger">{error}</p>}
			{hint && <p id={hintId} className="mt-1 text-sm text-text-muted">{hint}</p>}
		</div>
	);
});
