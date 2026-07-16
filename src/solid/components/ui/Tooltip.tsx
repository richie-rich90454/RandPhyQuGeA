import type {JSX, JSXElement} from "solid-js";
import {Show, createContext, createEffect, createMemo, createSignal, onCleanup, splitProps, useContext} from "solid-js";
import {Portal} from "solid-js/web";
import styles from "./Tooltip.module.css";
export type TooltipSide = "top" | "bottom" | "left" | "right";
export type TooltipAlign = "start" | "center" | "end";
let idCounter = 0;
function generateId(): string {
	idCounter = idCounter + 1;
	return `solid-tooltip-${idCounter}`;
}
interface TooltipContextValue {
	open: () => boolean;
	setOpen: (next: boolean) => void;
	triggerRef: () => HTMLElement | null;
	setTriggerRef: (el: HTMLElement | null) => void;
	baseId: string;
	delay: number;
}
let TooltipContext = createContext<TooltipContextValue>();
function useTooltipContext(): TooltipContextValue {
	let ctx = useContext(TooltipContext);
	if (!ctx) throw new Error("Tooltip subcomponents must be rendered inside <Tooltip>");
	return ctx;
}
export interface TooltipProps {
	/** Controlled open state. */
	open?: boolean;
	/** Default open state for uncontrolled usage. */
	defaultOpen?: boolean;
	/** Called when the tooltip open state changes. */
	onOpenChange?: (open: boolean) => void;
	/** Tooltip children (`TooltipTrigger` and `TooltipContent`). */
	children?: JSXElement;
	/** Delay before showing the tooltip (ms). */
	delay?: number;
}
/** Root tooltip managing open state and trigger reference. */
export function Tooltip(props: TooltipProps): JSX.Element {
	let [local] = splitProps(props, ["open", "defaultOpen", "onOpenChange", "children", "delay"]);
	let baseId = generateId();
	let isControlled = () => local.open !== undefined;
	let [internalOpen, setInternalOpen] = createSignal(Boolean(local.defaultOpen));
	let open = createMemo(() => (isControlled() ? Boolean(local.open) : internalOpen()));
	let [triggerEl, setTriggerEl] = createSignal<HTMLElement | null>(null);
	let setOpen = (next: boolean) => {
		if (!isControlled()) {
			setInternalOpen(next);
		}
		local.onOpenChange?.(next);
	};
	let ctx: TooltipContextValue = {
		open,
		setOpen,
		triggerRef: triggerEl,
		setTriggerRef: setTriggerEl,
		baseId,
		delay: local.delay ?? 150,
	};
	return <TooltipContext.Provider value={ctx}>{local.children}</TooltipContext.Provider>;
}
export interface TooltipTriggerProps {
	children?: JSXElement;
	class?: string;
}
export function TooltipTrigger(props: TooltipTriggerProps): JSX.Element {
	let [local] = splitProps(props, ["children", "class"]);
	let ctx = useTooltipContext();
	let tooltipId = () => `${ctx.baseId}-content`;
	let showTimer: ReturnType<typeof setTimeout> | null = null;
	let handleEnter = () => {
		showTimer = setTimeout(() => ctx.setOpen(true), ctx.delay);
	};
	let handleLeave = () => {
		if (showTimer) {
			clearTimeout(showTimer);
			showTimer = null;
		}
		ctx.setOpen(false);
	};
	let handleFocus = () => ctx.setOpen(true);
	let handleBlur = () => ctx.setOpen(false);
	onCleanup(() => {
		if (showTimer) clearTimeout(showTimer);
	});
	let setRef = (el: HTMLSpanElement | null) => {
		ctx.setTriggerRef(el);
	};
	return (
		<span ref={setRef} class={local.class} aria-describedby={ctx.open() ? tooltipId() : undefined} onMouseEnter={handleEnter} onMouseLeave={handleLeave} onFocus={handleFocus} onBlur={handleBlur}>
			{local.children}
		</span>
	);
}
export interface TooltipContentProps {
	children?: JSXElement;
	class?: string;
	/** Preferred side relative to the trigger. */
	side?: TooltipSide;
	/** Alignment along the chosen side. */
	align?: TooltipAlign;
	/** Offset from the trigger in pixels. */
	arrowPadding?: number;
}
export function TooltipContent(props: TooltipContentProps): JSX.Element {
	let [local] = splitProps(props, ["children", "class", "side", "align", "arrowPadding"]);
	let ctx = useTooltipContext();
	let side = local.side ?? "top";
	let align = local.align ?? "center";
	let arrowPadding = local.arrowPadding ?? 8;
	let tooltipId = () => `${ctx.baseId}-content`;
	let [pos, setPos] = createSignal<{top: number; left: number} | null>(null);
	let contentEl: HTMLDivElement | null = null;
	createEffect(() => {
		if (!ctx.open()) return;
		let trigger = ctx.triggerRef();
		if (!trigger || !contentEl) return;
		let triggerRect = trigger.getBoundingClientRect();
		let contentRect = contentEl.getBoundingClientRect();
		let top = 0;
		let left = 0;
		switch (side) {
			case "top":
				top = triggerRect.top - contentRect.height - arrowPadding;
				break;
			case "bottom":
				top = triggerRect.bottom + arrowPadding;
				break;
			case "left":
				left = triggerRect.left - contentRect.width - arrowPadding;
				break;
			case "right":
				left = triggerRect.right + arrowPadding;
				break;
		}
		switch (side) {
			case "top":
			case "bottom":
				if (align === "start") left = triggerRect.left;
				else if (align === "center") left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
				else left = triggerRect.right - contentRect.width;
				break;
			case "left":
			case "right":
				if (align === "start") top = triggerRect.top;
				else if (align === "center") top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
				else top = triggerRect.bottom - contentRect.height;
				break;
		}
		let padding = 8;
		top = Math.max(padding, Math.min(top, window.innerHeight - contentRect.height - padding));
		left = Math.max(padding, Math.min(left, window.innerWidth - contentRect.width - padding));
		setPos({top, left});
	});
	return (
		<Portal mount={document.body}>
			<Show when={ctx.open()}>
				<div
					ref={el => {
						contentEl = el;
					}}
					id={tooltipId()}
					role="tooltip"
					class={`${styles.content} ${local.class ?? ""}`}
					style={pos() ? `top: ${pos()?.top ?? 0}px; left: ${pos()?.left ?? 0}px;` : "top: 0; left: 0; opacity: 0;"}
				>
					{local.children}
				</div>
			</Show>
		</Portal>
	);
}
