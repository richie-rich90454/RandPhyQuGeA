import { useReducedMotion as useFramerReducedMotion, type Variants } from "framer-motion";

/**
 * Apple-style spring page transition.
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { type: "spring", stiffness: 300, damping: 30 },
};

/**
 * Simple fade-in.
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

/**
 * Slide-up + fade-in.
 */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Stagger container — pair with `staggerItem` children.
 */
export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.05 } },
};

/**
 * Stagger child — spring-based slide-up.
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 300, damping: 25 },
};

/**
 * Button press feedback.
 */
export const buttonPress = {
  whileTap: { scale: 0.98 },
};

/**
 * Card hover lift.
 */
export const cardHover = {
  whileHover: { y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } },
};

/**
 * Shake animation (e.g., for incorrect answers).
 */
export const shake: Variants = {
  initial: { x: 0 },
  animate: { x: [0, -8, 8, -6, 6, -3, 3, 0] },
  transition: { duration: 0.4 },
};

/**
 * Scale-in with fade.
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring", stiffness: 300, damping: 25 },
};

/**
 * Wrap a variant set so that when the user prefers reduced motion,
 * all animated properties collapse to their final state instantly.
 */
export function useReducedMotionVariants<T extends Variants>(variants: T): T {
  const prefersReduced = useFramerReducedMotion();
  if (!prefersReduced) return variants;
  const instant: Variants = {};
  for (const key of Object.keys(variants)) {
    const value = variants[key as keyof T];
    if (value && typeof value === "object") {
      instant[key] = { ...value, transition: { duration: 0 } };
    } else {
      instant[key] = value;
    }
  }
  return instant as T;
}
