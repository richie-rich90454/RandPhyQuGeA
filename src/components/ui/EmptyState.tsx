import {ReactNode} from 'react';
import {cn} from '../../lib/utils';

export interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({icon, title, description, action, className}: EmptyStateProps) {
	return (
		<div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
			{icon && <div className="mb-4 text-neutral-400">{icon}</div>}
			<h3 className="text-h3 text-neutral-900 dark:text-neutral-100">{title}</h3>
			{description && <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
