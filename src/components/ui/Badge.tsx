import {ReactNode} from 'react';
import {cn} from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
	variant?: BadgeVariant;
	children: ReactNode;
	className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
	default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100',
	success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
	warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
	error: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200',
	info: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
};

export function Badge({variant = 'default', children, className}: BadgeProps) {
	return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)}>{children}</span>;
}
