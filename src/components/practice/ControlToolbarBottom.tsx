import {ToolbarRow} from "../ui";
import {usePracticeStore, selectIsActive, selectMode} from "../../stores/practiceStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {SingleControls} from "./SingleControls";
import {MentalControls} from "./MentalControls";

/**
 * Bottom row of the control toolbar.
 *
 * Renders the Single-mode controls or the Mental-mode controls depending on
 * the active session mode (when a session is running) or the user's default
 * mode preference (when no session is active).
 */
export function ControlToolbarBottom() {
    const isActive = usePracticeStore(selectIsActive);
    const sessionMode = usePracticeStore(selectMode);
    const defaultMode = useSettingsStore(state => state.defaultMode);
    const mode = isActive ? sessionMode : defaultMode;
    return <ToolbarRow position="bottom">{mode === "Single" ? <SingleControls /> : <MentalControls />}</ToolbarRow>;
}
