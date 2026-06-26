import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from 'react';
import {cn} from '../../lib/utils';
import {Spinner} from './Spinner';
/** Visual style of a button, mapping to reference CSS classes. */
export type ButtonVariant = 'primary' | 'secondary' | 'icon';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	/** Reference class applied: `primary`→`.primary-button`, `secondary`→`.secondary-button`, `icon`→`.icon-button`. */
	variant?: ButtonVariant;
	/** Show a spinner and disable interaction while pending. */
	isLoading?: boolean;
	/** Optional leading icon rendered before the label. */
	leftIcon?: ReactNode;
	/** Optional trailing icon rendered after the label. */
	rightIcon?: ReactNode;
}
/**
 * Button primitive bound to reference CSS classes.
 *
 * The `primary`/`secondary`/`icon` variants map directly to `.primary-button`,
 * `.secondary-button` and `.icon-button` so hover, active and focus styling
 * come from the ported reference stylesheet.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{variant = 'primary', isLoading = false, leftIcon, rightIcon, className, children, disabled, type = 'button', ...props},
	ref
) {
	const variantClass = variant === 'primary' ? 'primary-button' : variant === 'secondary' ? 'secondary-button' : 'icon-button';
	return (
		<button ref={ref} type={type} className={cn(variantClass, className)} disabled={disabled || isLoading} {...props}>
			{isLoading && <Spinner size="sm" />}
			{!isLoading && leftIcon && <span className="button-icon">{leftIcon}</span>}
			{children}
			{!isLoading && rightIcon && <span className="button-icon">{rightIcon}</span>}
		</button>
	);
});
