import {cn} from '../../lib/utils';

export interface ProgressBarProps {
	value: number;
	className?: string;
	showLabel?: boolean;
}

export function ProgressBar({value, className, showLabel = false}: ProgressBarProps) {
	const clampedValue = Math.min(100, Math.max(0, value));

	return (
		<div className={cn('w-full', className)}>
			<div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
				<div className="h-full rounded-full bg-primary-600 transition-all duration-normal ease-standard" style={{width: `${clampedValue}%`}} />
			</div>
			{showLabel && <span className="mt-1 block text-right text-xs text-neutral-500">{Math.round(clampedValue)}%</span>}
		</div>
	);
}
