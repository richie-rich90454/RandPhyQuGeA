import {ReactNode, ElementType} from 'react';
import {cn} from '../../lib/utils';

export interface CardProps {
	className?: string;
	children?: ReactNode;
	as?: ElementType;
}

export function Card({className, children, as: Component = 'div'}: CardProps) {
	return <Component className={cn('rounded-lg bg-white p-4 shadow dark:bg-neutral-800', className)}>{children}</Component>;
}

export function CardHeader({className, children}: {className?: string; children?: ReactNode}) {
	return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({className, children}: {className?: string; children?: ReactNode}) {
	return <h3 className={cn('text-h3 text-neutral-900 dark:text-neutral-100', className)}>{children}</h3>;
}

export function CardContent({className, children}: {className?: string; children?: ReactNode}) {
	return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({className, children}: {className?: string; children?: ReactNode}) {
	return <div className={cn('mt-4 flex items-center', className)}>{children}</div>;
}
