import {cn} from '../lib/utils';

export interface DifficultyBadgeProps {
	level: number;
	size?: 'sm' | 'md';
	className?: string;
}

const difficultyStyles: Record<number, string> = {
	1: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
	2: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
	3: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
	4: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
	5: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
	6: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
	7: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300'
};

const sizeStyles: Record<NonNullable<DifficultyBadgeProps['size']>, string> = {
	sm: 'px-2 py-0.5 text-xs',
	md: 'px-2.5 py-1 text-sm'
};

export function DifficultyBadge({level, size = 'md', className}: DifficultyBadgeProps) {
	const colorStyle = difficultyStyles[level] ?? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200';

	return <span className={cn('inline-flex items-center rounded-full font-medium', colorStyle, sizeStyles[size], className)}>Difficulty {level}</span>;
}
