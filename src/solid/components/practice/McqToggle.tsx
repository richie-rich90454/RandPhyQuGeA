import type {JSX} from "solid-js";
import {ToolbarGroup} from "../ui/Toolbar";
import {Switch} from "../ui/Switch";
import {Tooltip, TooltipContent, TooltipTrigger} from "../ui/Tooltip";
import {usePracticeStore} from "../../stores/practiceStore";
import styles from "./McqToggle.module.css";
/**
 * Multiple-choice (response-mode) toggle.
 *
 * Solid port of {@link ../../../components/practice/McqToggle}. When enabled,
 * question generation is forced to multiple-choice regardless of the template's
 * default type. Bound to the practice store so the generator and answer card
 * read the same flag. The toggle is enabled for all question types (Phase 1
 * MCQ/FRQ decoupling).
 */
export function McqToggle(): JSX.Element {
	let mcqEnabled=usePracticeStore(s => s.mcqEnabled);
	let handleChange=(checked: boolean) => {
		usePracticeStore.getState().setMcqEnabled(checked);
	};
	return (
		<ToolbarGroup label="Question format" class={styles.group}>
			<Tooltip delay={300}>
				<TooltipTrigger>
					<Switch label="MCQ" checked={mcqEnabled()} onCheckedChange={handleChange} class={styles.switch} />
				</TooltipTrigger>
				<TooltipContent side="bottom">Force multiple-choice questions</TooltipContent>
			</Tooltip>
		</ToolbarGroup>
	);
}
