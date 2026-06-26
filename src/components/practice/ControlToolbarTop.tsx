import {ToolbarRow} from '../ui';
import {ModeSelector} from './ModeSelector';
import {TopicsSection} from './TopicsSection';
import {UtilityButtons} from './UtilityButtons';
import {McqToggle} from './McqToggle';
/**
 * Top row of the control toolbar.
 *
 * Composes the mode selector (Single/Mental), the topics section (search +
 * topic pills from the parsed spec), the utility icon buttons (theme, help,
 * shortcuts, settings, print, recommend, manage-data) and the MCQ toggle.
 * Mirrors the reference's `.toolbar-row-top` ordering.
 */
export function ControlToolbarTop() {
	return (
		<ToolbarRow position="top">
			<ModeSelector />
			<TopicsSection />
			<UtilityButtons />
			<McqToggle />
		</ToolbarRow>
	);
}
