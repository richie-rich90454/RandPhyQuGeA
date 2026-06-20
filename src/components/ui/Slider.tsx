import { ChangeEvent } from "react";
import { cn } from "../../lib/utils";

export interface SliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

export function Slider({ min, max, value, onChange, className }: SliderProps) {
  const [minValue, maxValue] = value;

  const handleMinChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), maxValue - 1);
    onChange([newMin, maxValue]);
  };

  const handleMaxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), minValue + 1);
    onChange([minValue, newMax]);
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Min: {minValue}
        </label>
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={handleMinChange}
          className="w-full accent-primary-600"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Max: {maxValue}
        </label>
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={handleMaxChange}
          className="w-full accent-primary-600"
        />
      </div>
    </div>
  );
}
