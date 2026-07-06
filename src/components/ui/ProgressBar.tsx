import {cn} from "../../lib/utils";
export interface ProgressBarProps {
	/** Completion percentage clamped to 0–100. */
	value?: number;
	/** Render an animated indeterminate bar. */
	indeterminate?: boolean;
	className?: string;
	/** Accessible name for the progress bar. Defaults to "Progress". */
	ariaLabel?: string;
}
/**
 * Progress bar mapped to the reference `.mental-progress` track and
 * `.progress-bar` fill. Exposes `role="progressbar"` with ARIA value
 * attributes for assistive technology.
 */
export function ProgressBar({value=0, indeterminate=false, className, ariaLabel="Progress"}: ProgressBarProps) {
	const clamped=Math.min(100, Math.max(0, value));
	const rounded=Math.round(clamped);
	return (
		<div
			className={cn("mental-progress h-1 w-full overflow-hidden rounded-full bg-border shadow-rest", className)}
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={indeterminate ? undefined : rounded}
			aria-valuetext={indeterminate ? undefined : `${rounded}%`}
			aria-label={ariaLabel}
		>
			{indeterminate ? (
				<div className="progress-bar progress-bar-indeterminate h-full rounded-full bg-accent-600" />
			) : (
				<div className="progress-bar h-full rounded-full bg-accent-600 transition-all duration-200" style={{width: `${clamped}%`}} />
			)}
		</div>
	);
}
