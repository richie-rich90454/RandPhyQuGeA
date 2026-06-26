import {type ChangeEvent} from 'react';
import {cn} from '../../lib/utils';
export interface SliderProps {
	/** Minimum selectable value. */
	min: number;
	/** Maximum selectable value. */
	max: number;
	/** Current `[low, high]` selection. */
	value: [number, number];
	/** Called with the new `[low, high]` selection. */
	onChange: (value: [number, number]) => void;
	className?: string;
}
/**
 * Dual-range slider for difficulty/numeric ranges.
 *
 * Keeps the two thumb inputs from crossing and surfaces the current bounds
 * via reference-styled labels. Styling relies on the `accent` color and the
 * reference CSS variables.
 */
export function Slider({min, max, value, onChange, className}: SliderProps) {
	const [minValue, maxValue] = value;
	const handleMinChange = (event: ChangeEvent<HTMLInputElement>) => {
		const next = Math.min(Number(event.target.value), maxValue - 1);
		onChange([next, maxValue]);
	};
	const handleMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
		const next = Math.max(Number(event.target.value), minValue + 1);
		onChange([minValue, next]);
	};
	return (
		<div className={cn('slider', className)}>
			<div className="slider-row">
				<label className="slider-label">Min: {minValue}</label>
				<input type="range" min={min} max={max} value={minValue} onChange={handleMinChange} className="slider-input" />
			</div>
			<div className="slider-row">
				<label className="slider-label">Max: {maxValue}</label>
				<input type="range" min={min} max={max} value={maxValue} onChange={handleMaxChange} className="slider-input" />
			</div>
		</div>
	);
}
