import {ToolbarRow} from '../ui';
import {usePracticeStore} from '../../stores/practiceStore';
import {SingleControls} from './SingleControls';
import {MentalControls} from './MentalControls';
/**
 * Bottom row of the control toolbar.
 *
 * Renders the Single-mode controls or the Mental-mode controls depending on
 * the current practice mode, mirroring the reference's
 * `.toolbar-row-bottom` which swaps `#single-controls` and
 * `#mental-controls` based on the selected mode.
 */
export function ControlToolbarBottom() {
	const mode = usePracticeStore(state => state.mode);
	return <ToolbarRow position="bottom">{mode === 'Single' ? <SingleControls /> : <MentalControls />}</ToolbarRow>;
}
