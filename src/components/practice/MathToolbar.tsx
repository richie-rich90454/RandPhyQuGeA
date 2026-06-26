import {useCallback} from 'react';
/**
 * Props for {@link MathToolbar}.
 */
export interface MathToolbarProps {
	/** Called when a symbol button is clicked, with the LaTeX to insert. */
	onInsert: (latex: string) => void;
	/** Disable all buttons (e.g., when no question is loaded). */
	disabled?: boolean;
}
/** Minimal set of basic symbols for Task 15; Task 16 expands to all sections + dropdown. */
const BASIC_SYMBOLS = [
	{latex: '+', label: '+'},
	{latex: '-', label: '\u2212'},
	{latex: '*', label: '\u00d7'},
	{latex: '/', label: '\u00f7'},
	{latex: '=', label: '='},
	{latex: '^{}', label: 'x\u207f'},
	{latex: '\\sqrt{}', label: '\u221a'},
	{latex: '\\frac{}{}', label: '\u2141'},
	{latex: '\\pi', label: '\u03c0'},
	{latex: '\\theta', label: '\u03b8'},
	{latex: '\\sin', label: 'sin'},
	{latex: '\\cos', label: 'cos'}
] as const;
/**
 * Math symbol toolbar mapped to `.math-toolbar`.
 *
 * Task 15 ships a minimal primary row of basic symbols; Task 16 expands this
 * to the full reference set (Basic, Exponents & Roots, Calculus, Greek, Trig &
 * Log, Vectors, Matrices, Logic & Sets, Relations, plus a `⋯` dropdown with
 * advanced sections). Each button calls `onInsert` with the LaTeX to insert at
 * the cursor.
 */
export function MathToolbar({onInsert, disabled = false}: MathToolbarProps) {
	const handleClick = useCallback(
		(latex: string) => {
			if (!disabled) onInsert(latex);
		},
		[onInsert, disabled]
	);
	return (
		<div className="math-toolbar" id="math-toolbar">
			<div className="math-toolbar-row primary-row">
				<div className="math-toolbar-section" title="Basic">
					{BASIC_SYMBOLS.map(symbol => (
						<button key={symbol.latex} type="button" className="math-toolbar-btn" title={symbol.label} disabled={disabled} onClick={() => handleClick(symbol.latex)}>
							{symbol.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
