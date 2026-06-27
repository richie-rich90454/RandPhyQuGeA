import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {cn} from '../../lib/utils';
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';
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
	visible: boolean;
}
interface ToastApi {
	/** Push a new toast onto the stack. */
	toast: (options: ToastOptions) => void;
}
const ToastContext = createContext<ToastApi | null>(null);
const DEFAULT_DURATION = 4000;
/** Inline SVG path data for each toast variant. */
const VARIANT_ICON: Record<ToastVariant, string> = {
	success: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
	error: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
	info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
	warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'
};
/** Left-accent color for each toast variant, using reference CSS variables. */
const VARIANT_COLOR: Record<ToastVariant, string> = {
	success: 'var(--success)',
	error: 'var(--error)',
	info: 'var(--primary)',
	warning: 'var(--warning)'
};
export interface ToastProviderProps {
	children: ReactNode;
}
/**
 * Toast notification provider.
 *
 * Renders a fixed top-right stack of toasts styled with the reference surface
 * variables. Replaces the previous framer-motion/lucide implementation with
 * inline SVGs and CSS transitions so no extra dependencies are required.
 */
export function ToastProvider({children}: ToastProviderProps) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const idCounter = useRef(0);
	const timers = useRef<Map<number, {timer: ReturnType<typeof setTimeout>; remaining: number; deadline: number | null}>>(new Map());
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
		[dismiss]
	);
	const toast = useCallback(
		(options: ToastOptions) => {
			const variant = options.variant ?? 'info';
			const duration = options.duration ?? DEFAULT_DURATION;
			const id = ++idCounter.current;
			setToasts(prev => [...prev, {id, message: options.message, variant, duration, visible: false}]);
			requestAnimationFrame(() => {
				setToasts(prev => prev.map(item => (item.id === id ? {...item, visible: true} : item)));
			});
			if (duration > 0) {
				timers.current.set(id, {timer: setTimeout(() => dismiss(id), duration), remaining: duration, deadline: Date.now() + duration});
			}
		},
		[dismiss]
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
			<div className="toast-stack" role="region" aria-live="polite" aria-atomic="false">
				{toasts.map(item => {
					const iconPath = VARIANT_ICON[item.variant];
					const accent = VARIANT_COLOR[item.variant];
					const toastStyle: CSSProperties = {
						borderLeft: `4px solid ${accent}`,
						transform: item.visible ? 'translateX(0)' : 'translateX(120%)',
						opacity: item.visible ? 1 : 0
					};
					return (
						<div
							key={item.id}
							className={cn('toast')}
							style={toastStyle}
							role="status"
							onMouseEnter={() => pause(item.id)}
							onMouseLeave={() => resume(item.id)}
							onFocus={() => pause(item.id)}
							onBlur={() => resume(item.id)}
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill={accent} aria-hidden="true">
								<path d={iconPath} />
							</svg>
							<p className="toast-message">{item.message}</p>
							<button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}>
								✕
							</button>
						</div>
					);
				})}
			</div>
		</ToastContext.Provider>
	);
}
/** Access the toast API. Must be used inside a `ToastProvider`. */
export function useToast(): ToastApi {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return ctx;
}
