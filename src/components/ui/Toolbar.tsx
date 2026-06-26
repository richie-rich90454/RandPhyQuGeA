import type {ReactNode} from 'react';
import {cn} from '../../lib/utils';
export interface ToolbarProps {
	/** Toolbar body (rows and sections). */
	children?: ReactNode;
	/** Extra classes appended to `.control-toolbar`. */
	className?: string;
}
/** Control toolbar container mapped to `.control-toolbar`. */
export function Toolbar({children, className}: ToolbarProps) {
	return <div className={cn('control-toolbar', className)}>{children}</div>;
}
export type ToolbarRowPosition = 'top' | 'bottom';
export interface ToolbarRowProps {
	/** Which reference row class to apply. */
	position?: ToolbarRowPosition;
	children?: ReactNode;
	className?: string;
}
/** Toolbar row mapped to `.toolbar-row-top` or `.toolbar-row-bottom`. */
export function ToolbarRow({position = 'top', children, className}: ToolbarRowProps) {
	const rowClass = position === 'top' ? 'toolbar-row-top' : 'toolbar-row-bottom';
	return <div className={cn(rowClass, className)}>{children}</div>;
}
export interface ToolbarSectionProps {
	children?: ReactNode;
	className?: string;
}
/** Flexible toolbar section mapped to `.toolbar-section`. */
export function ToolbarSection({children, className}: ToolbarSectionProps) {
	return <div className={cn('toolbar-section', className)}>{children}</div>;
}
export interface ToolbarTitleProps {
	children?: ReactNode;
	className?: string;
	/** Heading id for `aria-labelledby` consumers. */
	id?: string;
}
/** Small uppercase toolbar label mapped to `.toolbar-title`. */
export function ToolbarTitle({children, className, id}: ToolbarTitleProps) {
	return (
		<h2 className={cn('toolbar-title', className)} id={id}>
			{children}
		</h2>
	);
}
