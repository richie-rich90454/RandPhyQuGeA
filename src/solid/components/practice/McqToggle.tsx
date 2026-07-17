import type {JSX} from "solid-js";
import {ToolbarGroup} from "../ui/Toolbar";
import {Switch} from "../ui/Switch";
import {Tooltip, TooltipContent, TooltipTrigger} from "../ui/Tooltip";
import {useSettingsStore} from "../../stores/settingsStore";
import styles from "./McqToggle.module.css";
function handleChange(checked: boolean): void {
    useSettingsStore.getState().setDefaultResponseMode(checked ? "mcq" : "frq");
}
/**
 * Multiple-choice (response-mode) toggle.
 *
 * Solid port of {@link ../../../components/practice/McqToggle}. When enabled,
 * question generation is forced to multiple-choice regardless of the template's
 * default type. Bound to the persisted settings store's `defaultResponseMode`
 * so the generator, answer card, and hot-reconfig primitive all read the same
 * source of truth. The toggle is enabled for all question types (Phase 1
 * MCQ/FRQ decoupling).
 */
export function McqToggle(): JSX.Element {
    let responseMode = useSettingsStore(s => s.defaultResponseMode);
    return (
        <ToolbarGroup label="Question format" class={styles.group}>
            <Tooltip delay={300}>
                <TooltipTrigger>
                    <Switch label="MCQ" checked={responseMode() === "mcq"} onCheckedChange={handleChange} class={styles.switch} />
                </TooltipTrigger>
                <TooltipContent side="bottom">Force multiple-choice questions</TooltipContent>
            </Tooltip>
        </ToolbarGroup>
    );
}
