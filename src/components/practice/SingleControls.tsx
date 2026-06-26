import {useMemo} from 'react';
import {useSingleMode} from '../../hooks/useSingleMode';
import {useSpecStore} from '../../stores/specStore';
import {Select, Spinner} from '../ui';
import type {Specification} from '../../types/models';
/**
 * Build scope-select options from the parsed specification's units, always
 * leading with an "All" option. Returns a single "All" option when no spec
 * is loaded yet.
 */
function buildScopeOptions(specification: Specification | null): {value: string; label: string}[] {
	const options = [{value: 'all', label: 'All'}];
	if (specification) {
		for (const unit of specification.units) {
			options.push({value: unit.id, label: unit.name});
		}
	}
	return options;
}
/** Plus icon path for the Generate button. */
const PLUS_ICON = 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z';
/** Checkmark icon path for the Check button. */
const CHECK_ICON = 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z';
/**
 * Single-mode bottom-row controls mapped to `.toolbar-actions#single-controls`.
 *
 * Renders the Generate (Ctrl+G) and Check (Shift+Enter) buttons, the Auto (3s)
 * toggle, the scope select (options derived from the parsed spec's units), and
 * the Shuffle toggle. State and actions come from {@link useSingleMode}; the
 * generate/check actions are stubbed in Task 14 and wired in Task 17.
 */
export function SingleControls() {
	const {autoEnabled, setAutoEnabled, scope, setScope, shuffle, setShuffle, canCheck, isGenerating, generate, check} = useSingleMode();
	const specification = useSpecStore(state => state.specification);
	const scopeOptions = useMemo(() => buildScopeOptions(specification), [specification]);
	return (
		<div className="toolbar-actions" id="single-controls">
			<div className="single-actions">
				<button type="button" className="primary-button toolbar-button" id="genQ" title="Generate a new question (Ctrl+G)" onClick={generate} disabled={isGenerating} aria-busy={isGenerating}>
					{isGenerating ? (
						<Spinner size="sm" className="button-icon" />
					) : (
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="button-icon" aria-hidden="true">
							<path d={PLUS_ICON} />
						</svg>
					)}
					{isGenerating ? 'Generating…' : 'Generate'}
					<kbd className="shortcut-hint">Ctrl+G</kbd>
				</button>
				<button type="button" className="secondary-button toolbar-button" id="check-answer" disabled={!canCheck} aria-disabled={!canCheck} title="Check your answer (Shift+Enter)" onClick={check}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="button-icon" aria-hidden="true">
						<path d={CHECK_ICON} />
					</svg>
					Check
					<kbd className="shortcut-hint">Shift+Enter</kbd>
				</button>
			</div>
			<div className="auto-controls">
				<label className="auto-toggle" id="auto-label" title="Automatically generate next question after 3 seconds">
					<input type="checkbox" id="autocontinue-toggle" checked={autoEnabled} onChange={event => setAutoEnabled(event.target.checked)} /> Auto (3s)
				</label>
				<Select id="scope-select" variant="scope" aria-label="Scope" title="Select question scope" options={scopeOptions} value={scope} onChange={event => setScope(event.target.value)} />
				<label className="shuffle-toggle" id="shuffle-label" title="Randomly pick topics">
					<input type="checkbox" id="shuffle-toggle" checked={shuffle} onChange={event => setShuffle(event.target.checked)} /> Shuffle
				</label>
			</div>
		</div>
	);
}
