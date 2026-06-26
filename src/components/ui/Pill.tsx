import type {ReactNode} from 'react';
import {cn} from '../../lib/utils';
export interface PillProps {
	/** Pill label text. */
	name: string;
	/** Short glyph or code rendered in `.topic-pill-icon`. */
	icon?: ReactNode;
	/** Highlights the pill as selected (adds `.active`). */
	active?: boolean;
	/** Click handler. */
	onClick?: () => void;
	/** Extra classes appended to `.topic-pill`. */
	className?: string;
	/** Accessible label override. */
	ariaLabel?: string;
}
/**
 * Topic pill primitive mapped to `.topic-pill`.
 *
 * The `active` state adds the `.active` class so the reference's primary
 * fill styling applies. The optional `icon` renders inside `.topic-pill-icon`
 * and `name` inside `.topic-pill-name`, mirroring the reference markup.
 */
export function Pill({name, icon, active = false, onClick, className, ariaLabel}: PillProps) {
	return (
		<button type="button" className={cn('topic-pill', active && 'active', className)} onClick={onClick} aria-pressed={active} aria-label={ariaLabel ?? name}>
			{icon && <span className="topic-pill-icon">{icon}</span>}
			<span className="topic-pill-name">{name}</span>
		</button>
	);
}
