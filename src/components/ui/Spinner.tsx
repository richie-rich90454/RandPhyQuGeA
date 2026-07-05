import {cn} from "../../lib/utils";
export interface SpinnerProps {
	/** Spinner diameter. */
	size?: "sm" | "md" | "lg";
	/** Additional CSS classes. */
	className?: string;
	/** Whether the spinner is a standalone loading indicator. */
	standalone?: boolean;
}
/** Pixel sizes for each spinner option. */
const sizePx: Record<NonNullable<SpinnerProps["size"]>, number> = {
	sm: 16,
	md: 24,
	lg: 32,
};
/**
 * CSS-only animated spinner.
 *
 * Uses the `.spinner` class from globals.css for the border animation,
 * and scales the element via inline width/height for each size.
 * Decorative inside buttons; set `standalone` for accessible loading status.
 */
export function Spinner({size="md", className, standalone}: SpinnerProps) {
	const px=sizePx[size];
	if (standalone) {
		return (
			<div className={cn("spinner", className)} style={{width: px, height: px}} role="status">
				<span className="visually-hidden">Loading</span>
			</div>
		);
	}
	return (
		<div className={cn("spinner", className)} style={{width: px, height: px}} aria-hidden="true" />
	);
}
