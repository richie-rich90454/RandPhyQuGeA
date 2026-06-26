import {usePracticeStore} from '../../stores/practiceStore';
/**
 * Multiple-choice mode toggle mapped to `.shuffle-toggle`.
 *
 * When enabled, question generation is forced to multiple-choice regardless of
 * the template's default type. Bound to the practice store so the generator
 * and answer card can read the same flag.
 */
export function McqToggle() {
	const mcqEnabled = usePracticeStore(state => state.mcqEnabled);
	const setMcqEnabled = usePracticeStore(state => state.setMcqEnabled);
	return (
		<label className="shuffle-toggle" title="Multiple-choice mode">
			<input type="checkbox" checked={mcqEnabled} onChange={event => setMcqEnabled(event.target.checked)} />
			{' MCQ'}
		</label>
	);
}
