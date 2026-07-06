import {createContext, type CSSProperties, type FunctionComponent, type ReactElement, type ReactNode, type RefObject, cloneElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {motion, AnimatePresence, useReducedMotion} from "framer-motion";
import {cn} from "../../lib/utils";
export type TooltipSide="top" | "bottom" | "left" | "right";
export type TooltipAlign="start" | "center" | "end";
export interface TooltipProps {
	/** Controlled open state. */
	open?: boolean;
	/** Default open state for uncontrolled usage. */
	defaultOpen?: boolean;
	/** Called when the tooltip open state changes. */
	onOpenChange?: (open: boolean) => void;
	/** Tooltip children (`TooltipTrigger` and `TooltipContent`). */
	children?: ReactNode;
	/** Delay before showing the tooltip (ms). */
	delay?: number;
}
interface TooltipContextValue {
	open: boolean;
	setOpen: (next: boolean) => void;
	triggerRef: RefObject<HTMLElement | null>;
	baseId: string;
	delay: number;
}
const TooltipContext=createContext<TooltipContextValue | null>(null);
function useTooltipContext(): TooltipContextValue {
	const ctx=useContext(TooltipContext);
	if (!ctx) throw new Error("Tooltip subcomponents must be rendered inside <Tooltip>");
	return ctx;
}
/** Root tooltip managing open state and trigger reference. */
function Tooltip({open: controlledOpen, defaultOpen=false, onOpenChange, children, delay=150}: TooltipProps) {
	const baseId=useId();
	const isControlled=controlledOpen !== undefined;
	const [internalOpen, setInternalOpen]=useState(defaultOpen);
	const open=isControlled ? controlledOpen : internalOpen;
	const triggerRef=useRef<HTMLElement>(null);
	const setOpen=useCallback((next: boolean) => {
		if (!isControlled) setInternalOpen(next);
		onOpenChange?.(next);
	}, [isControlled, onOpenChange]);
	const ctx=useMemo<TooltipContextValue>(() => ({open, setOpen, triggerRef, baseId, delay}), [open, setOpen, baseId, delay]);
	return <TooltipContext.Provider value={ctx}>{children}</TooltipContext.Provider>;
}
export interface TooltipTriggerProps {
	/** Single child element that receives the tooltip trigger behavior. */
	children: ReactElement;
}
export function TooltipTrigger({children}: TooltipTriggerProps) {
	const ctx=useTooltipContext();
	const tooltipId=`${ctx.baseId}-content`;
	let showTimer: ReturnType<typeof setTimeout> | null=null;
	function handleEnter() {
		showTimer=setTimeout(() => ctx.setOpen(true), ctx.delay);
	}
	function handleLeave() {
		if (showTimer) {
			clearTimeout(showTimer);
			showTimer=null;
		}
		ctx.setOpen(false);
	}
	function handleFocus() {
		ctx.setOpen(true);
	}
	function handleBlur() {
		ctx.setOpen(false);
	}
	return cloneElement(children as ReactElement<{ref?: React.Ref<HTMLElement>; "aria-describedby"?: string; onMouseEnter?: () => void; onMouseLeave?: () => void; onFocus?: () => void; onBlur?: () => void}>, {
		ref: ctx.triggerRef,
		"aria-describedby": ctx.open ? tooltipId : undefined,
		onMouseEnter: handleEnter,
		onMouseLeave: handleLeave,
		onFocus: handleFocus,
		onBlur: handleBlur,
	});
}
export interface TooltipContentProps {
	children?: ReactNode;
	className?: string;
	/** Preferred side relative to the trigger. */
	side?: TooltipSide;
	/** Alignment along the chosen side. */
	align?: TooltipAlign;
	/** Offset from the trigger in pixels. */
	arrowPadding?: number;
}
export function TooltipContent({children, className, side="top", align="center", arrowPadding=8}: TooltipContentProps) {
	const ctx=useTooltipContext();
	const tooltipId=`${ctx.baseId}-content`;
	const contentRef=useRef<HTMLDivElement>(null);
	const [style, setStyle]=useState<CSSProperties>({position: "fixed", top: 0, left: 0, opacity: 0, pointerEvents: "none"});
	const shouldReduceMotion=useReducedMotion() ?? false;
	useEffect(() => {
		if (!ctx.open) return;
		const trigger=ctx.triggerRef.current;
		const content=contentRef.current;
		if (!trigger || !content) return;
		const triggerRect=trigger.getBoundingClientRect();
		const contentRect=content.getBoundingClientRect();
		let top=0;
		let left=0;
		switch (side) {
		case "top":
			top=triggerRect.top - contentRect.height - arrowPadding;
			break;
		case "bottom":
			top=triggerRect.bottom + arrowPadding;
			break;
		case "left":
			left=triggerRect.left - contentRect.width - arrowPadding;
			break;
		case "right":
			left=triggerRect.right + arrowPadding;
			break;
		}
		switch (side) {
		case "top":
		case "bottom":
			if (align === "start") left=triggerRect.left;
			else if (align === "center") left=triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
			else left=triggerRect.right - contentRect.width;
			break;
		case "left":
		case "right":
			if (align === "start") top=triggerRect.top;
			else if (align === "center") top=triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
			else top=triggerRect.bottom - contentRect.height;
			break;
		}
		const padding=8;
		top=Math.max(padding, Math.min(top, window.innerHeight - contentRect.height - padding));
		left=Math.max(padding, Math.min(left, window.innerWidth - contentRect.width - padding));
		setStyle({position: "fixed", top, left, opacity: 1, pointerEvents: "auto", zIndex: 50});
	}, [ctx.open, ctx.triggerRef, side, align, arrowPadding]);
	return createPortal(
		<AnimatePresence>
			{ctx.open && (
				<motion.div
					ref={contentRef}
					id={tooltipId}
					role="tooltip"
					style={style}
					initial={shouldReduceMotion ? {opacity: 1} : {opacity: 0, scale: 0.96, y: side === "top" ? 4 : side === "bottom" ? -4 : 0, x: side === "left" ? 4 : side === "right" ? -4 : 0}}
					animate={{opacity: 1, scale: 1, y: 0, x: 0}}
					exit={shouldReduceMotion ? {opacity: 0} : {opacity: 0, scale: 0.96, y: side === "top" ? 4 : side === "bottom" ? -4 : 0, x: side === "left" ? 4 : side === "right" ? -4 : 0}}
					transition={{duration: shouldReduceMotion ? 0.05 : 0.15, ease: [0.2, 0, 0, 1]}}
					className={cn("max-w-xs rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary shadow-elevated", className)}>
					{children}
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
}
TooltipTrigger.displayName="TooltipTrigger";
TooltipContent.displayName="TooltipContent";
interface TooltipComponent extends FunctionComponent<TooltipProps> {
	Trigger: typeof TooltipTrigger;
	Content: typeof TooltipContent;
}
const TooltipWithStatics=Tooltip as TooltipComponent;
TooltipWithStatics.Trigger=TooltipTrigger;
TooltipWithStatics.Content=TooltipContent;
export {TooltipWithStatics as Tooltip};
