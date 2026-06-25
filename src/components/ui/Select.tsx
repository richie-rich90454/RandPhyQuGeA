import {forwardRef, SelectHTMLAttributes} from 'react';
import {cn} from '../../lib/utils';

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({label, options, className, id, ...props}, ref) {
	const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

	return (
		<div className="w-full">
			{label && (
				<label htmlFor={selectId} className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
					{label}
				</label>
			)}
			<select
				ref={ref}
				id={selectId}
				className={cn(
					'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100',
					className
				)}
				{...props}
			>
				{options.map(option => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
});
