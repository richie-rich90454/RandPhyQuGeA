import {createContext, forwardRef, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ButtonHTMLAttributes, type ForwardRefExoticComponent, type HTMLAttributes, type KeyboardEvent, type ReactNode, type RefAttributes} from "react";
import {cn} from "../../lib/utils";
interface ToolbarContextValue {
	register: () => number;
	unregister: (id: number) => void;
	setItem: (id: number, el: HTMLButtonElement | null) => void;
	setFocusedId: (id: number | null) => void;
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => number | null;
}
const ToolbarContext = createContext<ToolbarContextValue | null>(null);
let itemIdCounter = 0;
function createToolbarStore() {
	let focusedId: number | null = null;
	const items = new Map<number, HTMLButtonElement>();
	const listeners = new Set<() => void>();
	function emit() {
		listeners.forEach((listener) => listener());
	}
	function register(): number {
		const id = ++itemIdCounter;
		if (focusedId === null) {
			focusedId = id;
			emit();
		}
		return id;
	}
	function unregister(id: number) {
		items.delete(id);
		if (focusedId === id) {
			focusedId = null;
			emit();
		}
	}
	function setItem(id: number, el: HTMLButtonElement | null) {
		if (el) {
			items.set(id, el);
		} else {
			items.delete(id);
		}
	}
	function setFocusedId(id: number | null) {
		if (focusedId !== id) {
			focusedId = id;
			emit();
		}
	}
	function subscribe(listener: () => void) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}
	function getSnapshot() {
		return focusedId;
	}
	function getOrderedItems(): {id: number; el: HTMLButtonElement}[] {
		const entries = Array.from(items.entries())
			.map(([idItem, el]) => ({id: idItem, el}))
			.filter((entry) => entry.el && document.contains(entry.el));
		entries.sort((a, b) => {
			const position = a.el.compareDocumentPosition(b.el);
			return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
		});
		return entries;
	}
	return {register, unregister, setItem, setFocusedId, subscribe, getSnapshot, getOrderedItems};
}
type ToolbarStore = ReturnType<typeof createToolbarStore>;
export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
	/** Toolbar body (rows, groups, items). */
	children?: ReactNode;
	/** Accessible label for the toolbar. */
	label?: string;
}
const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar({children, className, label, ...props}, ref) {
	const storeRef = useRef<ToolbarStore | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createToolbarStore();
	}
	const store = storeRef.current;
	const baseId = useId();
	const focusItem = useCallback((id: number) => {
		const el = store.getOrderedItems().find((entry) => entry.id === id)?.el;
		if (el && document.contains(el)) {
			el.focus();
		}
		store.setFocusedId(id);
	}, [store]);
	const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
		const items = store.getOrderedItems();
		if (items.length === 0) {
			return;
		}
		const current = items.findIndex((entry) => entry.el === document.activeElement);
		if (current === -1) {
			return;
		}
		if (e.key === "ArrowRight" || e.key === "ArrowDown") {
			e.preventDefault();
			const next = items[(current + 1) % items.length];
			if (next) {
				focusItem(next.id);
			}
		} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
			e.preventDefault();
			const prev = items[(current - 1 + items.length) % items.length];
			if (prev) {
				focusItem(prev.id);
			}
		} else if (e.key === "Home") {
			e.preventDefault();
			const first = items[0];
			if (first) {
				focusItem(first.id);
			}
		} else if (e.key === "End") {
			e.preventDefault();
			const last = items[items.length - 1];
			if (last) {
				focusItem(last.id);
			}
		}
	}, [store, focusItem]);
	const value = useMemo<ToolbarContextValue>(() => ({register: store.register, unregister: store.unregister, setItem: store.setItem, setFocusedId: store.setFocusedId, subscribe: store.subscribe, getSnapshot: store.getSnapshot}), [store]);
	return (
		<ToolbarContext.Provider value={value}>
			<div ref={ref} role="toolbar" aria-label={label ?? "Toolbar"} aria-controls={baseId} className={cn("control-toolbar flex flex-col gap-2", className)} onKeyDown={handleKeyDown} {...props}>
				{children}
			</div>
		</ToolbarContext.Provider>
	);
});
export interface ToolbarGroupProps extends HTMLAttributes<HTMLDivElement> {
	/** Group body (items and separators). */
	children?: ReactNode;
	/** Accessible label for the group. */
	label?: string;
}
export function ToolbarGroup({children, className, label, ...props}: ToolbarGroupProps) {
	return <div role="group" aria-label={label} className={cn("toolbar-group inline-flex items-center gap-1", className)} {...props}>{children}</div>;
}
export interface ToolbarItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	/** Item content. */
	children?: ReactNode;
	/** Whether the item is in an active/pressed state. */
	active?: boolean;
}
export const ToolbarItem = forwardRef<HTMLButtonElement, ToolbarItemProps>(function ToolbarItem({children, className, active, onFocus, ...props}, forwardedRef) {
	const ctx = useContext(ToolbarContext);
	const [id] = useState(() => ctx?.register() ?? -1);
	const focusedId = useSyncExternalStore(ctx?.subscribe ?? (() => () => {}), ctx?.getSnapshot ?? (() => null));
	const itemRef = useRef<HTMLButtonElement | null>(null);
	useEffect(() => {
		return () => {
			if (id !== -1 && ctx) {
				ctx.unregister(id);
			}
		};
	}, [id, ctx]);
	const refCallback = useCallback((el: HTMLButtonElement | null) => {
		itemRef.current = el;
		if (id !== -1 && ctx) {
			ctx.setItem(id, el);
		}
		if (typeof forwardedRef === "function") {
			forwardedRef(el);
		} else if (forwardedRef) {
			forwardedRef.current = el;
		}
	}, [id, ctx, forwardedRef]);
	const isFocused = focusedId === id;
	const handleFocus = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
		if (id !== -1 && ctx) {
			ctx.setFocusedId(id);
		}
		onFocus?.(e);
	}, [id, ctx, onFocus]);
	const tabIndex = ctx ? (isFocused ? 0 : -1) : undefined;
	return (
		<button ref={refCallback} type="button" tabIndex={tabIndex} aria-pressed={active} onFocus={handleFocus} className={cn("toolbar-item inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent-600 focus-visible:outline-offset-2 active:scale-[0.98]", active ? "bg-accent-600 text-text-inverse" : "bg-transparent text-text-primary hover:bg-surface-elevated", className)} {...props}>
			{children}
		</button>
	);
});
export interface ToolbarSeparatorProps extends HTMLAttributes<HTMLDivElement> {}
export function ToolbarSeparator({className, ...props}: ToolbarSeparatorProps) {
	return <div role="separator" aria-orientation="vertical" className={cn("toolbar-separator mx-1 h-5 w-px bg-border", className)} {...props} />;
}
export type ToolbarRowPosition = "top" | "bottom";
export interface ToolbarRowProps {
	/** Which reference row class to apply. */
	position?: ToolbarRowPosition;
	children?: ReactNode;
	className?: string;
}
/** Toolbar row mapped to `.toolbar-row-top` or `.toolbar-row-bottom`. */
export function ToolbarRow({position = "top", children, className}: ToolbarRowProps) {
	const rowClass = position === "top" ? "toolbar-row-top" : "toolbar-row-bottom";
	return <div className={cn(rowClass, className)}>{children}</div>;
}
export interface ToolbarSectionProps {
	children?: ReactNode;
	className?: string;
}
/** Flexible toolbar section mapped to `.toolbar-section`. */
export function ToolbarSection({children, className}: ToolbarSectionProps) {
	return <div className={cn("toolbar-section", className)}>{children}</div>;
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
		<h2 className={cn("toolbar-title", className)} id={id}>
			{children}
		</h2>
	);
}
Toolbar.displayName = "Toolbar";
ToolbarItem.displayName = "ToolbarItem";
interface ToolbarComponent extends ForwardRefExoticComponent<ToolbarProps & RefAttributes<HTMLDivElement>> {
	Group: typeof ToolbarGroup;
	Item: typeof ToolbarItem;
	Separator: typeof ToolbarSeparator;
	Row: typeof ToolbarRow;
	Section: typeof ToolbarSection;
	Title: typeof ToolbarTitle;
}
const ToolbarWithStatics = Toolbar as ToolbarComponent;
ToolbarWithStatics.Group = ToolbarGroup;
ToolbarWithStatics.Item = ToolbarItem;
ToolbarWithStatics.Separator = ToolbarSeparator;
ToolbarWithStatics.Row = ToolbarRow;
ToolbarWithStatics.Section = ToolbarSection;
ToolbarWithStatics.Title = ToolbarTitle;
export {ToolbarWithStatics as Toolbar};
