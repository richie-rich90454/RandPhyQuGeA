import {type ChangeEvent, type ReactNode, useId} from "react";
import {cn} from "../../lib/utils";
export interface SliderProps {
	min: number;
	max: number;
	value: [number, number];
	onChange: (value: [number, number]) => void;
	label?: string;
	error?: string;
	hint?: ReactNode;
	className?: string;
}
export function Slider({min, max, value, onChange, label, error, hint, className}: SliderProps) {
	const baseId=useId();
	const labelId=`${baseId}-label`;
	const minInputId=`${baseId}-min`;
	const maxInputId=`${baseId}-max`;
	const errorId=`${baseId}-error`;
	const hintId=`${baseId}-hint`;
	const isCollapsed=min === max;
	const [rawMinValue, rawMaxValue]=value;
	const minValue=isCollapsed ? min : rawMinValue;
	const maxValue=isCollapsed ? max : rawMaxValue;
	const range=max - min;
	const left=range === 0 ? 0 : ((minValue - min) / range) * 100;
	const width=range === 0 ? 0 : ((maxValue - minValue) / range) * 100;
	const describedBy=[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
	const minText=isCollapsed ? `${min}` : `${minValue}`;
	const maxText=isCollapsed ? `${max}` : `${maxValue}`;
	const minAriaLabel=label ? `Minimum ${label}` : "Minimum value";
	const maxAriaLabel=label ? `Maximum ${label}` : "Maximum value";
	const handleMinChange=(event: ChangeEvent<HTMLInputElement>) => {
		if (isCollapsed) return;
		const next=Math.min(Number(event.target.value), maxValue - 1);
		onChange([next, maxValue]);
	};
	const handleMaxChange=(event: ChangeEvent<HTMLInputElement>) => {
		if (isCollapsed) return;
		const next=Math.max(Number(event.target.value), minValue + 1);
		onChange([minValue, next]);
	};
	return (
		<div className={cn("slider w-full", className)}>
			{label && (
				<label id={labelId} htmlFor={minInputId} className="mb-1 block text-sm font-medium text-text-secondary">
					{label}
				</label>
			)}
			<div className="relative h-6 w-full">
				<div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--border)]" />
				<div
					data-testid="slider-filled-track"
					className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--accent-600)]"
					style={{left: `${left}%`, width: `${width}%`}}
				/>
				<input
					id={minInputId}
					type="range"
					min={min}
					max={max}
					value={minValue}
					onChange={handleMinChange}
					aria-label={minAriaLabel}
					aria-valuemin={min}
					aria-valuemax={max}
					aria-valuenow={minValue}
					aria-valuetext={`Minimum value ${minText}`}
					aria-invalid={Boolean(error)}
					aria-describedby={describedBy}
					className="pointer-events-none absolute inset-y-0 left-0 w-full cursor-pointer accent-[var(--accent-600)] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
				/>
				<input
					id={maxInputId}
					type="range"
					min={min}
					max={max}
					value={maxValue}
					onChange={handleMaxChange}
					aria-label={maxAriaLabel}
					aria-valuemin={min}
					aria-valuemax={max}
					aria-valuenow={maxValue}
					aria-valuetext={`Maximum value ${maxText}`}
					aria-invalid={Boolean(error)}
					aria-describedby={describedBy}
					className="pointer-events-none absolute inset-y-0 left-0 w-full cursor-pointer accent-[var(--accent-600)] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
				/>
			</div>
			{error && <p id={errorId} className="mt-1 text-sm text-danger">{error}</p>}
			{hint && <p id={hintId} className="mt-1 text-sm text-text-muted">{hint}</p>}
		</div>
	);
}
