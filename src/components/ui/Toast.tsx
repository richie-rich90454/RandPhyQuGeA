import {createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertCircle, AlertTriangle, CheckCircle, Info, X, type LucideIcon} from 'lucide-react';
import {cn} from '../../lib/utils';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
	message: string;
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
	toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 4000;

const VARIANT_CONFIG: Record<ToastVariant, {Icon: LucideIcon; border: string; iconColor: string}> = {
	success: {
		Icon: CheckCircle,
		border: 'border-l-success-500',
		iconColor: 'text-success-500'
	},
	error: {
		Icon: AlertCircle,
		border: 'border-l-error-500',
		iconColor: 'text-error-500'
	},
	info: {
		Icon: Info,
		border: 'border-l-primary-500',
		iconColor: 'text-primary-500'
	},
	warning: {
		Icon: AlertTriangle,
		border: 'border-l-warning-500',
		iconColor: 'text-warning-500'
	}
};

export interface ToastProviderProps {
	children: ReactNode;
}

export function ToastProvider({children}: ToastProviderProps) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const idCounter = useRef(0);
	const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

	const dismiss = useCallback((id: number) => {
		setToasts(prev => prev.filter(t => t.id !== id));
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
	}, []);

	const toast = useCallback(
		(options: ToastOptions) => {
			const variant = options.variant ?? 'info';
			const duration = options.duration ?? DEFAULT_DURATION;
			const id = ++idCounter.current;
			setToasts(prev => [...prev, {id, message: options.message, variant, duration}]);
			if (duration > 0) {
				const timer = setTimeout(() => dismiss(id), duration);
				timers.current.set(id, timer);
			}
		},
		[dismiss]
	);

	const api = useMemo<ToastApi>(() => ({toast}), [toast]);

	return (
		<ToastContext.Provider value={api}>
			{children}
			<div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2" aria-live="polite" aria-atomic="true">
				<AnimatePresence initial={false}>
					{toasts.map(toastItem => {
						const config = VARIANT_CONFIG[toastItem.variant];
						const Icon = config.Icon;
						return (
							<motion.div
								key={toastItem.id}
								layout
								initial={{opacity: 0, x: 400}}
								animate={{opacity: 1, x: 0}}
								exit={{opacity: 0, x: 400}}
								className={cn(
									'material-light dark:material-dark pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 border-neutral-200/60 px-4 py-3 shadow-lg dark:border-neutral-700/60',
									config.border
								)}
								role="status"
							>
								<Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconColor)} />
								<p className="flex-1 text-sm text-neutral-900 dark:text-neutral-100">{toastItem.message}</p>
								<button
									type="button"
									onClick={() => dismiss(toastItem.id)}
									className="shrink-0 rounded p-0.5 text-neutral-500 transition-colors hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-neutral-400 dark:hover:text-neutral-100"
									aria-label="Dismiss notification"
								>
									<X className="h-4 w-4" />
								</button>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
}

export function useToast(): ToastApi {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return ctx;
}
