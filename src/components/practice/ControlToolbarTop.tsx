import {ToolbarRow} from "../ui";
import {ModeSelector} from "./ModeSelector";
import {TopicsSection} from "./TopicsSection";
import {McqToggle} from "./McqToggle";
/**
 * Top row of the control toolbar.
 *
 * Composes the mode selector (Single/Mental), the topics section (search +
 * topic pills from the parsed spec), and the MCQ toggle. Global utility
 * actions have been moved to the top navigation bar so the toolbar stays
 * focused on practice controls.
 */
export function ControlToolbarTop() {
    return (
        <ToolbarRow position="top">
            <ModeSelector />
            <TopicsSection />
            <McqToggle />
        </ToolbarRow>
    );
}
