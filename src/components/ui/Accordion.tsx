import {createContext, forwardRef, type FunctionComponent, type ReactNode, useCallback, useContext, useId, useMemo, useState} from "react";
import {CaretDown} from "@phosphor-icons/react";
import {cn} from "../../lib/utils";
export interface AccordionProps {
	/** Single open item value (uncontrolled default). */
	defaultValue?: string;
	/** Controlled open item value; provide when type="single". */
	value?: string;
	/** Change handler for controlled single mode. */
	onValueChange?: (value: string) => void;
	/** Accordion children (`AccordionItem` elements). */
	children?: ReactNode;
	/** Additional class for the root element. */
	className?: string;
}
interface AccordionContextValue {
	value: string | undefined;
	setValue: (next: string | undefined) => void;
	baseId: string;
}
const AccordionContext=createContext<AccordionContextValue | null>(null);
function useAccordionContext(): AccordionContextValue {
	const ctx=useContext(AccordionContext);
	if (!ctx) throw new Error("Accordion subcomponents must be rendered inside <Accordion>");
	return ctx;
}
/** Root accordion allowing a single open item at a time. */
function Accordion({defaultValue, value: controlledValue, onValueChange, children, className}: AccordionProps) {
	const baseId=useId();
	const isControlled=controlledValue !== undefined;
	const [internalValue, setInternalValue]=useState<string | undefined>(defaultValue);
	const activeValue=isControlled ? controlledValue : internalValue;
	const setValue=useCallback((next: string | undefined) => {
		if (!isControlled) setInternalValue(next);
		onValueChange?.(next ?? "");
	}, [isControlled, onValueChange]);
	const ctx=useMemo<AccordionContextValue>(() => ({value: activeValue, setValue, baseId}), [activeValue, baseId, setValue]);
	return (
		<AccordionContext.Provider value={ctx}>
			<div className={cn("divide-y divide-border rounded-lg border border-border overflow-hidden", className)} data-accordion-root="">
				{children}
			</div>
		</AccordionContext.Provider>
	);
}
export interface AccordionItemProps {
	value: string;
	children?: ReactNode;
	className?: string;
}
export const AccordionItem=forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem({value, children, className}, ref) {
	const ctx=useAccordionContext();
	const isOpen=ctx.value === value;
	return (
		<div ref={ref} data-accordion-item={value} data-state={isOpen ? "open" : "closed"} className={cn("bg-surface", className)}>
			<ItemValueContext.Provider value={value}>
				{children}
			</ItemValueContext.Provider>
		</div>
	);
});
export interface AccordionTriggerProps {
	children?: ReactNode;
	className?: string;
}
export const AccordionTrigger=forwardRef<HTMLButtonElement, AccordionTriggerProps>(function AccordionTrigger({children, className}, ref) {
	const ctx=useAccordionContext();
	const itemValue=useItemValue();
	const isOpen=ctx.value === itemValue;
	const triggerId=`${ctx.baseId}-trigger-${itemValue}`;
	const contentId=`${ctx.baseId}-content-${itemValue}`;
	return (
		<button
			ref={ref}
			id={triggerId}
			type="button"
			aria-expanded={isOpen}
			aria-controls={contentId}
			className={cn(
				"flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors duration-fast hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset",
				className,
			)}
			onClick={() => ctx.setValue(isOpen ? undefined : itemValue)}>
			{children}
			<CaretDown className={cn("h-4 w-4 text-text-muted transition-transform duration-normal ease-standard", isOpen && "rotate-180")} aria-hidden="true" />
		</button>
	);
});
export interface AccordionContentProps {
	children?: ReactNode;
	className?: string;
}
export const AccordionContent=forwardRef<HTMLDivElement, AccordionContentProps>(function AccordionContent({children, className}, ref) {
	const ctx=useAccordionContext();
	const itemValue=useItemValue();
	const isOpen=ctx.value === itemValue;
	const contentId=`${ctx.baseId}-content-${itemValue}`;
	const triggerId=`${ctx.baseId}-trigger-${itemValue}`;
	return (
		<div
			ref={ref}
			id={contentId}
			role="region"
			aria-labelledby={triggerId}
			data-state={isOpen ? "open" : "closed"}
			className={cn("grid transition-[grid-template-rows] duration-normal ease-standard", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
			<div className={cn("overflow-hidden px-4 text-sm text-text-secondary", className)}>
				<div className="py-3">{children}</div>
			</div>
		</div>
	);
});
const ItemValueContext=createContext<string | null>(null);
function useItemValue(): string {
	const value=useContext(ItemValueContext);
	if (!value) throw new Error("AccordionTrigger and AccordionContent must be rendered inside <AccordionItem>");
	return value;
}
AccordionItem.displayName="AccordionItem";
AccordionTrigger.displayName="AccordionTrigger";
AccordionContent.displayName="AccordionContent";
interface AccordionComponent extends FunctionComponent<AccordionProps> {
	Item: typeof AccordionItem;
	Trigger: typeof AccordionTrigger;
	Content: typeof AccordionContent;
}
const AccordionWithStatics=Accordion as AccordionComponent;
AccordionWithStatics.Item=AccordionItem;
AccordionWithStatics.Trigger=AccordionTrigger;
AccordionWithStatics.Content=AccordionContent;
export {AccordionWithStatics as Accordion};
