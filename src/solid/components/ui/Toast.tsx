import type {JSX, JSXElement} from "solid-js";
import {For, createContext, createSignal, onCleanup, useContext} from "solid-js";
import {Portal} from "solid-js/web";
import styles from "./Toast.module.css";
export type ToastVariant="success" | "error" | "info" | "warning";
export interface ToastOptions {
	/** Message text shown in the toast body. */
	message: string;
	/** Visual intent of the toast. */
	variant?: ToastVariant;
	/** Auto-dismiss duration in ms. Set to 0 to disable. Defaults to 4000. */
	duration?: number;
}
interface ToastItem {
	id: number;
	message: string;
	variant: ToastVariant;
	duration: number;
}
interface ToastApi {
	/** Push a new toast onto the stack. */
	toast: (options: ToastOptions) => void;
}
let ToastContext=createContext<ToastApi>();
let DEFAULT_DURATION=4000;
let idCounter=0;
let VARIANT_COLOR: Record<ToastVariant, string>={
	success: "var(--success)",
	error: "var(--danger)",
	warning: "var(--warning)",
	info: "var(--accent)",
};
function ToastIcon(props: {variant: ToastVariant}): JSX.Element {
	let color=VARIANT_COLOR[props.variant] ?? "var(--accent)";
	switch (props.variant) {
		case "success":
			return (
				<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-label="success" aria-hidden="false">
					<circle cx="10" cy="10" r="9" stroke={color} stroke-width="2" />
					<path d="M6 10l3 3 5-6" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			);
		case "error":
			return (
				<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-label="error" aria-hidden="false">
					<circle cx="10" cy="10" r="9" stroke={color} stroke-width="2" />
					<path d="M7 7l6 6M13 7l-6 6" stroke={color} stroke-width="2" stroke-linecap="round" />
				</svg>
			);
		case "warning":
			return (
				<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-label="warning" aria-hidden="false">
					<path d="M10 2l8 14H2z" stroke={color} stroke-width="2" stroke-linejoin="round" />
					<path d="M10 8v4M10 15v.5" stroke={color} stroke-width="2" stroke-linecap="round" />
				</svg>
			);
		case "info":
			return (
				<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-label="info" aria-hidden="false">
					<circle cx="10" cy="10" r="9" stroke={color} stroke-width="2" />
					<path d="M10 9v5M10 6v.5" stroke={color} stroke-width="2" stroke-linecap="round" />
				</svg>
			);
	}
}
export interface ToastProviderProps {
	children?: JSXElement;
}
/** Toast notification provider rendering a fixed top-right stack via Portal. */
export function ToastProvider(props: ToastProviderProps): JSX.Element {
	let [toasts, setToasts]=createSignal<ToastItem[]>([]);
	let timers=new Map<number, ReturnType<typeof setTimeout>>();
	let dismiss=(id: number) => {
		setToasts(prev => prev.filter(item => item.id !== id));
		let timer=timers.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.delete(id);
		}
	};
	let toast=(options: ToastOptions) => {
		let variant=options.variant ?? "info";
		let duration=options.duration ?? DEFAULT_DURATION;
		idCounter=idCounter+1;
		let id=idCounter;
		setToasts(prev => [...prev, {id, message: options.message, variant, duration}]);
		if (duration>0) {
			timers.set(id, setTimeout(() => dismiss(id), duration));
		}
	};
	onCleanup(() => {
		timers.forEach(timer => clearTimeout(timer));
		timers.clear();
	});
	let api: ToastApi={toast};
	return (
		<ToastContext.Provider value={api}>
			{props.children}
			<Portal mount={document.body}>
				<div class={styles.stack} role="region" aria-label="Notifications">
					<For each={toasts()}>
						{(item) => {
							let accent=VARIANT_COLOR[item.variant] ?? "var(--accent)";
							let live: "assertive" | "polite"=item.variant === "error" || item.variant === "warning" ? "assertive" : "polite";
							return (
								<div class={styles.toast} style={`border-left: 4px solid ${accent};`} role="status" aria-live={live}>
									<ToastIcon variant={item.variant} />
									<p class={styles.message}>{item.message}</p>
									<button type="button" class={styles.close} aria-label="Dismiss notification" onClick={() => dismiss(item.id)}>
										<span aria-hidden="true">×</span>
									</button>
								</div>
							);
						}}
					</For>
				</div>
			</Portal>
		</ToastContext.Provider>
	);
}
/** Access the toast API. Must be used inside a `ToastProvider`. */
export function useToast(): ToastApi {
	let ctx=useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within a ToastProvider");
	return ctx;
}
