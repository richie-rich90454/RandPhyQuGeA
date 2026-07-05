import {forwardRef, InputHTMLAttributes, ReactNode, useId} from "react";
import {cn} from "../../lib/utils";
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	hint?: ReactNode;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({label, error, hint, className, id, ...props}, ref) {
	const generatedId=useId();
	const inputId=id || generatedId;
	const errorId=`${inputId}-error`;
	const hintId=`${inputId}-hint`;
	const describedBy=[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
	return (
		<div className="w-full">
			{label && (
				<label htmlFor={inputId} className="mb-1 block text-sm font-medium text-text-secondary">
					{label}
				</label>
			)}
			<input
				ref={ref}
				id={inputId}
				aria-invalid={Boolean(error)}
				aria-describedby={describedBy}
				className={cn(
					"w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-[var(--accent-600)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-600)] disabled:cursor-not-allowed disabled:opacity-50",
					error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]",
					className,
				)}
				{...props}
			/>
			{error && <p id={errorId} className="mt-1 text-sm text-danger">{error}</p>}
			{hint && <p id={hintId} className="mt-1 text-sm text-text-muted">{hint}</p>}
		</div>
	);
});
