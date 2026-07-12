import type {JSX} from "solid-js";
import {For, Show, createEffect, createSignal, onCleanup, splitProps} from "solid-js";
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
			{latex: "\\pm", label: "\u00b1"},
			{latex: "\\neq", label: "\u2260"},
			{latex: "\\approx", label: "\u2248"},
			{latex: "\\leq", label: "\u2264"},
			{latex: "\\geq", label: "\u2265"},
			{latex: "\\to", label: "\u2192"},
			{latex: "\\infty", label: "\u221e"},
			{latex: "\\frac{}{}", label: "\u2141"},
		],
	},
	{
		title: "Exponents & Roots",
		symbols: [
			{latex: "^{2}", label: "x\u00b2"},
			{latex: "^{}", label: "x\u207f"},
			{latex: "\\sqrt{}", label: "\u221a"},
			{latex: "\\sqrt[3]{}", label: "\u221b"},
			{latex: "\\sqrt[]{}", label: "\u207f\u221a"},
		],
	},
	{
		title: "Calculus",
		symbols: [
			{latex: "\\int", label: "\u222b"},
			{latex: "\\partial", label: "\u2202"},
			{latex: "\\nabla", label: "\u2207"},
			{latex: "\\sum", label: "\u2211"},
			{latex: "\\prod", label: "\u220f"},
			{latex: "\\frac{d}{dx}", label: "d/dx"},
			{latex: "\\lim_{}", label: "lim"},
		],
	},
	{
		title: "Greek",
		symbols: [
			{latex: "\\alpha", label: "\u03b1"},
			{latex: "\\beta", label: "\u03b2"},
			{latex: "\\gamma", label: "\u03b3"},
			{latex: "\\Delta", label: "\u0394"},
			{latex: "\\pi", label: "\u03c0"},
			{latex: "\\theta", label: "\u03b8"},
			{latex: "\\lambda", label: "\u03bb"},
			{latex: "\\mu", label: "\u03bc"},
			{latex: "\\sigma", label: "\u03c3"},
			{latex: "\\phi", label: "\u03c6"},
			{latex: "\\Psi", label: "\u03a8"},
			{latex: "\\Omega", label: "\u03a9"},
		],
	},
	{
		title: "Trig & Log",
		symbols: [
			{latex: "\\sin", label: "sin"},
			{latex: "\\cos", label: "cos"},
			{latex: "\\tan", label: "tan"},
			{latex: "\\sec", label: "sec"},
			{latex: "\\csc", label: "csc"},
			{latex: "\\cot", label: "cot"},
			{latex: "\\arcsin", label: "arcsin"},
			{latex: "\\arccos", label: "arccos"},
			{latex: "\\arctan", label: "arctan"},
			{latex: "\\log", label: "log"},
			{latex: "\\ln", label: "ln"},
			{latex: "\\exp", label: "exp"},
		],
	},
	{
		title: "Vectors",
		symbols: [
			{latex: "\\left\\|\\right\\|", label: "\u2016\u2016"},
			{latex: "\\vec{}", label: "\u2192"},
			{latex: "\\langle", label: "\u27e8"},
			{latex: "\\rangle", label: "\u27e9"},
			{latex: "\\cdot", label: "\u00b7"},
			{latex: "\\times", label: "\u00d7"},
			{latex: "\\nabla", label: "\u2207"},
			{latex: "\\Delta", label: "\u0394"},
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
	{
		title: "Physics",
		symbols: [
			{latex: "\\alpha", label: "\u03b1"},
			{latex: "\\beta", label: "\u03b2"},
			{latex: "\\gamma", label: "\u03b3"},
			{latex: "\\theta", label: "\u03b8"},
			{latex: "\\lambda", label: "\u03bb"},
			{latex: "\\mu", label: "\u03bc"},
			{latex: "\\nu", label: "\u03bd"},
			{latex: "\\rho", label: "\u03c1"},
			{latex: "\\sigma", label: "\u03c3"},
			{latex: "\\tau", label: "\u03c4"},
			{latex: "\\omega", label: "\u03c9"},
			{latex: "\\Delta", label: "\u0394"},
			{latex: "\\nabla", label: "\u2207"},
			{latex: "\\partial", label: "\u2202"},
			{latex: "\\int", label: "\u222b"},
			{latex: "\\sum", label: "\u2211"},
			{latex: "\\Pi", label: "\u03a0"},
			{latex: "^{\\circ}", label: "\u00b0"},
			{latex: "\\text{K}", label: "K"},
			{latex: "\\text{J}", label: "J"},
			{latex: "\\text{N}", label: "N"},
			{latex: "\\text{W}", label: "W"},
			{latex: "\\text{V}", label: "V"},
			{latex: "\\text{A}", label: "A"},
			{latex: "\\text{Hz}", label: "Hz"},
			{latex: "\\text{mol}", label: "mol"},
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
function ChevronIcon(props: {open: boolean}): JSX.Element {
	return (
		<svg
			viewBox="0 0 24 24"
			width="10"
			height="10"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			class={`${styles.chevron} ${props.open ? styles.chevronOpen : ""}`}
			aria-hidden="true"
		>
			<path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}
interface SymbolSectionProps {
	group: SymbolGroup;
	disabled?: boolean;
	onInsert: (latex: string) => void;
	defaultOpen?: boolean;
}
/**
 * Collapsible symbol group with a header button that toggles the symbol body.
 *
 * Defaults to open so all primary symbols remain reachable and discoverable by
 * the test suite. The header carries the group title plus a rotating chevron;
 * the body unmounts when collapsed via `<Show>` so keyboard focus never lands on
 * hidden buttons.
 */
function SymbolSection(props: SymbolSectionProps): JSX.Element {
	let [open, setOpen]=createSignal(props.defaultOpen ?? true);
	let toggle=() => setOpen(prev => !prev);
	return (
		<div class={styles.section} title={props.group.title}>
			<button
				type="button"
				class={styles.sectionHeader}
				aria-expanded={open() ? "true" : "false"}
				onClick={toggle}
			>
				<span class={styles.sectionTitle}>{props.group.title}</span>
				<ChevronIcon open={open()} />
			</button>
			<Show when={open()}>
				<div class={styles.sectionBody}>
					<For each={props.group.symbols}>{(symbol) => (
						<button
							type="button"
							class={styles.btn}
							data-symbol={symbol.latex}
							title={symbol.title ?? symbol.label}
							disabled={props.disabled}
							onClick={() => props.onInsert(symbol.latex)}
						>
							{symbol.label}
						</button>
					)}</For>
				</div>
			</Show>
		</div>
	);
}
/**
 * Full math symbol toolbar mapped to `#math-toolbar`.
 *
 * Solid port of {@link ../../../components/practice/MathToolbar}. Data-driven
 * via {@link PRIMARY_GROUPS} and {@link DROPDOWN_GROUPS}: adding a group or
 * symbol is one entry. The primary row renders Basic, Exponents & Roots,
 * Calculus, Greek, Trig & Log, Vectors, Matrices, Logic & Sets, Relations, and
 * Physics sections. A `⋯` dropdown trigger reveals Advanced Vectors/Matrices,
 * More Logic & Sets, Geometry & Special, and Arrows sections. Each button calls
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
					<SymbolSection group={group} disabled={local.disabled} onInsert={handleClick} />
				)}</For>
				<div class={`${styles.section} ${styles.dropdownTrigger}`} ref={(el: HTMLDivElement) => { dropdownEl=el; }}>
					<button
					type="button"
					class={`${styles.btn} ${styles.dropdownBtn}`}
					id="math-dropdown-btn"
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
