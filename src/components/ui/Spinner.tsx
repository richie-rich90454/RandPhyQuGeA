import {cn} from '../../lib/utils';
export interface SpinnerProps {
	/** Spinner diameter. */
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}
/** Pixel sizes for each spinner option. */
const sizePx: Record<NonNullable<SpinnerProps['size']>, number> = {
	sm: 16,
	md: 24,
	lg: 32
};
/**
 * Inline SVG spinner.
 *
 * Uses `currentColor` and a CSS `spin` animation so it inherits the
 * surrounding text color. Marked `aria-hidden` because it is decorative.
 */
export function Spinner({size = 'md', className}: SpinnerProps) {
	const px = sizePx[size];
	return (
		<svg className={cn('spinner', className)} width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
			<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
		</svg>
	);
}
