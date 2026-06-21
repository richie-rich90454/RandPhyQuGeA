import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  /** Auto-dismiss duration in ms. Set to 0 to disable. Defaults to 4000. */
  duration?: number;
}

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
  duration: number;
}

interface ToastApi {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 4000;

const VARIANT_CONFIG: Record<
  ToastVariant,
  { Icon: LucideIcon; border: string; iconColor: string }
> = {
  success: {
    Icon: CheckCircle,
    border: "border-l-success-600",
    iconColor: "text-success-600",
  },
  error: {
    Icon: AlertCircle,
    border: "border-l-error-600",
    iconColor: "text-error-600",
  },
  info: {
    Icon: Info,
    border: "border-l-primary-600",
    iconColor: "text-primary-600",
  },
  warning: {
    Icon: AlertTriangle,
    border: "border-l-warning-600",
    iconColor: "text-warning-600",
  },
};

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounter = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (variant: ToastVariant, message: string, options?: ToastOptions) => {
      const id = ++idCounter.current;
      const duration = options?.duration ?? DEFAULT_DURATION;
      setToasts((prev) => [...prev, { id, variant, message, duration }]);
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => show("success", message, options),
      error: (message, options) => show("error", message, options),
      info: (message, options) => show("info", message, options),
      warning: (message, options) => show("warning", message, options),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const config = VARIANT_CONFIG[toast.variant];
            const Icon = config.Icon;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 320 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 320 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "material-light dark:material-dark pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 p-3 shadow-lg",
                  config.border
                )}
                role="status"
              >
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconColor)} />
                <p className="flex-1 text-sm text-neutral-900 dark:text-neutral-100">
                  {toast.message}
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 rounded p-0.5 text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
