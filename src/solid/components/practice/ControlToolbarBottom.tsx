import type {JSX, JSXElement} from "solid-js";
import {Show, createMemo} from "solid-js";
import {ToolbarRow} from "../ui/Toolbar";
import {usePracticeStore, selectIsActive, selectMode} from "../../stores/practiceStore";
import {useSettingsStore} from "../../stores/settingsStore";
import type {PracticeMode} from "../../../types/models";
import styles from "./ControlToolbarBottom.module.css";
export interface ControlToolbarBottomProps {
	/** Controls rendered when the active mode is Single. Supplied by the caller. */
	singleControls?: JSXElement;
	/** Controls rendered when the active mode is Mental. Supplied by the caller. */
	mentalControls?: JSXElement;
	/** Extra class for the row. */
	class?: string;
}
/**
 * Bottom row of the control toolbar.
 *
 * Solid port of {@link ../../../components/practice/ControlToolbarBottom}. Renders
 * a `ToolbarRow position="bottom"` and switches between the Single-mode and
 * Mental-mode control slots depending on the active session mode (when a session
 * is running) or the user's default mode preference (when no session is active).
 * The concrete control trees are supplied via the `singleControls` /
 * `mentalControls` slots so this shell stays decoupled from those components.
 * Framer Motion animations are replaced by CSS transitions handled by the slots.
 */
export function ControlToolbarBottom(props: ControlToolbarBottomProps): JSX.Element {
	let isActive=usePracticeStore(selectIsActive);
	let sessionMode=usePracticeStore(selectMode);
	let defaultMode=useSettingsStore(s => s.defaultMode);
	let mode=createMemo<PracticeMode>(() => (isActive() ? sessionMode() : defaultMode()));
	return (
		<ToolbarRow position="bottom" class={`${styles.row} ${props.class ?? ""}`}>
			<Show when={mode()==="Single"} fallback={props.mentalControls}>
				{props.singleControls}
			</Show>
		</ToolbarRow>
	);
}
