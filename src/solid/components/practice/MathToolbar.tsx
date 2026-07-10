import type {JSX} from "solid-js";
import {For, createEffect, createSignal, onCleanup, splitProps} from "solid-js";
import styles from "./MathToolbar.module.css";
export interface MathSymbol {
	latex: string;
	label: string;
	title?: string;
}
export interface SymbolGroup {
	title: string;
	symbols: MathSymbol[];
}
const PRIMARY_GROUPS: readonly SymbolGroup[]=[
	{
		title: "Basic",
		symbols: [
			{latex: "+", label: "+"},
			{latex: "-", label: "\u2212"},
			{latex: "*", label: "\u00d7"},
			{latex: "/", label: "\u00f7"},
			{latex: "=", label: "="},
		],
	},
	{
		title: "Exponents & Roots",
		symbols: [
			{latex: "^{}", label: "x\u207f"},
			{latex: "_{}", label: "x\u2099"},
			{latex: "\\sqrt{}", label: "\u221a"},
			{latex: "\\sqrt[]{}", label: "\u221b"},
			{latex: "\\frac{}{}", label: "\u2141"},
		],
	},
	{
		title: "Calculus",
		symbols: [
			{latex: "\\int", label: "\u222b"},
			{latex: "\\int_{}^{}", label: "\u222b\u2090\u1d47"},
			{latex: "\\sum", label: "\u2211"},
			{latex: "\\prod", label: "\u220f"},
			{latex: "\\lim_{}", label: "lim"},
			{latex: "\\partial", label: "\u2202"},
			{latex: "\\nabla", label: "\u2207"},
			{latex: "\\prime", label: "\u2032"},
		],
	},
	{
		title: "Greek",
		symbols: [
			{latex: "\\alpha", label: "\u03b1"},
			{latex: "\\beta", label: "\u03b2"},
			{latex: "\\gamma", label: "\u03b3"},
			{latex: "\\pi", label: "\u03c0"},
			{latex: "\\theta", label: "\u03b8"},
			{latex: "\\lambda", label: "\u03bb"},
			{latex: "\\mu", label: "\u03bc"},
			{latex: "\\sigma", label: "\u03c3"},
			{latex: "\\omega", label: "\u03c9"},
			{latex: "\\infty", label: "\u221e"},
		],
	},
	{
		title: "Trig & Log",
		symbols: [
			{latex: "\\sin", label: "sin"},
			{latex: "\\cos", label: "cos"},
			{latex: "\\tan", label: "tan"},
			{latex: "\\log", label: "log"},
			{latex: "\\ln", label: "ln"},
			{latex: "\\exp", label: "exp"},
		],
	},
	{
		title: "Vectors",
		symbols: [
			{latex: "\\vec{}", label: "\u2192"},
			{latex: "\\langle", label: "\u27e8"},
			{latex: "\\rangle", label: "\u27e9"},
			{latex: "\\cdot", label: "\u00b7"},
			{latex: "\\times", label: "\u00d7"},
		],
	},
	{
		title: "Matrices",
		symbols: [
			{latex: "\\begin{pmatrix} & \\\\ & \\end{pmatrix}", label: "( )"},
			{latex: "\\begin{bmatrix} & \\\\ & \\end{bmatrix}", label: "[ ]"},
			{latex: "\\dots", label: "\u2026"},
			{latex: "\\vdots", label: "\u22ee"},
		],
	},
	{
		title: "Logic & Sets",
		symbols: [
			{latex: "\\in", label: "\u2208"},
			{latex: "\\notin", label: "\u2209"},
			{latex: "\\subset", label: "\u2282"},
			{latex: "\\subseteq", label: "\u2286"},
			{latex: "\\cup", label: "\u222a"},
			{latex: "\\cap", label: "\u2229"},
			{latex: "\\emptyset", label: "\u2205"},
			{latex: "\\mathbb{R}", label: "\u211d"},
		],
	},
	{
		title: "Relations",
		symbols: [
			{latex: "\\leq", label: "\u2264"},
			{latex: "\\geq", label: "\u2265"},
			{latex: "\\neq", label: "\u2260"},
			{latex: "\\approx", label: "\u2248"},
			{latex: "\\pm", label: "\u00b1"},
		],
	},
];
const DROPDOWN_GROUPS: readonly SymbolGroup[]=[
	{
		title: "Advanced Vectors & Matrices",
		symbols: [
			{latex: "\\overrightarrow{}", label: "\u21e2"},
			{latex: "\\begin{vmatrix} & \\\\ & \\end{vmatrix}", label: "| |"},
			{latex: "\\ddots", label: "\u22f1"},
		],
	},
	{
		title: "More Logic & Sets",
		symbols: [
			{latex: "\\forall", label: "\u2200"},
			{latex: "\\exists", label: "\u2203"},
			{latex: "\\nexists", label: "\u2204"},
			{latex: "\\supset", label: "\u2283"},
			{latex: "\\supseteq", label: "\u2287"},
			{latex: "\\setminus", label: "\\"},
			{latex: "\\mathbb{Z}", label: "\u2124"},
			{latex: "\\mathbb{N}", label: "\u2115"},
			{latex: "\\mathbb{Q}", label: "\u211a"},
			{latex: "\\mathbb{C}", label: "\u2102"},
		],
	},
	{
		title: "Geometry & Special",
		symbols: [
			{latex: "\\angle", label: "\u2220"},
			{latex: "\\triangle", label: "\u25b3"},
			{latex: "\\cong", label: "\u2245"},
			{latex: "\\perp", label: "\u22a5"},
			{latex: "\\parallel", label: "\u2225"},
			{latex: "\\overline{}", label: "\u00af"},
			{latex: "\\hat{}", label: "\u0302"},
			{latex: "\\tilde{}", label: "\u0303"},
			{latex: "\\arcsin", label: "arcsin"},
			{latex: "\\arccos", label: "arccos"},
			{latex: "\\arctan", label: "arctan"},
			{latex: "\\sinh", label: "sinh"},
			{latex: "\\cosh", label: "cosh"},
			{latex: "\\tanh", label: "tanh"},
		],
	},
	{
		title: "Arrows",
		symbols: [
			{latex: "\\to", label: "\u2192"},
			{latex: "\\leftarrow", label: "\u2190"},
			{latex: "\\Rightarrow", label: "\u21d2"},
			{latex: "\\Leftarrow", label: "\u21d0"},
			{latex: "\\leftrightarrow", label: "\u2194"},
			{latex: "\\mapsto", label: "\u21a6"},
			{latex: "\\nearrow", label: "\u2197"},
			{latex: "\\searrow", label: "\u2198"},
			{latex: "\\swarrow", label: "\u2199"},
			{latex: "\\nwarrow", label: "\u2196"},
			{latex: "\\uparrow", label: "\u2191"},
			{latex: "\\downarrow", label: "\u2193"},
			{latex: "\\updownarrow", label: "\u2195"},
		],
	},
];
export interface MathToolbarProps {
	onInsert: (latex: string) => void;
	disabled?: boolean;
}
/**
 * Full math symbol toolbar mapped to `#math-toolbar`.
 *
 * Solid port of {@link ../../../components/practice/MathToolbar}. Data-driven
 * via {@link PRIMARY_GROUPS} and {@link DROPDOWN_GROUPS}: adding a group or
 * symbol is one entry. The primary row renders Basic, Exponents & Roots,
 * Calculus, Greek, Trig & Log, Vectors, Matrices, Logic & Sets, and Relations
 * sections. A `⋯` dropdown trigger reveals Advanced Vectors/Matrices, More
 * Logic & Sets, Geometry & Special, and Arrows sections. Each button calls
 * `onInsert` with the LaTeX to insert at the cursor. Outside-click closes the
 * dropdown via a `createEffect`-driven `mousedown` listener.
 */
export function MathToolbar(props: MathToolbarProps): JSX.Element {
	let [local]=splitProps(props, ["onInsert", "disabled"]);
	let [dropdownOpen, setDropdownOpen]=createSignal(false);
	let dropdownEl: HTMLDivElement | null=null;
	let handleClick=(latex: string) => {
		if (!local.disabled) local.onInsert(latex);
	};
	let toggleDropdown=() => {
		if (!local.disabled) setDropdownOpen(prev => !prev);
	};
	createEffect(() => {
		if (!dropdownOpen()) return;
		let handleOutside=(event: MouseEvent) => {
			if (dropdownEl && !dropdownEl.contains(event.target as Node)) {
				setDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleOutside);
		onCleanup(() => document.removeEventListener("mousedown", handleOutside));
	});
	return (
		<div id="math-toolbar" class={styles.toolbar}>
			<div class={`${styles.row} ${styles.primaryRow}`}>
				<For each={PRIMARY_GROUPS}>{(group) => (
					<div class={styles.section} title={group.title}>
						<For each={group.symbols}>{(symbol) => (
							<button
								type="button"
								class={styles.btn}
								data-symbol={symbol.latex}
								title={symbol.title ?? symbol.label}
								disabled={local.disabled}
								onClick={() => handleClick(symbol.latex)}
							>
								{symbol.label}
							</button>
						)}</For>
					</div>
				)}</For>
				<div class={`${styles.section} ${styles.dropdownTrigger}`} ref={(el: HTMLDivElement) => { dropdownEl=el; }}>
					<button
						type="button"
						class={`${styles.btn} ${styles.dropdownBtn}`}
						id="math-dropdown-btn"
						data-symbol="dropdown"
						title="More symbols"
						aria-label="More symbols"
						aria-haspopup="true"
						aria-expanded={dropdownOpen() ? "true" : "false"}
						aria-controls="math-dropdown"
						disabled={local.disabled}
						onClick={toggleDropdown}
					>
						{"\u22ef"}
					</button>
					<div class={`${styles.dropdown} ${dropdownOpen() ? styles.show : ""}`} id="math-dropdown">
						<div class={styles.dropdownContent}>
							<For each={DROPDOWN_GROUPS}>{(group) => (
								<div class={styles.section} title={group.title}>
									<For each={group.symbols}>{(symbol) => (
										<button
											type="button"
											class={styles.btn}
											data-symbol={symbol.latex}
											title={symbol.title ?? symbol.label}
											disabled={local.disabled}
											onClick={() => {
												handleClick(symbol.latex);
												setDropdownOpen(false);
											}}
										>
											{symbol.label}
										</button>
									)}</For>
								</div>
							)}</For>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
