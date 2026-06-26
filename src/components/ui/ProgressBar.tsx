import {cn} from '../../lib/utils';
export interface ProgressBarProps {
	/** Completion percentage clamped to 0–100. */
	value: number;
	className?: string;
}
/**
 * Progress bar mapped to the reference `.mental-progress` track and
 * `.progress-bar` fill. Exposes `role="progressbar"` with ARIA value
 * attributes for assistive technology.
 */
export function ProgressBar({value, className}: ProgressBarProps) {
	const clamped = Math.min(100, Math.max(0, value));
	return (
		<div className={cn('mental-progress', className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped)}>
			<div className="progress-bar" style={{width: `${clamped}%`}} />
		</div>
	);
}
