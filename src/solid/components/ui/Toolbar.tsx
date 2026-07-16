import type {JSX, JSXElement} from "solid-js";
import {createContext, createSignal, splitProps, useContext} from "solid-js";
import styles from "./Toolbar.module.css";
let itemIdCounter = 0;
interface ToolbarContextValue {
	focusedId: () => number | null;
	setFocusedId: (id: number | null) => void;
	register: () => number;
	setItem: (id: number, el: HTMLButtonElement | null) => void;
	getOrderedItems: () => {id: number; el: HTMLButtonElement}[];
}
let ToolbarContext = createContext<ToolbarContextValue>();
function useToolbarContext(): ToolbarContextValue {
	let ctx = useContext(ToolbarContext);
	if (!ctx) throw new Error("Toolbar subcomponents must be rendered inside <Toolbar>");
	return ctx;
}
function createToolbarStore(): ToolbarContextValue {
	let items = new Map<number, HTMLButtonElement>();
	let [focusedId, setFocusedId] = createSignal<number | null>(null);
	let register = (): number => {
		itemIdCounter = itemIdCounter + 1;
		let id = itemIdCounter;
		if (focusedId() === null) {
			setFocusedId(id);
		}
		return id;
	};
	let setItem = (id: number, el: HTMLButtonElement | null) => {
		if (el) {
			items.set(id, el);
		} else {
			items.delete(id);
		}
	};
	let getOrderedItems = (): {id: number; el: HTMLButtonElement}[] => {
		let entries = Array.from(items.entries())
			.map(([id, el]) => ({id, el}))
			.filter(entry => entry.el && document.contains(entry.el));
		entries.sort((a, b) => {
			let position = a.el.compareDocumentPosition(b.el);
			return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
		});
		return entries;
	};
	return {focusedId, setFocusedId, register, setItem, getOrderedItems};
}
export interface ToolbarProps {
	/** Toolbar body (rows, groups, items). */
	children?: JSXElement;
	/** Accessible label for the toolbar. */
	label?: string;
	/** Extra class for the toolbar. */
	class?: string;
}
/** Toolbar container with roving-tabindex keyboard navigation. */
export function Toolbar(props: ToolbarProps): JSX.Element {
	let [local] = splitProps(props, ["children", "label", "class"]);
	let store = createToolbarStore();
	let focusItem = (id: number) => {
		let el = store.getOrderedItems().find(entry => entry.id === id)?.el;
		if (el && document.contains(el)) {
			el.focus();
		}
		store.setFocusedId(id);
	};
	let moveFocus = (delta: number) => {
		let items = store.getOrderedItems();
		if (items.length === 0) return;
		let currentIndex = items.findIndex(entry => entry.el === document.activeElement);
		if (currentIndex === -1) return;
		let nextIndex = currentIndex + delta;
		if (nextIndex < 0) nextIndex = items.length - 1;
		if (nextIndex >= items.length) nextIndex = 0;
		let next = items[nextIndex];
		if (next) focusItem(next.id);
	};
	let handleKeyDown = (event: KeyboardEvent) => {
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
				{
					let items = store.getOrderedItems();
					let first = items[0];
					if (first) focusItem(first.id);
				}
				break;
			case "End":
				event.preventDefault();
				{
					let items = store.getOrderedItems();
					let last = items[items.length - 1];
					if (last) focusItem(last.id);
				}
				break;
		}
	};
	return (
		<ToolbarContext.Provider value={store}>
			<div role="toolbar" aria-label={local.label ?? "Toolbar"} class={`${styles.toolbar} ${local.class ?? ""}`} onKeyDown={handleKeyDown}>
				{local.children}
			</div>
		</ToolbarContext.Provider>
	);
}
export interface ToolbarGroupProps {
	children?: JSXElement;
	label?: string;
	class?: string;
}
export function ToolbarGroup(props: ToolbarGroupProps): JSX.Element {
	let [local] = splitProps(props, ["children", "label", "class"]);
	return (
		<div role="group" aria-label={local.label} class={`${styles.group} ${local.class ?? ""}`}>
			{local.children}
		</div>
	);
}
export interface ToolbarItemProps {
	children?: JSXElement;
	active?: boolean;
	class?: string;
	disabled?: boolean;
	onClick?: () => void;
}
export function ToolbarItem(props: ToolbarItemProps): JSX.Element {
	let [local] = splitProps(props, ["children", "active", "class", "disabled", "onClick"]);
	let ctx = useToolbarContext();
	let id = ctx.register();
	let setRef = (el: HTMLButtonElement | null) => {
		ctx.setItem(id, el);
	};
	let isFocused = () => ctx.focusedId() === id;
	let handleFocus = () => ctx.setFocusedId(id);
	let tabIndex = () => (isFocused() ? 0 : -1);
	return (
		<button
			ref={setRef}
			type="button"
			tabIndex={tabIndex()}
			aria-pressed={local.active}
			disabled={local.disabled}
			onFocus={handleFocus}
			onClick={local.onClick}
			class={`${styles.item} ${local.active ? styles.itemActive : ""} ${local.class ?? ""}`}
		>
			{local.children}
		</button>
	);
}
export interface ToolbarSeparatorProps {
	class?: string;
}
export function ToolbarSeparator(props: ToolbarSeparatorProps): JSX.Element {
	let [local] = splitProps(props, ["class"]);
	// eslint-disable-next-line jsx-a11y/control-has-associated-label -- decorative separator, no label needed
	return <div role="separator" aria-orientation="vertical" class={`${styles.separator} ${local.class ?? ""}`} />;
}
export type ToolbarRowPosition = "top" | "bottom";
export interface ToolbarRowProps {
	position?: ToolbarRowPosition;
	children?: JSXElement;
	class?: string;
}
export function ToolbarRow(props: ToolbarRowProps): JSX.Element {
	let [local] = splitProps(props, ["position", "children", "class"]);
	let position = local.position ?? "top";
	let positionClass = position === "top" ? styles.rowTop : styles.rowBottom;
	return <div class={`${positionClass} ${local.class ?? ""}`}>{local.children}</div>;
}
export interface ToolbarSectionProps {
	children?: JSXElement;
	class?: string;
}
export function ToolbarSection(props: ToolbarSectionProps): JSX.Element {
	let [local] = splitProps(props, ["children", "class"]);
	return <div class={`${styles.section} ${local.class ?? ""}`}>{local.children}</div>;
}
export interface ToolbarTitleProps {
	children?: JSXElement;
	class?: string;
	id?: string;
}
export function ToolbarTitle(props: ToolbarTitleProps): JSX.Element {
	let [local] = splitProps(props, ["children", "class", "id"]);
	return (
		<h2 id={local.id} class={`${styles.title} ${local.class ?? ""}`}>
			{local.children}
		</h2>
	);
}
