import {usePracticeStore} from '../../stores/practiceStore';
import type {PracticeMode} from '../../types/models';
/** The two selectable practice modes surfaced in the toolbar. */
const MODES: ReadonlyArray<{id: PracticeMode; label: string}> = [
	{id: 'Single', label: 'Single'},
	{id: 'Mental', label: 'Mental'}
];
/**
 * Single/Mental mode toggle mapped to `.mode-selector` and `.mode-button`.
 *
 * The active mode is read from and written to the practice store so the rest
 * of the practice surface (bottom-row controls, generation flow) stays in sync.
 */
export function ModeSelector() {
	const mode = usePracticeStore(state => state.mode);
	const setMode = usePracticeStore(state => state.setMode);
	return (
		<div className="mode-selector" role="group" aria-label="Mode selection">
			{MODES.map(option => (
				<button
					key={option.id}
					type="button"
					className={mode === option.id ? 'mode-button active' : 'mode-button'}
					aria-pressed={mode === option.id}
					onClick={() => setMode(option.id)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
