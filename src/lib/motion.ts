import type {Variants} from "framer-motion";
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
