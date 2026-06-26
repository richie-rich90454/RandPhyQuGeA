import {type ReactNode} from 'react';
import {cn} from '../../lib/utils';
export interface EmptyStateProps {
	/** Decorative icon (typically an inline SVG). */
	icon?: ReactNode;
	/** Primary message text. */
	title: string;
	/** Secondary explanatory text. */
	description?: string;
	/** Optional call-to-action node. */
	action?: ReactNode;
	className?: string;
}
/** Empty-state placeholder mapped to the reference `.empty-state` class. */
export function EmptyState({icon, title, description, action, className}: EmptyStateProps) {
	return (
		<div className={cn('empty-state', className)}>
			{icon}
			<p>{title}</p>
			{description && <p>{description}</p>}
			{action}
		</div>
	);
}
