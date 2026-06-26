import type {ReactNode} from 'react';
import {cn} from '../../lib/utils';
export interface CardProps {
	/** Extra classes appended to `.card`. */
	className?: string;
	/** Card body. */
	children?: ReactNode;
}
/** Surface container mapped to the reference `.card` class. */
export function Card({className, children}: CardProps) {
	return <div className={cn('card', className)}>{children}</div>;
}
export interface CardHeaderProps {
	className?: string;
	children?: ReactNode;
}
/** Card header mapped to `.card-header` (flex space-between row). */
export function CardHeader({className, children}: CardHeaderProps) {
	return <div className={cn('card-header', className)}>{children}</div>;
}
export interface CardTitleProps {
	className?: string;
	children?: ReactNode;
}
/** Card title mapped to `.card-title`. */
export function CardTitle({className, children}: CardTitleProps) {
	return <h2 className={cn('card-title', className)}>{children}</h2>;
}
export interface CardSubtitleProps {
	className?: string;
	children?: ReactNode;
}
/** Card subtitle mapped to `.card-subtitle`. */
export function CardSubtitle({className, children}: CardSubtitleProps) {
	return <div className={cn('card-subtitle', className)}>{children}</div>;
}
export interface CardContentProps {
	className?: string;
	children?: ReactNode;
}
/** Card body region mapped to `.card-content`. */
export function CardContent({className, children}: CardContentProps) {
	return <div className={cn('card-content', className)}>{children}</div>;
}
export interface CardFooterProps {
	className?: string;
	children?: ReactNode;
}
/** Card footer region (generic flex row). */
export function CardFooter({className, children}: CardFooterProps) {
	return <div className={cn('card-footer', className)}>{children}</div>;
}
