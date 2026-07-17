import type {JSX} from "solid-js";
import {For} from "solid-js";
import {Toolbar, ToolbarItem} from "../ui/Toolbar";
import {Tooltip, TooltipContent, TooltipTrigger} from "../ui/Tooltip";
import {useSettingsStore} from "../../stores/settingsStore";
import type {PracticeMode} from "../../../types/models";
import styles from "./ModeSelector.module.css";
interface ModeOption {
    id: PracticeMode;
    label: string;
    description: string;
}
const MODES: readonly ModeOption[] = [
    {id: "Single", label: "Single", description: "Practice one question at a time"},
    {id: "Mental", label: "Mental", description: "Timed mental math session"},
];
/**
 * Single/Mental mode toggle rendered as a Toolbar.
 *
 * Solid port of {@link ../../../components/practice/ModeSelector}. The active
 * mode is read from and written to the persisted settings store so the rest of
 * the practice surface stays in sync. Each mode button carries a tooltip
 * describing its behavior. The Solid `Toolbar` primitive owns roving-tabindex
 * keyboard navigation, so the items are wrapped in a `<Toolbar>` (the Solid
 * equivalent of the React `ToolbarGroup` wrapper). Setters are invoked through
 * `getState()` so handlers always read the latest store reference.
 */
export function ModeSelector(): JSX.Element {
    let mode = useSettingsStore(s => s.defaultMode);
    let selectMode = (id: PracticeMode) => {
        useSettingsStore.getState().setDefaultMode(id);
    };
    return (
        <Toolbar label="Practice mode" class={styles.toolbar}>
            <For each={MODES}>
                {option => {
                    return (
                        <Tooltip delay={300}>
                            <TooltipTrigger>
                                <ToolbarItem active={mode() === option.id} onClick={() => selectMode(option.id)}>
                                    {option.label}
                                </ToolbarItem>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{option.description}</TooltipContent>
                        </Tooltip>
                    );
                }}
            </For>
        </Toolbar>
    );
}
