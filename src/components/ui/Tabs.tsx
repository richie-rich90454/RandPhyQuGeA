import {createContext, forwardRef, type FunctionComponent, type KeyboardEvent, type ReactNode, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from "react";
import {cn} from "../../lib/utils";
export interface TabsProps {
	/** Controlled active tab value. */
	value?: string;
	/** Default active tab value (uncontrolled). */
	defaultValue?: string;
	/** Change handler for controlled usage. */
	onValueChange?: (value: string) => void;
	/** Tab children (`TabsList` and `TabsContent` elements). */
	children?: ReactNode;
	/** Additional class for the root element. */
	className?: string;
	/** Accessible label for the tablist. */
	ariaLabel?: string;
}
interface TabsContextValue {
	value: string;
	setValue: (next: string) => void;
	registerTrigger: (value: string, element: HTMLButtonElement | null) => void;
	focusTrigger: (value: string) => void;
	baseId: string;
	listRef: React.RefObject<HTMLDivElement | null>;
	indicatorStyle: React.CSSProperties;
	setIndicatorStyle: (style: React.CSSProperties) => void;
	ariaLabel?: string;
}
const TabsContext=createContext<TabsContextValue | null>(null);
function useTabsContext(): TabsContextValue {
	const ctx=useContext(TabsContext);
	if (!ctx) throw new Error("Tabs subcomponents must be rendered inside <Tabs>");
	return ctx;
}
/** Root tabs component managing active value, focus, and animated indicator. */
function Tabs({value: controlledValue, defaultValue, onValueChange, children, className, ariaLabel}: TabsProps) {
	const baseId=useId();
	const isControlled=controlledValue !== undefined;
	const [internalValue, setInternalValue]=useState(defaultValue ?? "");
	const activeValue=isControlled ? controlledValue : internalValue;
	const listRef=useRef<HTMLDivElement>(null);
	const [indicatorStyle, setIndicatorStyle]=useState<React.CSSProperties>({});
	const triggersRef=useRef<Map<string, HTMLButtonElement | null>>(new Map());
	const setValue=useCallback((next: string) => {
		if (!isControlled) setInternalValue(next);
		onValueChange?.(next);
	}, [isControlled, onValueChange]);
	const registerTrigger=useCallback((value: string, element: HTMLButtonElement | null) => {
		triggersRef.current.set(value, element);
	}, []);
	const focusTrigger=useCallback((value: string) => {
		triggersRef.current.get(value)?.focus();
	}, []);
	useLayoutEffect(() => {
		const active=triggersRef.current.get(activeValue);
		const list=listRef.current;
		if (!active || !list) {
			setIndicatorStyle({opacity: 0});
			return;
		}
		const listRect=list.getBoundingClientRect();
		const activeRect=active.getBoundingClientRect();
		setIndicatorStyle({
			left: activeRect.left - listRect.left,
			width: activeRect.width,
			opacity: 1,
		});
	}, [activeValue]);
	const ctx=useMemo<TabsContextValue>(() => ({
		value: activeValue,
		setValue,
		registerTrigger,
		focusTrigger,
		baseId,
		listRef,
		indicatorStyle,
		setIndicatorStyle,
		ariaLabel,
	}), [activeValue, setValue, registerTrigger, focusTrigger, baseId, indicatorStyle, ariaLabel]);
	return (
		<TabsContext.Provider value={ctx}>
			<div className={cn("w-full", className)} data-tabs-root="">
				{children}
			</div>
		</TabsContext.Provider>
	);
}
export interface TabsListProps {
	children?: ReactNode;
	className?: string;
}
export const TabsList=forwardRef<HTMLDivElement, TabsListProps>(function TabsList({children, className}, ref) {
	const ctx=useTabsContext();
	const orderedValues=useRef<string[]>([]);
	const [values, setValues]=useState<string[]>([]);
	const register=useCallback((value: string) => {
		if (!orderedValues.current.includes(value)) {
			orderedValues.current.push(value);
			setValues([...orderedValues.current]);
		}
	}, []);
	const unregister=useCallback((value: string) => {
		orderedValues.current=orderedValues.current.filter(v => v !== value);
		setValues([...orderedValues.current]);
	}, []);
	const listCtx=useMemo<TabsListContextValue>(() => ({register, unregister}), [register, unregister]);
	function focusValue(nextValue: string) {
		ctx.setValue(nextValue);
		ctx.focusTrigger(nextValue);
	}
	function moveFocus(delta: number) {
		if (values.length === 0) return;
		const currentIndex=values.findIndex(v => v === ctx.value);
		let nextIndex=currentIndex + delta;
		if (nextIndex < 0) nextIndex=values.length - 1;
		if (nextIndex >= values.length) nextIndex=0;
		const nextValue=values[nextIndex];
		if (nextValue) focusValue(nextValue);
	}
	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		switch (event.key) {
		case "ArrowRight":
		case "ArrowDown":
			event.preventDefault();
			moveFocus(1);
			break;
		case "ArrowLeft":
		case "ArrowUp":
			event.preventDefault();
			moveFocus(-1);
			break;
		case "Home":
			event.preventDefault();
			if (values.length > 0) {
				const first=values[0];
				if (first) focusValue(first);
			}
			break;
		case "End":
			event.preventDefault();
			if (values.length > 0) {
				const last=values[values.length - 1];
				if (last) focusValue(last);
			}
			break;
		}
	}
	return (
		<TabsListContext.Provider value={listCtx}>
			<div
				ref={node => {
					ctx.listRef.current=node;
					if (typeof ref === "function") ref(node);
					else if (ref) ref.current=node;
				}}
				role="tablist"
				aria-label={ctx.ariaLabel}
				onKeyDown={handleKeyDown}
				className={cn("relative inline-flex items-center gap-1 rounded-lg border border-border bg-surface-elevated p-1", className)}>
				{children}
				<div
					className="pointer-events-none absolute bottom-1 h-0.5 rounded-full bg-accent-600 transition-all duration-normal ease-standard"
					style={ctx.indicatorStyle}
					aria-hidden="true"
				/>
			</div>
		</TabsListContext.Provider>
	);
});
interface TabsListContextValue {
	register: (value: string) => void;
	unregister: (value: string) => void;
}
const TabsListContext=createContext<TabsListContextValue | null>(null);
function useTabsListContext(): TabsListContextValue {
	const ctx=useContext(TabsListContext);
	if (!ctx) throw new Error("TabsTrigger must be rendered inside <TabsList>");
	return ctx;
}
export interface TabsTriggerProps {
	value: string;
	children?: ReactNode;
	className?: string;
	disabled?: boolean;
}
export const TabsTrigger=forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger({value, children, className, disabled}, ref) {
	const ctx=useTabsContext();
	const listCtx=useTabsListContext();
	const isActive=ctx.value === value;
	useEffect(() => {
		listCtx.register(value);
		return () => listCtx.unregister(value);
	}, [listCtx, value]);
	return (
		<button
			ref={node => {
				ctx.registerTrigger(value, node);
				if (typeof ref === "function") ref(node);
				else if (ref) ref.current=node;
			}}
			type="button"
			role="tab"
			id={`${ctx.baseId}-trigger-${value}`}
			aria-selected={isActive}
			tabIndex={isActive ? 0 : -1}
			aria-controls={`${ctx.baseId}-panel-${value}`}
			data-tabs-trigger={value}
			disabled={disabled}
			onClick={() => ctx.setValue(value)}
			className={cn(
				"relative z-10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
				isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary hover:bg-surface",
				className,
			)}>
			{children}
		</button>
	);
});
export interface TabsContentProps {
	value: string;
	children?: ReactNode;
	className?: string;
}
export const TabsContent=forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent({value, children, className}, ref) {
	const ctx=useTabsContext();
	const isActive=ctx.value === value;
	if (!isActive) return null;
	return (
		<div
			ref={ref}
			role="tabpanel"
			id={`${ctx.baseId}-panel-${value}`}
			aria-labelledby={`${ctx.baseId}-trigger-${value}`}
			className={cn("mt-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2", className)}>
			{children}
		</div>
	);
});
TabsList.displayName="TabsList";
TabsTrigger.displayName="TabsTrigger";
TabsContent.displayName="TabsContent";
interface TabsComponent extends FunctionComponent<TabsProps> {
	List: typeof TabsList;
	Trigger: typeof TabsTrigger;
	Content: typeof TabsContent;
}
const TabsWithStatics=Tabs as TabsComponent;
TabsWithStatics.List=TabsList;
TabsWithStatics.Trigger=TabsTrigger;
TabsWithStatics.Content=TabsContent;
export {TabsWithStatics as Tabs};
