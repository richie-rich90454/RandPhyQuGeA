import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode} from "react";
import {motion, AnimatePresence, useReducedMotion} from "framer-motion";
import {CheckCircle, Info, Warning, X, XCircle} from "@phosphor-icons/react";
import {cn} from "../../lib/utils";
export type ToastVariant = "success" | "error" | "info" | "warning";
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
const ToastContext = createContext<ToastApi | null>(null);
const DEFAULT_DURATION = 4000;
/** Phosphor icon component for each toast variant. */
const VARIANT_ICON: Record<ToastVariant, ComponentType<{color?: string; size?: number; "aria-label"?: string}>> = {
	success: CheckCircle,
	error: XCircle,
	warning: Warning,
	info: Info,
};
/** Left-accent color for each toast variant, using reference CSS variables. */
const VARIANT_COLOR: Record<ToastVariant, string> = {
	success: "var(--success)",
	error: "var(--error)",
	info: "var(--primary)",
	warning: "var(--warning)",
};
/** Framer Motion variants for toast enter/exit. */
const toastVariants = {
	hidden: {x: "100%", opacity: 0},
	visible: {x: 0, opacity: 1},
	exit: {x: "100%", opacity: 0},
};
const toastTransition = {duration: 0.25, ease: [0.2, 0, 0, 1] as const};
export interface ToastProviderProps {
	children: ReactNode;
}
/**
 * Toast notification provider.
 *
 * Renders a fixed top-right stack of toasts styled with the reference surface
 * variables. Uses Phosphor icons and Framer Motion for enter/exit animations,
 * with per-variant aria-live regions and pause-on-hover/focus auto-dismiss.
 */
export function ToastProvider({children}: ToastProviderProps) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const idCounter = useRef(0);
	const timers = useRef<Map<number, {timer: ReturnType<typeof setTimeout>; remaining: number; deadline: number | null}>>(new Map());
	const shouldReduceMotion = useReducedMotion();
	const dismiss = useCallback((id: number) => {
		setToasts(prev => prev.filter(item => item.id !== id));
		const entry = timers.current.get(id);
		if (entry) {
			clearTimeout(entry.timer);
			timers.current.delete(id);
		}
	}, []);
	const pause = useCallback((id: number) => {
		const entry = timers.current.get(id);
		if (!entry || entry.deadline === null) return;
		clearTimeout(entry.timer);
		entry.remaining = Math.max(entry.deadline - Date.now(), 0);
		entry.deadline = null;
	}, []);
	const resume = useCallback(
		(id: number) => {
			const entry = timers.current.get(id);
			if (!entry || entry.deadline !== null || entry.remaining <= 0) return;
			entry.deadline = Date.now() + entry.remaining;
			entry.timer = setTimeout(() => dismiss(id), entry.remaining);
		},
		[dismiss],
	);
	const toast = useCallback(
		(options: ToastOptions) => {
			const variant = options.variant ?? "info";
			const duration = options.duration ?? DEFAULT_DURATION;
			const id = ++idCounter.current;
			setToasts(prev => [...prev, {id, message: options.message, variant, duration}]);
			if (duration > 0) {
				timers.current.set(id, {timer: setTimeout(() => dismiss(id), duration), remaining: duration, deadline: Date.now() + duration});
			}
		},
		[dismiss],
	);
	useEffect(() => {
		const map = timers.current;
		return () => {
			map.forEach(entry => clearTimeout(entry.timer));
			map.clear();
		};
	}, []);
	const api = useMemo<ToastApi>(() => ({toast}), [toast]);
	return (
		<ToastContext.Provider value={api}>
			{children}
			<div className="toast-stack" role="region" aria-label="Notifications">
				<AnimatePresence initial={false}>
					{toasts.map(item => {
						const Icon = VARIANT_ICON[item.variant];
						const accent = VARIANT_COLOR[item.variant];
						return (
							<motion.div
								key={item.id}
								className={cn("toast")}
								style={{borderLeft: `4px solid ${accent}`}}
								role="status"
								aria-live={item.variant === "error" || item.variant === "warning" ? "assertive" : "polite"}
								initial="hidden"
								animate="visible"
								exit="exit"
								variants={toastVariants}
								transition={shouldReduceMotion ? {duration: 0} : toastTransition}
								onMouseEnter={() => pause(item.id)}
								onMouseLeave={() => resume(item.id)}
								onFocus={() => pause(item.id)}
								onBlur={() => resume(item.id)}
							>
								<Icon color={accent} size={20} aria-label={item.variant} />
								<p className="toast-message">{item.message}</p>
								<button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}>
									<X weight="bold" size={14} aria-hidden="true" />
								</button>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
}
/** Access the toast API. Must be used inside a `ToastProvider`. */
export function useToast(): ToastApi {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return ctx;
}
