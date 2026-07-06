import {useSettingsStore} from "../../stores/settingsStore";
import {ToolbarGroup, ToolbarItem, Tooltip, TooltipContent, TooltipTrigger} from "../ui";
import type {PracticeMode} from "../../types/models";

const MODES: ReadonlyArray<{id: PracticeMode; label: string; description: string}> = [
    {id: "Single", label: "Single", description: "Practice one question at a time"},
    {id: "Mental", label: "Mental", description: "Timed mental math session"},
];

/**
 * Single/Mental mode toggle rendered as a Toolbar group.
 *
 * The active mode is read from and written to the persisted settings store so
 * the rest of the practice surface stays in sync. Each mode button carries a
 * tooltip describing its behavior.
 */
export function ModeSelector() {
    const mode = useSettingsStore(state => state.defaultMode);
    const setMode = useSettingsStore(state => state.setDefaultMode);
    return (
        <ToolbarGroup label="Practice mode" className="mode-group">
            {MODES.map(option => (
                <Tooltip key={option.id} delay={300}>
                    <TooltipTrigger>
                        <ToolbarItem active={mode === option.id} onClick={() => setMode(option.id)} aria-label={option.label}>
                            {option.label}
                        </ToolbarItem>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{option.description}</TooltipContent>
                </Tooltip>
            ))}
        </ToolbarGroup>
    );
}
