import {forwardRef, type SelectHTMLAttributes} from 'react';
import {cn} from '../../lib/utils';
/** Select option value/label pair. */
export interface SelectOption {
	value: string;
	label: string;
}
/** Visual style, mapping to reference pill-shaped select classes. */
export type SelectVariant = 'scope' | 'difficulty' | 'default';
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	/** Optional visible label. */
	label?: string;
	/** Options rendered as `<option>` children. */
	options: SelectOption[];
	/** `scope`→`.scope-select`, `difficulty`→`.difficulty-select`, `default`→plain styled. */
	variant?: SelectVariant;
}
/** Select primitive mapped to the reference `.scope-select`/`.difficulty-select` classes. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({label, options, variant = 'default', className, id, ...props}, ref) {
	const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
	const variantClass = variant === 'scope' ? 'scope-select' : variant === 'difficulty' ? 'difficulty-select' : '';
	return (
		<div className="select-wrapper">
			{label && (
				<label htmlFor={selectId} className="select-label">
					{label}
				</label>
			)}
			<select ref={ref} id={selectId} className={cn(variantClass, className)} {...props}>
				{options.map(option => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
});
