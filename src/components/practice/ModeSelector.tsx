import {useSettingsStore} from "../../stores/settingsStore";
import type {PracticeMode} from "../../types/models";

/** The two selectable practice modes surfaced in the toolbar. */
const MODES: ReadonlyArray<{id: PracticeMode; label: string}> = [
    {id: "Single", label: "Single"},
    {id: "Mental", label: "Mental"},
];

/**
 * Single/Mental mode toggle mapped to `.mode-selector` and `.mode-button`.
 *
 * The active mode is read from and written to the persisted settings store so
 * the rest of the practice surface (bottom-row controls) stays in sync. The
 * authoritative mode for an in-flight session lives on the session object
 * managed by `SessionService`.
 */
export function ModeSelector() {
    const mode = useSettingsStore(state => state.defaultMode);
    const setMode = useSettingsStore(state => state.setDefaultMode);
    return (
        <div className="mode-selector" role="group" aria-label="Mode selection">
            {MODES.map(option => (
                <button key={option.id} type="button" className={mode === option.id ? "mode-button active" : "mode-button"} aria-pressed={mode === option.id} onClick={() => setMode(option.id)}>
                    {option.label}
                </button>
            ))}
        </div>
    );
}
