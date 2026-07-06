import {usePracticeStore} from "../../stores/practiceStore";
import {Switch, ToolbarGroup, Tooltip, TooltipContent, TooltipTrigger} from "../ui";

/**
 * Multiple-choice mode toggle rendered as a Toolbar group.
 *
 * When enabled, question generation is forced to multiple-choice regardless of
 * the template's default type. Bound to the practice store so the generator
 * and answer card can read the same flag.
 */
export function McqToggle() {
    const mcqEnabled = usePracticeStore(state => state.mcqEnabled);
    const setMcqEnabled = usePracticeStore(state => state.setMcqEnabled);
    return (
        <ToolbarGroup label="Question format" className="options-group">
            <Tooltip delay={300}>
                <TooltipTrigger>
                    <Switch label="MCQ" checked={mcqEnabled} onCheckedChange={setMcqEnabled} className="mcq-switch" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Force multiple-choice questions</TooltipContent>
            </Tooltip>
        </ToolbarGroup>
    );
}
