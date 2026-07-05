import {forwardRef, type ReactNode, type ElementType, type ComponentPropsWithoutRef, type ComponentRef, type ReactElement, type Ref, type HTMLAttributes} from "react";
import {cn} from "../../lib/utils";
/** Visual style of a card surface. */
export type CardVariant="default" | "hover" | "filled" | "outline" | "layer-02";
/** Available card padding densities. */
export type CardPadding="none" | "sm" | "md" | "lg" | "xl";
/** Props owned by the Card primitive (omitted from the rendered element). */
export interface CardOwnProps {
	/** Element type rendered by the polymorphic card. */
	as?: ElementType;
	/** Visual style; defaults to default. */
	variant?: CardVariant;
	/** Padding density; defaults to md. */
	padding?: CardPadding;
	/** Extra classes appended to the card. */
	className?: string;
	/** Card body. */
	children?: ReactNode;
}
/** Polymorphic Card props. */
export type CardProps<T extends ElementType="div">=CardOwnProps & Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps>;
const variantStyles: Record<CardVariant, string>={
	default: "bg-surface border border-border shadow-rest",
	hover: "bg-surface border border-border shadow-rest transition-all duration-normal ease-standard hover:-translate-y-0.5 hover:shadow-hover",
	filled: "bg-surface-elevated border border-border shadow-rest",
	outline: "bg-transparent border border-border",
	"layer-02": "bg-[rgb(var(--layer-02))] border border-border shadow-rest",
};
const paddingStyles: Record<CardPadding, string>={
	none: "p-0",
	sm: "p-2",
	md: "p-3",
	lg: "p-4",
	xl: "p-5",
};
/**
 * Polymorphic surface container with variants, padding, and design-token styling.
 *
 * The legacy `.card` class is preserved on the element for backwards compatibility
 * with existing global CSS, while Tailwind utilities provide the consistent base
 * appearance defined by the redesign tokens.
 */
export const Card=forwardRef<HTMLElement, CardProps<ElementType>>(function Card(
	{as, variant="default", padding="md", className, children, ...props}: CardProps<ElementType>,
	ref,
) {
	const Component=as || "div";
	const base="card relative overflow-hidden rounded-lg";
	return <Component ref={ref as Ref<ComponentRef<typeof Component>>} className={cn(base, variantStyles[variant], paddingStyles[padding], className)} {...props}>{children}</Component>;
}) as <T extends ElementType="div">(props: CardProps<T> & {ref?: Ref<ComponentRef<T>>}) => ReactElement | null;
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
	/** Header content. */
	children?: ReactNode;
}
/** Card header mapped to `.card-header` (flex space-between row). */
export function CardHeader({className, children, ...props}: CardHeaderProps) {
	return <div className={cn("card-header flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2", className)} {...props}>{children}</div>;
}
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
	/** Title text or nodes. */
	children?: ReactNode;
}
/** Card title mapped to `.card-title`. */
export function CardTitle({className, children, ...props}: CardTitleProps) {
	return <h2 className={cn("card-title text-sm font-semibold text-text-primary", className)} {...props}>{children}</h2>;
}
export interface CardSubtitleProps extends HTMLAttributes<HTMLDivElement> {
	/** Subtitle text or nodes. */
	children?: ReactNode;
}
/** Card subtitle mapped to `.card-subtitle`. */
export function CardSubtitle({className, children, ...props}: CardSubtitleProps) {
	return <div className={cn("card-subtitle text-xs font-medium text-text-secondary", className)} {...props}>{children}</div>;
}
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
	/** Content body. */
	children?: ReactNode;
}
/** Card body region mapped to `.card-content`. */
export function CardContent({className, children, ...props}: CardContentProps) {
	return <div className={cn("card-content w-full p-3", className)} {...props}>{children}</div>;
}
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
	/** Footer content. */
	children?: ReactNode;
}
/** Card footer region (generic flex row). */
export function CardFooter({className, children, ...props}: CardFooterProps) {
	return <div className={cn("card-footer flex items-center justify-end gap-2 border-t border-border-subtle px-3 py-2", className)} {...props}>{children}</div>;
}
