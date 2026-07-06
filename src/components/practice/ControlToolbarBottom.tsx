import {AnimatePresence, motion} from "framer-motion";
import {ToolbarRow} from "../ui";
import {usePracticeStore, selectIsActive, selectMode} from "../../stores/practiceStore";
import {useSettingsStore} from "../../stores/settingsStore";
import {useReducedMotion} from "../../hooks/useReducedMotion";
import {fadeSlideUp} from "../../lib/motion";
import {SingleControls} from "./SingleControls";
import {MentalControls} from "./MentalControls";
/**
 * Bottom row of the control toolbar.
 *
 * Renders the Single-mode controls or the Mental-mode controls depending on
 * the active session mode (when a session is running) or the user's default
 * mode preference (when no session is active). Mode switches are animated with
 * Framer Motion and respect reduced motion.
 */
export function ControlToolbarBottom() {
    const isActive = usePracticeStore(selectIsActive);
    const sessionMode = usePracticeStore(selectMode);
    const defaultMode = useSettingsStore(state => state.defaultMode);
    const mode = isActive ? sessionMode : defaultMode;
    const {reducedMotion} = useReducedMotion();
    const variants = reducedMotion
        ? {hidden: {opacity: 0}, visible: {opacity: 1}, exit: {opacity: 0}}
        : fadeSlideUp;
    return (
        <ToolbarRow position="bottom">
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    className="w-full"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={variants}
                >
                    {mode === "Single" ? <SingleControls /> : <MentalControls />}
                </motion.div>
            </AnimatePresence>
        </ToolbarRow>
    );
}
