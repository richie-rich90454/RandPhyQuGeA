import type {Variants} from "framer-motion";
/** Spring-based easing used for playful but controlled micro-interactions. */
const springEase: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
export const fadeIn: Variants = {
	hidden: {opacity: 0},
	visible: {
		opacity: 1,
		transition: {duration: 0.2, ease: [0.2, 0, 0, 1]},
	},
};
export const fadeSlideUp: Variants = {
	hidden: {opacity: 0, y: 12},
	visible: {
		opacity: 1,
		y: 0,
		transition: {duration: 0.25, ease: [0.2, 0, 0, 1]},
	},
};
export const scaleIn: Variants = {
	hidden: {opacity: 0, scale: 0.96},
	visible: {
		opacity: 1,
		scale: 1,
		transition: {duration: 0.2, ease: [0.2, 0, 0, 1]},
	},
};
export const staggerContainer: Variants = {
	hidden: {opacity: 1},
	visible: {
		opacity: 1,
		transition: {staggerChildren: 0.04},
	},
};
export const modalBackdrop: Variants = {
	hidden: {opacity: 0},
	visible: {
		opacity: 1,
		transition: {duration: 0.15, ease: [0.2, 0, 0, 1]},
	},
};
export const modalPanel: Variants = {
	hidden: {opacity: 0, scale: 0.95, y: 8},
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: {duration: 0.2, ease: [0.2, 0, 0, 1]},
	},
};
/** Question card swap: a quick slide-up + fade with a spring settle. */
export const questionSwap: Variants = {
	hidden: {opacity: 0, y: 16, scale: 0.98},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {duration: 0.3, ease: springEase},
	},
	exit: {
		opacity: 0,
		y: -12,
		scale: 0.98,
		transition: {duration: 0.15, ease: [0.2, 0, 0, 1]},
	},
};
/** Feedback panel swap: scale + color entrance. */
export const feedbackSwap: Variants = {
	hidden: {opacity: 0, scale: 0.94},
	visible: {
		opacity: 1,
		scale: 1,
		transition: {duration: 0.25, ease: springEase},
	},
	exit: {
		opacity: 0,
		scale: 0.98,
		transition: {duration: 0.15, ease: [0.2, 0, 0, 1]},
	},
};
/** Gentle horizontal shake for incorrect answers. */
export const shake: Variants = {
	initial: {x: 0},
	shake: {
		x: [0, -6, 6, -6, 6, -3, 3, 0],
		transition: {duration: 0.45, ease: "easeInOut"},
	},
};
