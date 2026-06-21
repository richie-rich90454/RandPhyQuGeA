import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Render a square icon-only button (no horizontal padding). */
  iconOnly?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md",
  secondary:
    "bg-layer-01 text-neutral-800 border border-neutral-200 hover:bg-layer-02 hover:shadow-md dark:text-neutral-100 dark:border-neutral-700",
  outline:
    "bg-layer-01 text-neutral-800 border border-neutral-200 hover:bg-layer-02 hover:shadow-md dark:text-neutral-100 dark:border-neutral-700",
  ghost:
    "text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800",
  danger: "bg-error-600 text-white hover:bg-error-700 hover:shadow-md",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    iconOnly = false,
    className,
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-fast ease-standard focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none",
        variantClasses[variant],
        iconOnly
          ? cn(iconOnlySizeClasses[size], "aspect-square")
          : sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      <AnimatePresence initial={false}>
        {isLoading && (
          <motion.span
            key="loading-spinner"
            initial={{ opacity: 0, width: 0, marginRight: 0 }}
            animate={{ opacity: 1, width: "auto", marginRight: 8 }}
            exit={{ opacity: 0, width: 0, marginRight: 0 }}
            className="inline-flex shrink-0 overflow-hidden"
          >
            <Spinner size="sm" />
          </motion.span>
        )}
      </AnimatePresence>
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </motion.button>
  );
});
