import {forwardRef, InputHTMLAttributes, ReactNode, useId, useState} from "react";
import {cn} from "../../lib/utils";
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "checked" | "defaultChecked"> {
	/** Whether the switch is checked (controlled). */
	checked?: boolean;
	/** Default checked state (uncontrolled). */
	defaultChecked?: boolean;
	/** Callback fired when the checked state changes. */
	onCheckedChange?: (checked: boolean) => void;
	/** Label displayed next to the switch. */
	label?: ReactNode;
	/** Hint text displayed below the label. */
	hint?: ReactNode;
}
export const Switch=forwardRef<HTMLInputElement, SwitchProps>(function Switch({checked, defaultChecked, onCheckedChange, label, hint, className, id, disabled, ...props}, ref) {
	const generatedId=useId();
	const switchId=id || generatedId;
	const hintId=`${switchId}-hint`;
	const isControlled=checked !== undefined;
	const [internalChecked, setInternalChecked]=useState(Boolean(defaultChecked));
	const currentChecked=isControlled ? checked : internalChecked;
	const handleChange=(event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.disabled) return;
		const next=event.target.checked;
		if (!isControlled) {
			setInternalChecked(next);
		}
		onCheckedChange?.(next);
	};
	return (
		<label htmlFor={switchId} className={cn("inline-flex cursor-pointer items-center gap-3", disabled && "cursor-not-allowed opacity-50", className)}>
			<span className="relative inline-flex h-6 w-11 shrink-0 items-center">
				<input
					ref={ref}
					id={switchId}
					type="checkbox"
					role="switch"
					aria-checked={currentChecked}
					aria-describedby={hint ? hintId : undefined}
					disabled={disabled}
					checked={currentChecked}
					onChange={handleChange}
					className="peer sr-only"
					{...props}
				/>
				<span className={cn("absolute inset-0 rounded-full border border-border bg-surface-elevated transition-colors duration-fast peer-focus-visible:ring-2 peer-focus-visible:ring-accent-600 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface peer-disabled:cursor-not-allowed", currentChecked && "border-accent-600 bg-accent-600")} aria-hidden="true" />
				<span className={cn("absolute left-0.5 h-5 w-5 rounded-full bg-text-inverse shadow-sm transition-transform duration-fast", currentChecked && "translate-x-5")} aria-hidden="true" />
			</span>
			{(label || hint) && (
				<span className="flex flex-col">
					{label && <span className="text-sm font-medium text-text-primary">{label}</span>}
					{hint && <span id={hintId} className="text-sm text-text-muted">{hint}</span>}
				</span>
			)}
		</label>
	);
});
