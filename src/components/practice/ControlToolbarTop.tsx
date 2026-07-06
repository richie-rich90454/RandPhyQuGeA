import {ToolbarRow, ToolbarSeparator} from "../ui";
import {ModeSelector} from "./ModeSelector";
import {TopicsSection} from "./TopicsSection";
import {McqToggle} from "./McqToggle";

/**
 * Top row of the control toolbar.
 *
 * Composes the mode selector, the topics section, and the MCQ toggle into
 * distinct Toolbar groups separated by vertical separators. Global utility
 * actions have been moved to the top navigation bar so the toolbar stays
 * focused on practice controls.
 */
export function ControlToolbarTop() {
    return (
        <ToolbarRow position="top">
            <ModeSelector />
            <ToolbarSeparator />
            <TopicsSection />
            <ToolbarSeparator />
            <McqToggle />
        </ToolbarRow>
    );
}
