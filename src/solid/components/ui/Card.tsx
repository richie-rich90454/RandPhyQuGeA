import type {Component, ComponentProps, JSX} from "solid-js";
import {splitProps} from "solid-js";
import {Dynamic} from "solid-js/web";
import styles from "./Card.module.css";
/** Visual style of a card surface. */
export type CardVariant = "default" | "hover" | "filled" | "outline" | "layer-02";
/** Available card padding densities. */
export type CardPadding = "none" | "sm" | "md" | "lg" | "xl";
export interface CardProps extends ComponentProps<"div"> {
	/** Element type rendered by the polymorphic card. */
	as?: Component | string;
	/** Visual style; defaults to default. */
	variant?: CardVariant;
	/** Padding density; defaults to md. */
	padding?: CardPadding;
}
let variantClass: Record<CardVariant, string | undefined> = {
	default: styles.default,
	hover: styles.hover,
	filled: styles.filled,
	outline: styles.outline,
	"layer-02": styles.layer02,
};
let paddingClass: Record<CardPadding, string | undefined> = {
	none: styles.padNone,
	sm: styles.padSm,
	md: styles.padMd,
	lg: styles.padLg,
	xl: styles.padXl,
};
/** Polymorphic surface container with variants, padding, and design-token styling. */
export function Card(props: CardProps): JSX.Element {
	let [local, others] = splitProps(props, ["as", "variant", "padding", "class", "children"]);
	let variant = local.variant ?? "default";
	let padding = local.padding ?? "md";
	return (
		<Dynamic component={local.as ?? "div"} class={`glass ${styles.card} ${variantClass[variant] ?? ""} ${paddingClass[padding] ?? ""} ${local.class ?? ""}`} {...others}>
			{local.children}
		</Dynamic>
	);
}
export interface CardHeaderProps extends ComponentProps<"div"> {}
/** Card header (flex space-between row). */
export function CardHeader(props: CardHeaderProps): JSX.Element {
	let [local, others] = splitProps(props, ["class", "children"]);
	return (
		<div class={`${styles.header} ${local.class ?? ""}`} {...others}>
			{local.children}
		</div>
	);
}
export interface CardTitleProps extends ComponentProps<"h2"> {}
/** Card title heading. */
export function CardTitle(props: CardTitleProps): JSX.Element {
	let [local, others] = splitProps(props, ["class", "children"]);
	return (
		<h2 class={`${styles.title} ${local.class ?? ""}`} {...others}>
			{local.children}
		</h2>
	);
}
export interface CardSubtitleProps extends ComponentProps<"div"> {}
/** Card subtitle. */
export function CardSubtitle(props: CardSubtitleProps): JSX.Element {
	let [local, others] = splitProps(props, ["class", "children"]);
	return (
		<div class={`${styles.subtitle} ${local.class ?? ""}`} {...others}>
			{local.children}
		</div>
	);
}
export interface CardContentProps extends ComponentProps<"div"> {}
/** Card body region. */
export function CardContent(props: CardContentProps): JSX.Element {
	let [local, others] = splitProps(props, ["class", "children"]);
	return (
		<div class={`${styles.content} ${local.class ?? ""}`} {...others}>
			{local.children}
		</div>
	);
}
export interface CardFooterProps extends ComponentProps<"div"> {}
/** Card footer region (generic flex row). */
export function CardFooter(props: CardFooterProps): JSX.Element {
	let [local, others] = splitProps(props, ["class", "children"]);
	return (
		<div class={`${styles.footer} ${local.class ?? ""}`} {...others}>
			{local.children}
		</div>
	);
}
